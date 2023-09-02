class EventOnPath {
	

	constructor(start,probability,type) {
		this.start = start;
		this.probability = probability;
		this.type = type;
	}
	

}

class Stop extends EventOnPath {

	constructor(start,probability,waiting_time) {
		// this.probability = probability;
		super(start,probability,"Stop");
		this.waiting_time = waiting_time;
	}

}

class Hump extends EventOnPath {

	constructor(start,end,probability,lost_speed) {
		super(start,probability,"Hump");
		this.end = end;
		this.lost_speed = lost_speed;
	}
}


class Segment {

	constructor(start,end,duration,speed,start_coordinates,end_coordinates) {
		this.start = start;
		this.end = end;
		this.duration = duration;
		this.speed = speed;
		this.start_coordinates = start_coordinates;
		this.end_coordinates = end_coordinates;
	}
}

class Segments {

	constructor(index) {
		this.segments = [];
		this.index = index;
		this.num = 0;
	}
	
	addSegment(segment) {
		this.segments.push(segment);
	}
	
	addSegments(segments) {
		for (let i = 0 ; i < segments.length ; i++) {
			this.segments.push(segments[i]);
		}
	}
	
	update() {
		let segments_tmp = [];
		for (let i = 0 ; i < this.segments.length ; i++) {
			if (this.segments[i].duration > 0) {
				segments_tmp.push(this.segments[i]);
			}
		}
		segments_tmp = segments_tmp.sort((a,b) => a.start-b.start);
		this.segments = segments_tmp;
	}

	get length() {
		return this.segments.length;
	}
	
	get duration() {
		let duration = 0;
		for (let i = 0 ; i < this.segments.length ; i++) {
			duration += this.segments[i].duration;
		}
		return duration;
	}
	
	get distance() {
		return this.segments[this.segments.length-1].end;
	}
 }

class Simulation {

	constructor(json_obj_routes,index) {
		let i;
		this.total_distance = json_obj_routes.distance;
		this.events = [];
		this.index = index;
		this.additional_stops = [];
		this.route_linestring = null;
		this.circles = [];
		this.median = 0;
		this.mean = 0;
		this.json = null;

		if (presaved.length < 1) {
			let distance_till_now = 0;
			for (let fi = 0; fi < json_obj_routes.legs.length; fi++) {
				for (i = 0; i < json_obj_routes.legs[fi].steps.length; i++) {
					const step = json_obj_routes.legs[fi].steps[i];
					distance_till_now += step.distance;
					switch (step.maneuver.type) {
						case "merge":
						case "end of road":
						case "continue": // soft
							this.events.push(new Hump(distance_till_now - 5, distance_till_now + 5, this.probability(step.maneuver.modifier), 0.25));
							break;
						case "turn":
						case "roundabout turn":
						case "fork": // average
							this.events.push(new Hump(distance_till_now - 5, distance_till_now + 5, this.probability(step.maneuver.modifier), 0.5));
							break;
						case "roundabout":
						case "rotary": // hard
							this.events.push(new Hump(distance_till_now - 5, distance_till_now + 5, this.probability(step.maneuver.modifier), 0.75));
							break;
						default:
							break;
					}

				}
			}

			this.base_segments = new Segments(this.index);
			this.average_speed = 0;
			distance_till_now = 0;
			const geom = json_obj_routes.geometry.coordinates;
			let j = 0;
			for (let fi = 0; fi < json_obj_routes.legs.length; fi++) {
				const annotation = json_obj_routes.legs[fi].annotation;
				for (i = 0; i < annotation.distance.length; i++) {
					this.base_segments.addSegment(new Segment(distance_till_now, distance_till_now + annotation.distance[i], annotation.duration[i], annotation.distance[i] / annotation.duration[i], [geom[j][1], geom[j][0]], [geom[j + 1][1], geom[j + 1][0]]));
					distance_till_now += annotation.distance[i];
					this.average_speed += annotation.distance[i] / annotation.duration[i];
					j++;
				}
				this.average_speed = this.average_speed / annotation.distance.length;
			}

			let all_meters_gen = genTimerWithCoords(this.base_segments, 1);
			let all_meters = all_meters_gen.next();
			while (all_meters.done !== true) {
				const crossing = isThereATrafficLightAt(all_meters.value);

				if (crossing >= 0) {
					if (traffic_signals_info.elements[crossing].tags.crossing === "traffic_signals") {
						if (traffic_signals_info.elements[crossing].tags.button_operated === "yes") {
							this.events.push(new Stop(all_meters.value[2], 0.9, 30));
						} else {
							this.events.push(new Stop(all_meters.value[2], 0.75, 30));
						}
					} else {
						this.events.push(new Hump(Math.max(all_meters.value[2] - 2, 0), Math.min(all_meters.value[2] + 1, this.base_segments.distance), 0.5, 0.5));
					}


				}
				all_meters = all_meters_gen.next();
			}

			this.resolveConflicts();
		}
	}

	probability(modifier) {
		if (modifier.includes("sharp")) {
			return 0.9;
		} else if (modifier.includes("slight")) {
			return 0.2;
		} else if (modifier.includes("straight")) {
			return 0.05;
		}
		return 0.5;
	}

	maxWaitingTime(intersection_size) {
		if (intersection_size <= 2) {
			return 15;
		} else if (intersection_size <= 4) {
			return 30;
		} else if (intersection_size <= 5) {
			return 45;
		}
		return 60;

	}

	launch(n) {
		this.result = [];
		for (let i = 0 ; i < n ; i++) {
			// const speed_min = speed_tangle.getValue("speed_min")/3.6;
			// const speed_max = speed_tangle.getValue("speed_max")/3.6;
			// let actual_speed = getNormallyDistributedRandomNumber((speed_min+speed_max)/2, getSD(speed_min,speed_max));
			let actual_speed = speeds[i];
			let segments = new Segments(this.index);
			for (let j = 0 ; j < this.base_segments.length ; j++) {
				let speed_segment = this.base_segments.segments[j].speed;
				const distance = this.base_segments.segments[j].end - this.base_segments.segments[j].start;
				if (this.base_segments.segments[j].speed > 0) {
					speed_segment = actual_speed * this.base_segments.segments[j].speed/this.average_speed;
				}
				segments.addSegment(new Segment(this.base_segments.segments[j].start,this.base_segments.segments[j].end,distance/speed_segment,speed_segment,this.base_segments.segments[j].start_coordinates,this.base_segments.segments[j].end_coordinates));
			}
			for (let j = 0 ; j < this.events.length ; j++) {
				switch(this.events[j].type) {
					case "Stop":
						let waiting_time = waitingTimeAtStop(this.events[j]);
						if (waiting_time > 0) {
							const new_coords = getPointFromBeginningAtMeter(this.events[j].start,this.base_segments);
							segments.addSegment(new Segment(this.events[j].start,this.events[j].start,waiting_time,0,new_coords,new_coords));
						}
						break;
					case "Hump":	
						let segments_tmp = [];
						let new_start = this.events[j].start;
						if (Math.random() < this.events[j].probability) {
							for (let k = 0 ; k < segments.length ; k++) {
								if (new_start < segments.segments[k].end) {
									let new_speed = segments.segments[k].speed*(1-this.events[j].lost_speed);
									const end_tmp = segments.segments[k].end;
									if (this.events[j].end <= segments.segments[k].end) {
										segments_tmp.push(new Segment(new_start,this.events[j].end,(this.events[j].end-new_start)/new_speed,new_speed,getPointFromBeginningAtMeter(new_start,this.base_segments),getPointFromBeginningAtMeter(this.events[j].end,this.base_segments)));
										segments.segments[k].end = new_start;
										segments.segments[k].duration = (segments.segments[k].end-segments.segments[k].start)/segments.segments[k].speed;
										if (this.events[j].end < end_tmp) {
											segments_tmp.push(new Segment(this.events[j].end,end_tmp,(end_tmp-this.events[j].end)/segments.segments[k].speed,segments.segments[k].speed,getPointFromBeginningAtMeter(this.events[j].end,this.base_segments),getPointFromBeginningAtMeter(end_tmp,this.base_segments)));
										}
										k = segments.length;
									} else {
										segments_tmp.push(new Segment(new_start,segments.segments[k].end,(segments.segments[k].end-new_start)/new_speed,new_speed,getPointFromBeginningAtMeter(new_start,this.base_segments),getPointFromBeginningAtMeter(segments.segments[k].end,this.base_segments)));
										segments.segments[k].end = new_start;
										segments.segments[k].duration = (segments.segments[k].end - segments.segments[k].start)/segments.segments[k].speed;
										new_start = end_tmp;
									}
								}
							}
						}
						segments.addSegments(segments_tmp);
				}
			}
			segments.update();
			this.result.push(segments);
		}
		this.result = this.result.sort((a,b) => a.duration-b.duration);
		this.computeMean();
		this.computeMedian();
		
		return this.result;
	}
	
	computeMedian() {
		if (this.result.length%2 === 0) {
			const mid = this.result.length/2;
			this.median = (this.result[mid-1].duration+this.result[mid].duration)/2;
		} else {
			this.median = this.result[Math.floor(this.result.length/2)].duration;
		}
	}
	
	computeMean() {
		let res = 0;
		for (let i = 0 ; i < this.result.length ; i++) {
			res += this.result[i].duration;
		}
		this.mean = res/this.result.length;
	}
	
	
	resolveConflicts() {
		const offset = 0.1;
		this.events = this.events.sort((a,b) => a.start-b.start);
		let nb_conflicts = 0;
		const res = [];
		for (let i = 1 ; i < this.events.length ; i++) {
			if (this.events[i-1].type !== "Stop" &&  this.events[i].start < this.events[i-1].end) {
				nb_conflicts++;
				if (this.events[i].type === "Stop") {
					res.push(new Hump(this.events[i].start+offset,this.events[i-1].end,this.events[i-1].probability,this.events[i-1].lost_speed));
					this.events[i-1].end = this.events[i].start-offset;
				} else {
					this.events[i-1].end = this.events[i].start-offset;
				}
			} else if (this.events[i-1].type === "Stop" &&  this.events[i].start < this.events[i-1].start) {
				nb_conflicts++;
				res.push(new Hump(this.events[i].start,this.events[i-1].start-offset,this.events[i].probability,this.events[i].lost_speed));
				this.events[i].start = this.events[i-1].start+offset;
			}
		}
		this.events = this.events.concat(res);
		if (nb_conflicts > 0) {
			return this.resolveConflicts();
		}
		return true;
	}
	
	get length() {
		return this.result.length;
	}
	
	setIndex(val) {
		this.index = val;
		if (presaved.length < 1) {
			this.base_segments.index = val;
		}
		for (let i = 0 ; i < this.result.length ; i++) {
			this.result[i].index = val;
		}
	}
	
	loadSimplifiedSimulation(simplified_simulation) {
		this.events = simplified_simulation.events;
		this.base_segments = simplified_simulation.base_segments;
		this.result = simplified_simulation.result;
		this.mean = simplified_simulation.mean;
		this.median = simplified_simulation.median;
		this.json = simplified_simulation.json;
		this.additional_stops = simplified_simulation.additional_stops;
		this.base_segments = simplified_simulation.base_segments;
	}
	
}

class SimplifiedSimulation {

	constructor(simulation) {
		this.events = simulation.events;
		this.base_segments = simulation.base_segments;
		this.result = simulation.result;
		this.mean = simulation.mean;
		this.median = simulation.median;
		this.json = simulation.json;
		this.additional_stops = simulation.additional_stops;
		this.base_segments = simulation.base_segments;
	}

}

function waitingTimeAtStop(stop) {
	const rand = Math.random();
	if (stop.probability >= 0.9 && rand < stop.probability) {
		return stop.waiting_time;
	} else if (stop.probability >= 0.9) {
		return 0;
	} else if (rand >= stop.probability) {
		const light_waiting = Math.floor(Math.random()*stop.waiting_time)+1;
		if (light_waiting <= 10) {
			const run = Math.random();
			if (run >= 0.5) {
				return 0;
			}
			return light_waiting + stop.waiting_time;
		}
		return 0;
	} else {
		return (Math.floor(Math.random()*stop.waiting_time)+1);
	}
}




function boxMullerTransform() {
    const u1 = Math.random();
    const u2 = Math.random();
    
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    
    return { z0, z1 };
}

function getNormallyDistributedRandomNumber(mean, stddev) {
    const { z0, _ } = boxMullerTransform();
    
    return Math.min(Math.max(z0 * stddev + mean,Math.max((speed_tangle.getValue("speed_min")/3.6)-0.5,0.5)),(speed_tangle.getValue("speed_max")/3.6)+0.5);
}

function getSD(min,max) {
	let res = 0;
	let nb = 0;
	const mean = (min+max)/2;
	for (let i = min; i <= max ; i+=0.1) {
		nb++;
		res+= (i-mean)**2;
	}
	return Math.sqrt(res/nb);
}
 
function getPointAtMeter(m,start,end,distance) {
	// const for_x = (end[0]-start[0])/distance;
	// const for_y = (end[1]-start[1])/distance;
	return [start[0]*(1-m/distance)+end[0]*m/distance,start[1]*(1-m/distance)+end[1]*m/distance];
}

function getPointFromBeginningAtMeter(m,segs) {
	for (let i = 0 ; i < segs.length ; i++) {
		if (m >= segs.segments[i].start && m < segs.segments[i].end) {
			let res_b = getPointAtMeter(m-segs.segments[i].start,segs.segments[i].start_coordinates,segs.segments[i].end_coordinates,segs.segments[i].end-segs.segments[i].start);
			res_b = [res_b[0],res_b[1],m];
			return res_b;
		}
	}
	let res  = segs.segments[segs.segments.length-1].end_coordinates;
	res = [res[0],res[1],m];
	return res;
}

async function drawSpeeds(min,max) {
	if (presaved.length < 1) {
		const length_speed = speeds.length;
		const speed_min = min/3.6;
		const speed_max = max/3.6;
		for (let i = length_speed ; i < nb_simulations_tangle.getValue("nb_simulations") ; i++) {
			speeds.push(getNormallyDistributedRandomNumber((speed_min+speed_max)/2, getSD(speed_min,speed_max)));
		}
	}
	return true;
}








