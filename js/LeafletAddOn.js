L.LeafletControlRoutingtoaddress = L.Control.extend({
    options: {
        position: 'topright',
        router: 'osrm',
        token: '',
        placeholder: 'Please insert your address here.',
        errormessage: 'Address not valid.',
        distance: 'Entfernung:',
        duration: 'Fahrzeit',
        requesterror: '"Too Many Requests" or "Not Authorized - Invalid Token"'
    },

    initialize: async function (options) {
        L.Util.setOptions(this, options);
        this.max_bounds = [];
        // this.trafLights();
        // ...

    },

    onAdd: function (map) {
        
        this._map = map;

        let controlElementTag = 'div';
        let controlElementClass = 'leaflet-control-routingtoaddress';
        controlElement = this._controlElement = controlElement = L.DomUtil.create(controlElementTag, controlElementClass);

        marker_startingpoint = this._marker_startingpoint = L.marker([0, 0]);
        marker_target = this._marker_tarket = L.marker([0, 0]);

        messagebox = this._messagebox = L.DomUtil.create('div');
        messagebox.classList.add("messagebox");

        controlElement.appendChild(messagebox);

        // L.DomEvent.addListener(input, 'keydown', this._keydown, this);

        return controlElement;
        // return this;
    },
    
    _first_point: async function(fcoord) {
        if (this._marker_startingpoint) {
            this._map.removeLayer(this._marker_startingpoint);
        }
        this.json_obj_startingpoint = [{lat:fcoord[0],lon:fcoord[1]}];
        // this.json_obj_startingpoint = JSON.parse(await Get(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${fcoord[0]}+${fcoord[1]}`));

        if (typeof this.json_obj_startingpoint[0] === 'undefined' || this.json_obj_startingpoint[0] === null) {
            console.log("ERROR IN ADDRESS");
        } else {
            const my_icon = L.icon({iconUrl: "./images/pin_icon_star.png", iconSize: [30, 28.6]});
            this._marker_startingpoint = L.marker([this.json_obj_startingpoint[0].lat, this.json_obj_startingpoint[0].lon], {icon: my_icon}).addTo(this._map);
            if (presaved.length < 1) {
                this._marker_startingpoint.on("mousedown", function () {
                    if (tutorial >= 0 && tutorial !== 18 && tutorial !== 19) {
                        return false;
                    }
                    if (delete_mode_on) {
                        if (tutorial === 18) {
                            return false;
                        }
                        resetEverything();
                    } else {
                        if (tutorial === 19) {
                            return false;
                        }
                        currently_changing_points = 0;
                        map_instance.dragging.disable();
                        document.getElementById("map").style.cursor = "url(./images/star_cursor.png),move";
                        routing_control._marker_startingpoint.removeFrom(map_instance);

                    }
                });
            }
        }

    },
    
    _last_point: async function(lcoord) {
        
        if (this._marker_target) {
            this._map.removeLayer(this._marker_target);
        }
        this.json_obj_target = [{lat:lcoord[0],lon:lcoord[1]}];
        // this.json_obj_target = JSON.parse(await Get(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${lcoord[0]}+${lcoord[1]}`));
        if (typeof this.json_obj_target[0] === 'undefined' || this.json_obj_target[0] === null) {
            console.log("ERROR IN ADDRESS");
        } else {
            const my_icon = L.icon({iconUrl: "./images/pin_icon_star.png", iconSize: [30, 28.6]});
            this._marker_target = L.marker([this.json_obj_target[0].lat, this.json_obj_target[0].lon], {icon: my_icon}).addTo(this._map);
            if (presaved.length < 1) {
                this._marker_target.on("mousedown", function () {
                    if (tutorial >= 0 && tutorial !== 18 && tutorial !== 19) {
                        return false;
                    }
                    if (delete_mode_on) {
                        if (tutorial === 18) {
                            return false;
                        } 
                        resetEverything();
                    } else {
                        if (tutorial === 19) {
                            return false;
                        } 
                        currently_changing_points = 1;
                        map_instance.dragging.disable();
                        document.getElementById("map").style.cursor = "url(./images/star_cursor.png),move";
                        routing_control._marker_target.removeFrom(map_instance);
                    }
                });
            }
            // console.log(`from (${this.json_obj_startingpoint[0].lat},${this.json_obj_startingpoint[0].lon}) to (${this.json_obj_target[0].lat},${this.json_obj_target[0].lon})`);
            // drawSpeeds(speed_tangle.getValue("speed_min"),speed_tangle.getValue("speed_max"));
            this._launch([]);
        }
    },
    
    _additionalStops: async function (coords,rerun) {
        if ((tutorial >= 0 && tutorial !== 10 && tutorial !== 11) || (tutorial === 10 && !task_done)) {
            return [];
        }
        let json_obj_otherpoints = [];
        if (coords.length > 0) {
            for (let i = 0; i < coords.length; i++) {
                if (rerun) {
                    json_obj_otherpoints.push(JSON.parse(await Get(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${coords[i][0]}+${coords[i][1]}`)));
                } else {
                    json_obj_otherpoints.push({lat: coords[i][0], lon: coords[i][1]});
                }
            }
        }
        return json_obj_otherpoints;
        
    }, 
    

    _launch: async function (coords) {
        if (input_from_json.length >= 8 && currently_dragging < 0 && currently_changing_points < 0) {
            updatePathsIds();
            waiting_to_restart = true;
            triggerEverything();
            return false;
        }
        this._messagebox.innerHTML = '';
        if (currently_dragging >= 0) {
            coords = coords.concat(input_from_json[currently_dragging].additional_stops);
        }

        const json_obj_route = await this._getJSON(coords);
        const var_name = (coords.length > 0) ? "trips" : "routes";
            

        if (json_obj_route.message === 'Too Many Requests' || json_obj_route.message === 'Not Authorized - Invalid Token') {
            console.log("OPTION1");
            this._messagebox.innerHTML = this.options.requesterror;
        } else if (typeof json_obj_route[var_name][0] === 'undefined') {
            console.log("OPTION2");
            this._messagebox.innerHTML = this.options.errormessage + '( ' + this.options.router + ' )';
        } else {

            // await drawSpeeds(speed_tangle.getValue("speed_min"),speed_tangle.getValue("speed_max"));
            await this._newSims(json_obj_route,coords);
            updatePathsIds();
            waiting_to_restart = true;
            triggerEverything();
        }
        return true;
    },

    onRemove: function (map) {
        // ...
    },
    
    _getJSON: async function (coords,rerun=false) {
        
        this.new_coords = [];
        let json_obj_otherpoints = await this._additionalStops(coords,rerun);
        for (let i = 0; i < json_obj_otherpoints.length; i++) {
            if (typeof json_obj_otherpoints[i][0] === 'undefined' || json_obj_otherpoints[i][0] === null) {
                console.log("ERROR IN ADDRESS");
                return this._getJSON(coords,true);
            }
            this.new_coords.push([json_obj_otherpoints[i][0].lat, json_obj_otherpoints[i][0].lon]);
            const my_icon = L.icon({iconUrl: "./images/pin_icon_flat.png", iconSize: [15, 15]});
            const marker = L.marker([json_obj_otherpoints[i][0].lat, json_obj_otherpoints[i][0].lon],{icon:my_icon}).addTo(this._map);
            if (presaved.length < 1) {
                marker.on("mousedown", function (e) {
                    if (tutorial >= 0 && tutorial !== 12) {
                        return false;
                    }
                    marker_to_change = [e.latlng.lat, e.latlng.lng];
                    currently_dragging = removeFromStops(marker_to_change);
                    if (currently_dragging >= 0) {
                        if (delete_mode_on && (tutorial < 0 || tutorial === 12)) {
                            marker.remove();
                            clearAll();
                            routing_control._launch([]);
                            if (tutorial === 12) {
                                nextStepTutorial();
                            }

                        } else {
                            map_instance.dragging.disable();
                            routing_control._marker = marker;
                        }
                    }
                });
            }

        }
        // let url = `http://localhost:${this.options.port}/`;
        let url = `https://router.project-osrm.org/`;
        if (coords.length > 0) {
            url += `trip/v1/driving/${this.json_obj_startingpoint[0].lon},${this.json_obj_startingpoint[0].lat}`;
            for (let i = 0; i < json_obj_otherpoints.length; i++) {
                url += `;${json_obj_otherpoints[i][0].lon},${json_obj_otherpoints[i][0].lat}`;
            }
            url += `;${this.json_obj_target[0].lon},${this.json_obj_target[0].lat}?overview=full&roundtrip=false&source=first&destination=last&geometries=geojson&annotations=true&steps=true`;
        } else {
            const alternatives = (input_from_json.length > 0) ? 0 : 2;
            url += `route/v1/driving/${this.json_obj_startingpoint[0].lon},${this.json_obj_startingpoint[0].lat};${this.json_obj_target[0].lon},${this.json_obj_target[0].lat}?overview=full&geometries=geojson&alternatives=${alternatives}&annotations=true&steps=true`;
        }

        console.log(url);
        return JSON.parse(await Get(url));
    },
    
    _newSims: async function(json_obj_route,coords) {
        console.log(json_obj_route);
        await drawSpeeds(speed_tangle.getValue("speed_min"),speed_tangle.getValue("speed_max"));
        let index = input_from_json.length;
        const var_name = (coords.length > 0) ? "trips" : "routes";
        for (let i = 0; i < json_obj_route[var_name].length; i++) {

            let route_linestring = L.geoJSON(json_obj_route[var_name][i].geometry);

            if (currently_dragging >= 0) {
                d3.select(`path#path${currently_dragging}.leaflet-interactive`).remove();
                input_from_json.splice(currently_dragging,1);

                const previous_color = colors[currently_dragging];
                colors.splice(currently_dragging,1);
                colors.splice(input_from_json.length,0,previous_color);
                // colors.push(previous_color);
                currently_dragging = -1;
                map_instance.dragging.enable();

            } else if (input_from_json.length === colors.length) {
                await newColor();
            }
            
            route_linestring.addTo(this._map);
            route_linestring._layers[route_linestring._leaflet_id-1]._path.style.setProperty("stroke-width", "4px");
            
            

            if (presaved.length < 1) {
                route_linestring.on("mousedown", async function (a) {
                    if (tutorial < 0 || tutorial === 11 || tutorial === 13) {
                        if (delete_mode_on) {
                            if (tutorial === 13 || tutorial < 0) {
                                const to_delete = parseInt((a.layer._path.id).split("path")[1]);
                                if (await deletePath(to_delete)) {
                                    triggerEverything();
                                }
                            }
                        } else {
                            currently_dragging = parseInt((a.layer._path.id).split("path")[1]);
                            map_instance.dragging.disable();
                        }
                    }

                });
            }


            let sim = new Simulation(json_obj_route[var_name][i], input_from_json.length);
            sim.route_linestring = route_linestring;
            if (presaved.length < 1) {
                sim.launch(nb_simulations_tangle.getValue("nb_simulations"));
                sim.additional_stops = this.new_coords;
                const json_obj_route_tmp = JSON.parse(JSON.stringify(json_obj_route));
                json_obj_route_tmp[var_name] = [json_obj_route_tmp[var_name][i]];
                sim.json = json_obj_route_tmp;
            }
            input_from_json.push(sim);
            if (presaved.length > 1) {
                input_from_json[index+i].loadSimplifiedSimulation(presaved[index]);
            }
            
            await this._resetMarkers();
            await updateIndexes();
            // this.setMaxBounds(route_linestring.getBounds());

        }
        
    },
    
    _reloadEverything: async function() {
        if (currently_changing_points >= 0) {
            if (currently_changing_points === 0) {
                await this._first_point(coord[0]);
            } else {
                await this._last_point(coord[1]);
            }
            map_instance.dragging.enable();
            currently_changing_points = -1;
        }
        
        // const colors_copy = colors.map((x)=>x);
        // colors = [];
        // let colors_tmp = [];
        await clearAll();
        const copy = input_from_json.map((x)=>x);
        input_from_json = [];
        d3.selectAll("path").remove();

        
        let json_obj_route = await this._getJSON([]);
        await this._newSims(json_obj_route,[]);
        // const new_base_nb = colors.length;
        // let base_nb = copy.length;
        for (let i = 0 ; i < copy.length ; i++) {
            if (copy[i].additional_stops.length > 0) {
                // base_nb--;
                let coords = copy[i].additional_stops;
                let json_obj_route = await this._getJSON(coords);
                await this._newSims(json_obj_route,coords);
                // colors_tmp.push(colors_copy[i]);
            }
        }
        // for (let i = new_base_nb-1 ; i >=0 ; i--) {
        //     if (i < base_nb) {
        //         colors_tmp = ([colors_copy[i]]).concat(colors_tmp);
        //     } else {
        //         // await newColor();
        //         colors_tmp = ([colors[colors.length-1]]).concat(colors_tmp);
        //     }
        // }
        // colors = colors_tmp;
        await updateIndexes();
        updatePathsIds();
        waiting_to_restart = true;
        triggerEverything();
        
        
    },
    
    _loadPreset: async function() {
        let loaded_coords;
        try {
            loaded_coords = presaved[0].json.routes[0].geometry.coordinates;
        } catch(e) {
            loaded_coords = presaved[0].json.trips[0].geometry.coordinates;
        }
        if (this._marker_startingpoint) {
            this._map.removeLayer(this._marker_startingpoint);
        }
        this.json_obj_startingpoint = [{lat:loaded_coords[0][1],lon:loaded_coords[0][0]}];
        const my_icon = L.icon({iconUrl: "./images/pin_icon_star.png", iconSize: [30, 28.6]});
        this._marker_startingpoint = L.marker([this.json_obj_startingpoint[0].lat, this.json_obj_startingpoint[0].lon], {icon: my_icon}).addTo(this._map);

        if (this._marker_target) {
            this._map.removeLayer(this._marker_target);
        }
        this.json_obj_target = [{lat:loaded_coords[loaded_coords.length-1][1],lon:loaded_coords[loaded_coords.length-1][0]}];
        this._marker_target = L.marker([this.json_obj_target[0].lat, this.json_obj_target[0].lon], {icon: my_icon}).addTo(this._map);
        
        let all_coords = [];
        for (let i = 0 ; i < presaved.length ; i++) {
            if (presaved[i].additional_stops.length > 0) {
                all_coords = presaved[i].additional_stops;
            }
            let json_obj_route = presaved[i].json;
            const var_name = (all_coords.length > 0) ? "trips" : "routes";
            let route_linestring = L.geoJSON(json_obj_route[var_name][0].geometry);
            route_linestring.addTo(this._map)
            let sim = new Simulation(json_obj_route[var_name][0], input_from_json.length);
            sim.route_linestring = route_linestring;
            // if (presaved.length < 1) {
            //     sim.launch(nb_simulations_tangle.getValue("nb_simulations"));
            //     sim.additional_stops = this.new_coords;
            //     sim.json = json_obj_route;
            // }
            if (input_from_json.length === colors.length) {
                newColor();
            }
            input_from_json.push(sim);
            input_from_json[i].loadSimplifiedSimulation(presaved[i]);
            

            await this._resetMarkers();
            await updateIndexes();
            
        }

        updatePathsIds();
        waiting_to_restart = true;
        triggerEverything();
    },
    
    // _movePath: async function(coords){
    //     if (currently_dragging >= 0) {
    //         input_from_json[currently_dragging].route_linestring.remove();
    //         const tmp_coords = input_from_json[currently_dragging].additional_stops.map((x)=>x);
    //         tmp_coords.push(coords);
    //         const json_obj_route = await this._getJSON(tmp_coords);
    //         const var_name = (coords.length > 0) ? "trips" : "routes";
    //         let route_linestring = L.geoJSON(json_obj_route[var_name][0].geometry);
    //         route_linestring.addTo(this._map);
    //         route_linestring._layers[route_linestring._leaflet_id-1]._path.style.stroke = colors[currently_dragging % colors.length];
    //         // console.log(route_linestring);
    //        
    //     }
    // },
    
    
    _reloadSims: async function() {
        await clearAll();
        for (let i = 0 ; i < input_from_json.length ; i++) {
            await input_from_json[i].launch(nb_simulations_tangle.getValue("nb_simulations"));
        }
        // waiting_to_restart = true;
        triggerEverything();
    },
    
     _resetMarkers: async function() {
        await d3.selectAll("img.leaflet-marker-icon").remove();

        const my_icon1 = L.icon({iconUrl: "./images/pin_icon_star.png", iconSize: [30, 28.6]});
        const my_icon2 = L.icon({iconUrl: "./images/pin_icon_flat.png", iconSize: [15, 15]});
        this._marker_startingpoint = L.marker([this.json_obj_startingpoint[0].lat, this.json_obj_startingpoint[0].lon], {icon: my_icon1}).addTo(this._map);
        if (presaved.length < 1) {
            this._marker_startingpoint.on("mousedown", function () {
                if (tutorial >= 0 && tutorial !== 18 && tutorial !== 19) {
                    return false;
                }
                if (delete_mode_on) {
                    if (tutorial === 18) {
                        return false;
                    }
                    resetEverything();
                } else {
                    if (tutorial === 19) {
                        return false;
                    } 
                    currently_changing_points = 0;
                    map_instance.dragging.disable();
                    document.getElementById("map").style.cursor = "url(./images/star_cursor.png),move";
                    routing_control._marker_startingpoint.removeFrom(map_instance);

                }
            });
        }

        this._marker_target = L.marker([this.json_obj_target[0].lat, this.json_obj_target[0].lon], {icon: my_icon1}).addTo(this._map);
        if (presaved.length < 1) {
            this._marker_target.on("mousedown", function () {
                if (tutorial >= 0 && tutorial !== 18 && tutorial !== 19) {
                    return false;
                }
                if (delete_mode_on) {
                    if (tutorial === 18) {
                        return false;
                    }
                    resetEverything();
                } else {
                    if (tutorial === 19) {
                        return false;
                    } 
                    currently_changing_points = 1;
                    map_instance.dragging.disable();
                    document.getElementById("map").style.cursor = "url(./images/star_cursor.png),move";
                    routing_control._marker_target.removeFrom(map_instance);
                }
            });
        }
        
        for (let i = 0; i < input_from_json.length; i++) {
            for (let j = 0; j < input_from_json[i].additional_stops.length; j++) {
                const marker = L.marker([input_from_json[i].additional_stops[j][0], input_from_json[i].additional_stops[j][1]], {icon: my_icon2}).addTo(this._map);
                if (presaved.length < 1) {
                    marker.on("mousedown", function (e) {
                        console.log("marker");
                        console.log(tutorial);
                        if (tutorial >= 0 && tutorial !== 12) {
                            return false;
                        }
                        marker_to_change = [e.latlng.lat, e.latlng.lng];
                        currently_dragging = removeFromStops(marker_to_change);
                        if (currently_dragging >= 0 || (delete_mode_on && tutorial === 12)) {
                            if (delete_mode_on && (tutorial < 0 || tutorial === 12)) {
                                console.log("about to do that");
                                marker.remove();
                                clearAll();
                                routing_control._launch([]);
                                if (tutorial === 12) {
                                    nextStepTutorial();
                                }

                            } else {
                                map_instance.dragging.disable();
                                routing_control._marker = marker;
                            }
                        }
                    });
                }
            }
        }
    },
    
    setMaxBounds: function(bounds) {
        if (this.max_bounds.length < 1) {
            this.max_bounds.push(bounds._northEast);
            this.max_bounds.push(bounds._southWest);
        } else {
            this.max_bounds[0].lat = Math.min(this.max_bounds[0].lat,bounds._northEast.lat);
            this.max_bounds[0].lng = Math.min(this.max_bounds[0].lng,bounds._northEast.lng);
            this.max_bounds[1].lat = Math.max(this.max_bounds[1].lat,bounds._southWest.lat);
            this.max_bounds[1].lng = Math.max(this.max_bounds[1].lng,bounds._southWest.lng);
        }
        this._map.fitBounds(this.max_bounds);
        this._map.zoomOut(1);
    },
    
    

});

L.leafletControlRoutingtoaddress = function (options) {
    return new L.LeafletControlRoutingtoaddress(options);
};


async function Get(url) {
    try {
        let Httpreq = new XMLHttpRequest(); // a new request
        Httpreq.open("GET", url, false);
        Httpreq.send(null);
        return Httpreq.responseText;
    } catch (e) {
        console.log(e);
        console.log(`retrying now`);
        return Get(url);
    }
}

function removeFromStops(coords) {
    for (let i = 0 ; i < input_from_json.length ; i++) {
        const j_length = input_from_json[i].additional_stops.length;
        for (let j = 0 ; j < j_length ; j++){
            if(Math.abs(coords[0]-input_from_json[i].additional_stops[j][0])<0.0001 && Math.abs(coords[0]- input_from_json[i].additional_stops[j][0]) < 0.0001) {
                input_from_json[i].additional_stops.splice(j,1);
                return i;
            }
        }
    }
    return -1;
}

async function getTrafficSignalsOf(city) {
    if (presaved.length < 1) {
        const api = await fetch('https://www.overpass-api.de/api/interpreter?', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            // body: `[out:json];area["name"="${city}"]["wikipedia"="Glasgow"];node(area)[highway=crossing][crossing!=no];out;`
            // body: `[out:json];
            //     {{geocodeArea:${city}}};
            //     nwr(area);
            //     out;`
            body: `[out:json];
            area["name"="${city}"]->.small;
            nwr[highway=crossing][crossing!=no](area.small);
            out;`


        });
        const answer = await api.json();
        console.log(answer);
        return answer;
    }
    return null;
}

function isThereATrafficLightAt(coords) {
    for (let i = 0 ; i < traffic_signals_info.elements.length ; i++) {
        if (Math.abs(coords[0]-traffic_signals_info.elements[i].lat) < 0.000005 &&  Math.abs(coords[1]-traffic_signals_info.elements[i].lon) < 0.000005) {
            // L.circle(L.latLng(traffic_signals_info.elements[i].lat,traffic_signals_info.elements[i].lon),{radius:10,color:'red'}).addTo(map_instance);
            return i;
        }
    }
    return -1;
}


function trafLights() {
    for(let i = 0 ; i < traffic_signals_info.elements.length ; i++) {
        L.circle(L.latLng(traffic_signals_info.elements[i].lat,traffic_signals_info.elements[i].lon),{radius:10,color:'red'}).addTo(map_instance);
    }
}


