

function* genTimerWithCoords(run,coef) {
	let res = 0;
	for(let i = 0 ; i < run.length ; i++) {
		for(let j = run.segments[i].duration ; j > 0; j--) { // to prevent infinity ??
			res += run.segments[i].speed*coef;
			yield getPointFromBeginningAtMeter(res,run);
		}
	}
}


function genTimerRegularWithCoords(run,coef,time) {
	// if (Math.abs(time-run.duration) < 60) {
	// 	// addDotForDotplot(colors[run.index%colors.length],run.duration,loop_listener.orderOfArrival[loop_listener.orderOfArrival.length-1].duration,`${run.index}_${run.num}`);
	// }
	let res = 0;
	for(let i = 0 ; i < run.length ; i++) {
		for(let j = run.segments[i].duration ; j > 0 && j < 1000; j--) { // to prevent infinity ??
			res += run.segments[i].speed*coef;
			if (time < 1) {
				return getPointFromBeginningAtMeter(res,run);
			}
			time--;
		}
	}
	return getPointFromBeginningAtMeter(res,run);
}



/**
 * Handles the animation loop of one run with a dedicated dot/circle
 * @param {SVGElement} draw The path (line on map)
 * @param {number[]} path_coords The coordinates (of a line, on a map) defining the path
 * @param {Segments} run A Segment object representing one run (i.e., multiple segments)
 * @param {number} id The partial id that will be added at the end of the generated dot/circle HTML element's id
 * @param {DOMRect} bounds The object containing information on the size of the path/line HTML elements
 * @param {number} opacity The opacity of the generated dot/circle
 * @param {boolean} creating Whether or not to create/generate the dot/circle
 * @param {DOMRect} svg_bounds The bounds of the SVG element containing the path
 */
function animate(draw,path_coords,run,id,bounds,opacity,creating,svg_bounds) {

	const coef = 1;
	
	const coordinatesGen = genTimerWithCoords(run,coef);
	
	let circle;


	if (creating) {
		const coord_start = routing_control.json_obj_startingpoint[0];

		circle = L.circleMarker(L.latLng(coord_start.lat,coord_start.lon), {
			radius:6, 
			className:"moving-circle",
			fill:true,
			fillColor:colors[run.index%colors.length],
			fillOpacity:opacity,
			stroke:false
		}).addTo(map_instance);
		circle.getElement().id = `circle${run.index}_${id}`;

		input_from_json[run.index].circles.push(circle);
	} else {
		circle = input_from_json[run.index].circles[id];

	}
	

	// let current_speed = playback_speed;
	let loop;
	let done = false;
    let animation_loop = function() {
		if (waiting_to_restart) {
			clearAll();
			return true;
		} else if (currently_hovering >= 0) {
			const temporary_coords = genTimerRegularWithCoords(run,coef,currently_hovering);
			circle.setLatLng(L.latLng(temporary_coords[0],temporary_coords[1]));

			
		} else if (running && !done) {
			try {
				if (global_time > loop_listener.max_duration) {
					const temporary_coords = genTimerRegularWithCoords(run,coef,run.duration);
					circle.setLatLng(L.latLng(temporary_coords[0],temporary_coords[1]));
					temporary_loops[loop] = 1;

					return true;
				}else if (loop_listener.done_once) {
					const temporary_coords = genTimerRegularWithCoords(run,coef,global_time);
					circle.setLatLng(L.latLng(temporary_coords[0],temporary_coords[1]));
				} else {
					const new_coords = coordinatesGen.next().value;
					circle.setLatLng(L.latLng(new_coords[0], new_coords[1]));
				}

			} catch (err) {
				done = true;
				const temporary_coords = genTimerRegularWithCoords(run,coef,run.duration);
				circle.setLatLng(L.latLng(temporary_coords[0],temporary_coords[1]));
				temporary_loops[loop] = 1;
				
				return true;
			}
		}

	};
	
	loop = setInterval(animation_loop,INTERVAL);
	
	all_loops.push(loop);
}


/**
 * Creates the Leaflet routing instance which will in turn simulates data and launch the animation
 * @param {Map} map The map instance
 * @param {number[]} fcoord The coordinates of the starting point
 */
function createRouting(map,fcoord) {
	
	routing_control = L.leafletControlRoutingtoaddress({
        position: 'topright',
        router: 'osrm',
        token: '',
        placeholder: 'Please insert your address here.',
        errormessage: 'Address not valid.',
        distance: 'Entfernung:',
        duration: 'Fahrzeit',
        requesterror: '"Too Many Requests" or "Not Authorized - Invalid Token"',
        port: cityPort(document.getElementById("cities").value)

    });
	routing_control.addTo(map);
	// routing_control._launch(coord);
	if (presaved.length < 1) {
		routing_control._first_point(fcoord);
	}

}


/** 
 * Creates the map based on the city that was selected and starts listening and waiting for coordinates to be clicked on so that path(s) can be generated
 * @param {string} city The name of the city
 */
function startAnimation(city) {
	if (map_instance === null || typeof map_instance === 'undefined') {
		map_instance = L.map('map', {
			zoomControl: false,
			boxZoom: false,
			doubleClickZoom: false,
			scrollWheelZoom: true,
			dragging: true
		}).setView(cityCoordinates(city), 15);
		selectTiles(type_map_selector.value);
		L.control.zoom({
			position: 'topleft'
		}).addTo(map_instance);
		
		let tutorial_marker;
		if(tutorial === 0 || tutorial === 1) {
			document.getElementById("tutorial").innerHTML = "When the map is empty and you click on it, it creates a starting point. Let's say you want to start from where the red marker is. Try clicking on it.";
			tutorial_marker = L.circleMarker([-41.29276613830048,174.7738552093506],{radius:10,color:'red'}).addTo(map_instance);
		}

		map_instance.on('click', async function (e) {
			if (tutorial === 11) {
				document.getElementById("tutorial").innerHTML = "You can also drag a path to add a detour. Try dragging one path on the new red marker.\nDragging a path can be difficult as it requires to be precise with the mouse. Did you notice that the cursor slightly changed when you hovered over a path?";

			}
			
			// console.log([e.latlng.lat, e.latlng.lng]);
			if (tutorial > 0) {
				if (tutorial === 1 && Math.abs(e.latlng.lat + 41.29276613830048) < 0.0003 && Math.abs(e.latlng.lng - 174.7738552093506) < 0.0003) {
					createRouting(map_instance, [-41.29276613830048,174.7738552093506]);
					tutorial_marker.remove();
					tutorial_marker = nextStepTutorial();
				} else if (tutorial === 2 && Math.abs(e.latlng.lat + 41.29237935805799) < 0.0003 && Math.abs(e.latlng.lng - 174.78196620941165) < 0.0003) {
					await routing_control._last_point([-41.29237935805799,174.78196620941165]);
					tutorial_marker.remove();
					nextStepTutorial();
				} else if (tutorial === 10 && Math.abs(e.latlng.lat + 41.29631151699859) < 0.0003 && Math.abs(e.latlng.lng - 174.7795629501343) < 0.0003) {
					task_done = true;
					await clearAll();
					if (routing_control._marker !== null && typeof routing_control._marker !== 'undefined') {
						routing_control._marker.remove();
						routing_control._marker = null;
					}
					await routing_control._launch([[-41.29631151699859, 174.7795629501343]]);
					d3.select("path#circle_marker_tutorial").remove();
					nextStepTutorial();
				} 
				return false;
			}
			if (presaved.length > 0 && requiresClick(preset_key)) {
				if (marker_task) {
					marker_task.remove();
				}
				const my_icon = L.icon({iconUrl: "./images/pin_icon_flat.png", iconSize: [15, 15]});
				marker_task = L.marker([e.latlng.lat,e.latlng.lng], {icon: my_icon}).addTo(map_instance);
				last_click = `[${e.latlng.lat},${e.latlng.lng}]`;
			}
			
			if (presaved.length < 1 && coord.length < 1 && delete_mode_on) {
				delete_mode_on = false;
			}
			if (presaved.length < 1) {
				document.getElementById("map").style.cursor = "";
				if (!delete_mode_on) {
					if (currently_changing_points < 0) {
						coord.push([e.latlng.lat, e.latlng.lng]);
						if (coord.length < 2) {
							createRouting(map_instance, coord[0]);
						} else if (coord.length < 3) {
							await routing_control._last_point(coord[1]);
						} else {
							await clearAll();
							if (routing_control._marker !== null && typeof routing_control._marker !== 'undefined') {
								routing_control._marker.remove();
								routing_control._marker = null;
							}
							await routing_control._launch([[e.latlng.lat, e.latlng.lng]]);
						}
					} else {
						coord[currently_changing_points] = [e.latlng.lat, e.latlng.lng];
						await routing_control._reloadEverything();
					}
				}
			}

		});

		map_instance.on("mouseup", async function (e) {
			if (tutorial >= 0 && tutorial !== 18) {
				if (tutorial === 11 && currently_dragging >= 0 &&  Math.abs(e.latlng.lat + 41.289865230584894) < 0.0008 && Math.abs(e.latlng.lng - 174.77587223052979) < 0.0008) {
					await clearAll();
					if (routing_control._marker !== null && typeof routing_control._marker !== 'undefined') {
						routing_control._marker.remove();
						routing_control._marker = null;
					}
					await routing_control._launch([[-41.289865230584894, 174.77587223052979]]);
					d3.select("path#circle_marker_tutorial").remove();
					nextStepTutorial();
				}
				return false;
			}
			
			if (presaved.length < 1) {
				if (currently_changing_points >= 0) {
					if (tutorial === 18) {
						nextStepTutorial();
					}
					document.getElementById("map").style.cursor = "";
					coord[currently_changing_points] = [e.latlng.lat, e.latlng.lng];
					await routing_control._reloadEverything();
				} else if (currently_dragging >= 0) {
					
					document.getElementById("map").style.cursor = "";
					await clearAll();
					if (routing_control._marker !== null && typeof routing_control._marker !== 'undefined') {
						routing_control._marker.remove();
						routing_control._marker = null;
					}
					await routing_control._launch([[e.latlng.lat, e.latlng.lng]]);
				}
			}
		});
	} else {
		map_instance.panTo(cityCoordinates(city));
	}
	
	


}

/** 
 * 
 * Isolates coordinates from a d attribute of a path 
 * @param {string} raw_path The value of the d attribute of a path's SVG element
 * @returns {number[][]} The coordinates that define the path
 */
function fromStringToPositions(raw_path) {
	let path = raw_path;
	path = path.split("M")[1];
	const all_paths = path.split("L");
	let res = [];
	for (var i = 0 ; i < all_paths.length ; i++) {
		let tmp = all_paths[i].split(" ");
		if (tmp.length < 2) {
			tmp = all_paths[i].split(",");
		}
		res.push([parseInt(tmp[0]),parseInt(tmp[1])]);
	}
	return res;
}

function fromPositionsToString(positions) {
	let s = `M${positions[0][0]} ${positions[0][1]}`;
	for (let i = 1 ; i < positions.length ; i++) {
		s += `L${positions[i][0]} ${positions[i][1]}`;
	}
	return s;
}


/**
 * 
 * Computes the information needed for the animation and handles the loop when all dots/circles have reached their destination
 * @param {Map} map The instance of the map
 * @param {Simulation[]} input An array of the simulations that were generated
 * @param {number} nb_dots The number of wanted dots/circles per path
 */
function nextStep(map,input,nb_dots) {
	resetColorPickers();
	maxNbDots();
	console.log(colors);
	// if (presaved.length < 1) {
	// 	prepareFileForSave();
	// }
	waiting_to_restart = false;
	if (tutorial < 0 || (tutorial === 3 && task_done) || tutorial === 5) {
		nb_dots_tangle.setValue("multiplier", input.length);
	}
	const opacity = opacity_tangle.getValue("opacity")/100;
	let paths = [];
	let draws = [];
	let bounds = [];
	
	let new_input = [];
	
	
	for(let i = 0 ; i < input.length ; i++) {
		const this_path_raw = document.getElementById(`path${i}`);
		let step = Math.ceil((input[i].length)/(nb_dots-1))-1;
		paths.push(fromStringToPositions(this_path_raw.getAttribute("d")));
		draws.push(document.getElementById(`pathing${i}`));
		
		bounds.push(this_path_raw.getBoundingClientRect());
		for(let j = 0, k = 0 ; j < input[i].length && k < nb_dots-1 ; j+=step, k++) {
			input[i].result[j].num = k;
			if (presaved.length > 0) {
				new_input.push(convertFromPreset(input[i].result[j]));
			} else {
				new_input.push(input[i].result[j]);
			}
			
		}
		input[i].result[input[i].result.length-1].num = nb_dots-1;

		if (presaved.length > 0) {
			new_input.push(convertFromPreset(input[i].result[input[i].result.length-1]));
		} else {
			new_input.push(input[i].result[input[i].result.length-1]);
		}
		
	}
	new_input = new_input.sort((a,b) => a.duration-b.duration);
	loop_listener.max_duration = new_input[new_input.length-1].duration;
	curve(new_input);
	// loop_listener.orderOfArrival = new_input;
	setUpAllExampleDots(new_input);
	const svg_bounds = document.getElementsByClassName("leaflet-zoom-animated")[0].getBoundingClientRect();
	// loop_listener.max_value = input.length * nb_dots;
	running = true;
	launchUpdateExampleElements(new_input,true);
	loopingWhileRunning(new_input,draws,paths,bounds,opacity,true,nb_dots,svg_bounds);
	loop_listener.registerListener(function(){
		if (running) {
			launchUpdateExampleElements(new_input,false);
			loopingWhileRunning(new_input,draws,paths,bounds,opacity,false,nb_dots,svg_bounds);
		} else if (waiting_to_restart) {
			loop_listener.registerListener(function(){});
		}
	});
	

}


/** 
 * 
 * Launches the animation for each dot
 * @param {Simulation[]} input The simulations that were generated
 * @param {SVGElement[]} draws Each path's SVG element
 * @param {number[][]} paths The paths as coordinates
 * @param {DOMRect[]} bounds The objects containing information on the size of the path/line HTML elements
 * @param {number} opacity The opacity for each dot/circle
 * @param {boolean} creating Whether or not to create the dots/circles
 * @param {number} nb_dots The number of dots/circles that should be generated/animated
 * @param {DOMRect} svg_bounds The bounds of the SVG element containing the path
 */
function loopingWhileRunning(input,draws,paths,bounds,opacity,creating,nb_dots,svg_bounds) {
	all_loops = clearLoops();
	temporary_loops = {};
	for(let j = 0; j < input.length; j++) {
		const i = input[j].index;
		const k = input[j].num;
		animate(draws[i],paths[i],input[j],k,bounds[i],opacity,creating,svg_bounds);
	}

}

function pause() {
	running = !running;
}

function clearLoops() {
	for (let i = 0 ; i < all_loops.length ; i++) {
		clearInterval(all_loops[i]);
	}
	return [];
}

async function clearAll() {
	document.getElementById("time-svg").innerHTML = "";
	d3.selectAll("rect.example-rect").remove();
	d3.selectAll("text.example-text").remove();
	d3.selectAll("line").remove();
	d3.selectAll("circle.example-circle").remove();
	d3.selectAll("path.example-line").remove();
	// d3.selectAll("rect.example-rect").remove();
	// d3.selectAll("text.example-text").remove();
	d3.selectAll("svg.leaflet-zoom-animated path.moving-circle").remove();
	removeCirclesRef();
	running = false;
	waiting_to_restart = true;
	all_loops = clearLoops();
	temporary_loops = {};
	return true;
}

function removeCirclesRef() {
	for (let i = 0 ; i < input_from_json.length ; i++) {
		input_from_json[i].circles  = [];
	}
}




async function updateIndexes() {
	for (let i = 0 ; i < input_from_json.length ; i++) {
		input_from_json[i].setIndex(i);
	}
	updatePathsIds();
}


function updatePathsIds() {
	
	for (let i = 0 ; i < input_from_json.length ; i++) {
		d3.select(`line#mean-${i}`)
			.style("fill",colors[i%colors.length])
			.style("stroke",colors[i%colors.length]);
		d3.select(`line#median-${i}`)
			.style("fill",colors[i%colors.length])
			.style("stroke",colors[i%colors.length]);
		d3.select(`path#ex-line-${i}`).style("stroke",colors[i%colors.length]);
		d3.select(`path#ex-line-${i}`).style("stroke",colors[i%colors.length]);
		d3.select(`path#ex-distribution-${i}`)
			.style("fill",colors[i%colors.length])
			.style("stroke",colors[i%colors.length]);
		input_from_json[i].index = i;
		input_from_json[i].route_linestring._layers[input_from_json[i].route_linestring._leaflet_id-1]._path.id = `path${i}`;
		document.getElementById(`path${i}`).style.stroke = colors[i % colors.length];
		for (let j = 0 ; j < input_from_json[i].circles.length ; j++) {
			input_from_json[i].circles[j]._path.style.fill = colors[i % colors.length];
			try {
				d3.select(`circle#ex-circle-${i}_${j}`).style("fill",colors[i%colors.length]);
			} catch(e) {console.log("not created yet");}
		}
	}
}


async function deletePath(index) {
	// console.log(colors);
	if (tutorial >= 0 && tutorial !== 13) {
		return false;
	}
	if (tutorial === 13) {
		nextStepTutorial();
	}
	const tmp = colors[index];
	colors.splice(index,1);
	colors.push(tmp);
	input_from_json.splice(index, 1);
	await d3.select(`path#path${index}`).remove();
	await updateIndexes();
	// updatePathsIds();
	await clearAll();
	await routing_control._resetMarkers();
	if (input_from_json.length < 1) {
		routing_control._marker_target.remove();
		routing_control._marker_startingpoint.remove();
		coord = [];
		return false;
	}
	return true;
	
}




async function newColor() {
	let color = "#";
	// let numerateur = 1;
	// let denominateur = 2;
	//
	// if (colors.length < 1) {
	for (let i = 0; i < 3; i++) {
		let tmp = Math.floor(Math.random() * 256).toString(16);
		if (tmp.length < 2) {
			tmp = `0`+tmp;
		}
		color += tmp;
	}
	// } else {
	// 	for (let j = 2 ; j <= colors.length ; j++) {
	// 		numerateur += 2;
	// 		if (numerateur >= denominateur) {
	// 			numerateur = 1;
	// 			denominateur *= 2;
	// 		}
	// 	}
	// 	for (let i = 0 ; i < 3 ; i++) {
	// 		let tmp = "";
	// 		for (let j = 0 ; j < 2 ; j++) {
	// 			tmp += colors[0][1+i*2+j];
	// 		}
	// 		tmp = ((parseInt(tmp,16)+Math.round(255*numerateur/denominateur))%255).toString(16);
	// 		if (tmp.length < 2) {
	// 			tmp = `0`+tmp;
	// 		}
	// 		color += tmp;
	// 	}
	// }
	// colors.push(color);
}




async function resetEverything() {
	if (tutorial === 19) {
		nextStepTutorial();
	}
	// document.getElementById("time-holder").innerHTML = "";
	delete_mode_on = false;
	clearInterval(special_loop);
	presaved = [];
	cities_selector.disabled = false;
	await clearAll();
	
	input_from_json = [];
	// colors = [];
	d3.selectAll("path").remove();
	if (coord.length >= 1) {
		await d3.selectAll("img.leaflet-marker-icon").remove();
	}
	coord = [];
	console.log(colors);
	resetColorPickers();

	// await clearAll();
}


async function colorClicked(i) {
	const index = parseInt(i);
	if (delete_mode_on && presaved.length < 1) {
		d3.selectAll(`input.color-for`).disabled = true;
		if (await deletePath(index)) {
			triggerEverything();
		}
		// d3.selectAll(`input.color-for`).disabled = false;
		delete_mode_on = false;
	} else if (presaved.length > 0) {
		d3.selectAll(`input.color-for`)
			.property("disabled",true);
		
		setTimeout(function() {
			d3.selectAll(`input.color-for`)
				.property("disabled",false);
			resetPathsStrokeWidth();
		},500);
	}
	// else {
	// 	await changeColor(index);
	// }
}

function newColorPicked(event) {
	if (tutorial === 8) {
		nextStepTutorial();
	}
	const index = parseInt(event.target.id.split("-")[2]);
	colors[index] = event.target.value;
	// changeColor(index);
	delete_mode_on = false;
	updatePathsIds();
	
}
// async function changeColor(index) {
// 	const new_colors = colors.map((x)=>x);
// 	await newColor();
// 	new_colors.splice(index,1,colors[colors.length-1]);
// 	colors = new_colors;
// 	updatePathsIds();
// }

function bringPathToFront(i) {
	if (tutorial === 7) {
		nextStepTutorial();
	}
	if (i < input_from_json.length && !delete_mode_on) {
		input_from_json[i].route_linestring.bringToFront();
		input_from_json[i].route_linestring._layers[input_from_json[i].route_linestring._leaflet_id-1]._path.style.setProperty("stroke-width", "8px");
		d3.selectAll("path.moving-circle").raise();
		d3.select("span#distance-holder")
			.style("width","100%")
			.style("height","100%");
		// const svg = d3.select("svg.leaflet-zoom-animated g");

		let var_name = "routes";
		let total_distance  = "";
		try {
			total_distance = `${Math.round(input_from_json[i].json[var_name][0].distance / 100) / 10} km`;
			if (!total_distance.includes(".")) {
				total_distance = total_distance.replace(" ", ".0 ")
			}
		} catch(e) {
			var_name = "trips";
			total_distance = `${Math.round(input_from_json[i].json[var_name][0].distance / 100) / 10} km`;
			if (!total_distance.includes(".")) {
				total_distance = total_distance.replace(" ", ".0 ")
			}
		}
		const nb_coordinates = Math.round(input_from_json[i].json[var_name][0].geometry.coordinates.length/2);
		const coordinates_middle = input_from_json[i].json[var_name][0].geometry.coordinates[nb_coordinates];
		const ref_circle = L.circle([coordinates_middle[1],coordinates_middle[0]]).addTo(map_instance);
		const pos_distance = ref_circle._path.getBoundingClientRect();
		document.getElementById("distance-holder").innerHTML += `<span id="distance-text-${i}" class="distance-text" style="position:absolute;top:${pos_distance.y}px;left:${pos_distance.x}px;">${total_distance}</span> `;
		ref_circle.remove();
		
	}
}

function resetPathsStrokeWidth() {
	setTimeout(function() {
		d3.selectAll("path.leaflet-interactive")
			.style("stroke-width","4px");

		d3.select("span#distance-holder")
			.style("width","0%")
			.style("height","0%");
		// d3.selectAll(`rect.distance-rect`).remove();
		// d3.selectAll(`text.distance-text`).remove();
		document.getElementById("distance-holder").innerHTML = "";
	},250);
}

function resetColorPickers() {
	const nb_color_pickers = document.getElementsByClassName("color-for").length;
	if (input_from_json.length > 0) {
		const span = document.getElementById("colors-span");
		const all_opts = document.getElementById("all-options");
		// span.innerHTML = "";
		for (let i = 0; i < input_from_json.length; i++) {
			let color_picker = document.getElementById(`color-for-${i}`);
			if (color_picker === null || typeof color_picker === 'undefined') {
				span.innerHTML += `<input class="color-for" type="color" id="color-for-${i}" name="color-for-${i}" value="${colors[i % colors.length]}" onmousedown="colorClicked(${i})" onmouseenter="bringPathToFront(${i})" onmouseleave="resetPathsStrokeWidth()" style="width: ${Math.floor(all_opts.getBoundingClientRect().width / all_opts.getElementsByClassName("parameters").length / input_from_json.length)}px;display:initial;">`;
			} else {
				d3.select(`input#color-for-${i}`)
					.attr("value",colors[i % colors.length])
					.attr("onmousedown", `colorClicked(${i})`)
					// .attr("onclick",`colorClicked(${i})`)
					.attr("onmouseenter", `bringPathToFront(${i})`)
					.style("width", `${Math.floor(all_opts.getBoundingClientRect().width / all_opts.getElementsByClassName("parameters").length / input_from_json.length)}px`);
			}
		}
		for (let i = input_from_json.length; i < nb_color_pickers; i++) {
			document.getElementById(`color-for-${i}`).remove();
		}
	} else {
		for (let i = 1 ; i < nb_color_pickers ; i++) {
			document.getElementById(`color-for-${i}`).remove();
		} 
		// colors = [colors[0]];
	}
	const color_pickers = document.getElementsByClassName("color-for");
	for (let i = 0 ; i < color_pickers.length ; i++) {
		color_pickers[i].addEventListener("input",newColorPicked);
		// color_pickers[i].addEventListener("click",deactivateColorPickers);
		// color_pickers[i].disabled = (presaved.length > 0);
		
		
	}
	
	
}


function triggerEverything() {
	if (new_nb_sim) {
		waiting_to_restart = drawSpeeds(speed_tangle.getValue("speed_min"),speed_tangle.getValue("speed_max"));
		if ((tutorial === 4 || tutorial === 6) && task_done) {
			nextStepTutorial();
		} else if (tutorial > 0 && tutorial < 4) {
			return false;
		}
		new_nb_sim = false;
		routing_control._reloadSims();
	}
	 else if (waiting_to_restart)  {
		 if (tutorial === 3 && task_done) {
			 nextStepTutorial();
			 return false;
		 } 
		loop_listener.done_once = false;
		nextStep(map_instance, input_from_json, nb_dots_tangle.getValue("nb_dots"));
		addLinesForExample();
		waiting_to_restart = false;
	}
}

function prepareFileForSave() {
	const res = [];
	for (let i = 0 ; i < input_from_json.length ; i++) {
		res.push(new SimplifiedSimulation(input_from_json[i]));
	}

	(function () {
		var textFile = null,
			makeTextFile = function (text) {
				var data = new Blob([text], {type: 'text/plain'});

				// If we are replacing a previously generated file we need to
				// manually revoke the object URL to avoid memory leaks.
				if (textFile !== null) {
					window.URL.revokeObjectURL(textFile);
				}

				textFile = window.URL.createObjectURL(data);

				return textFile;
			};

		let link = document.getElementById('download_link');
		link.download = `${cities_selector.value}_${Math.round(routing_control.json_obj_startingpoint[0].lat*100000)}_${Math.round(routing_control.json_obj_startingpoint[0].lon*100000)}.json`;
		link.href = makeTextFile(JSON.stringify(res));
		link.style.display = 'inherit';
	})();
}

function convertFromPreset(segments) {
	const segs = new Segments(segments.index);
	segs.num = segments.num;
	segs.segments = segments.segments;
	return segs;
}

function maxNbDots() {
	const max = Math.floor(300/(input_from_json.length));
	nb_dots_tangle.max = Math.min(max,100);
	if (nb_dots_tangle.getValue("nb_dots") > Math.min(max,100)) {
		nb_dots_tangle.setValue("nb_dots",Math.min(max,100));
	}
	// d3.select("span#nb-dots-span span.TKAdjustableNumber")
	// 	.attr("data-max",Math.min(max,100));
}

function resizeMapContainer() {
	const upper_bar = document.getElementById("options-div").getBoundingClientRect();
	const lower_bar = document.getElementById("settings-div").getBoundingClientRect();
	d3.select("div#map")
		.style("height",`${window.innerHeight - upper_bar.height - lower_bar.height}px`);
}



	
	




