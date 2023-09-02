/**
 * The different simulations that were generated when a path has been selected
 * @type {Simulation[]}
 */
let input_from_json = [];
/**
 * Whether the animation is (or is supposed to be) running
 * @type {Boolean}
 */
let running = false;
/**
 * Container for the instance of the map created when a city is selected
 * @type {Map}
 */
let map_instance;

let waiting_to_restart = false;

let colors = [];

let routing_control;

let all_loops = [];
let temporary_loops = {};

let coord = [];

let buffering = false;

let speeds = [];

/**
 * Determines whether one is trying to drag a path by being the index of that path (-1 otherwise)
 * @type {Number}
 */
let currently_dragging = -1;

const example_svg = document.getElementById("example-container");

let currently_hovering = -1;

let delete_mode_on = false;

let currently_changing_points = -1;

let marker_to_change = [];


let traffic_signals_info;

let special_loop;

let middle_value = "median";

let presaved = [];

let new_nb_sim = false;

const SVG_MARGIN = 20;

const INTERVAL = 1;

let global_time = 0;

let last_click = "";
let preset_key = -1;
let data;
let tutorial = -1;
let task_done = false;
let marker_task;

let tutorial_moving = false;
let e_before;



/**
 * The opacity tangle linked to the opacity selector in HTML, modifying the opacity of all circles on the document when the value is changed
 * @type {Tangle}
 */
const opacity_tangle = new Tangle(document.getElementById("opacity-span"), {
    initialize: function () {
        this.opacity = 50;
        this.opacity_previously = this.opacity;
    },
    update: function () {
        if (tutorial < 0 || tutorial >= 5) {
            if (tutorial === 5) {
                nextStepTutorial();
            }
            d3.selectAll("circle")
                .style("opacity", this.opacity / 100)
                .style("fill-opacity", this.opacity / 100)
                .style("stroke-opacity", this.opacity / 100);
            d3.selectAll("path.moving-circle")
                .style("fill-opacity", this.opacity / 100)
                .style("stroke-opacity", this.opacity / 100);
        } else {
            this.opacity = this.opacity_previously;
        }
    }
});




/**
 * The tangle for the number of dots, modifying the number of example circles on the document and restarting the animation with the new number of dots/circles
 * @type {Tangle}
 */
const nb_dots_tangle = new Tangle(document.getElementById("nb-dots-span"), {
    initialize: function () {
        this.nb_dots = 50;
        this.nb_dots_previously = this.nb_dots;
        this.multiplier = 1;
        this.max = 100;
        // addExampleCircles(this.nb_dots*this.multiplier, 0, 1);
    },
    update: function () {
        if (tutorial < 0 || tutorial >= 3) {
            if (tutorial === 3) {
                task_done = true;
            }
            if (this.nb_dots > this.nb_max) {
                this.nb_dots = this.nb_max;
            }
            // this.nb_dots = Math.min(this.nb_dots,this.max);
            this.nb_dots_previously = this.nb_dots;
            removeExampleCircles();
            running = true;
            if (input_from_json.length > 0 && running) {
                clearAll();
            }
        } else {
            this.nb_dots = Math.min(this.max,this.nb_dots_previously);
        }
    }
});

const nb_simulations_tangle = new Tangle(document.getElementById("nb-simulations-span"), {
    initialize: function () {
        this.nb_simulations = 500;
        this.nb_simulations_previously = this.nb_simulations;
    },
    update: function () {
        if (presaved.length > 0) {
            this.nb_simulations = 500;
        } else if (input_from_json.length > 0 && (tutorial < 0 || tutorial >= 4)) {
            this.nb_simulations_previously = this.nb_simulations;
            if (tutorial === 4) {
                task_done = true;
            }
            new_nb_sim = true;
        } else {
            this.nb_simulations = this.nb_simulations_previously;
        }
    }
});



const speed_tangle = new Tangle(document.getElementById("speed-span"), {
    initialize: function () {
        this.speed_min = 3;
        this.speed_max = 4;
        
        this.speed_min_previously = this.speed_min;
        this.speed_max_previously = this.speed_max;
        // drawSpeeds(this.speed_min,this.speed_max);
    },
    update: function () {
        if (tutorial < 0 || tutorial >= 6) {
            this.speed_min_previously = this.speed_min;
            this.speed_max_previously = this.speed_max;
            
            if (tutorial === 6) {
                task_done = true;
            }
            speeds = [];
            if (presaved.length > 0) {
                this.speed_min = 3;
                this.speed_max = 4;
            } else {
                this.speed_min = Math.min(this.speed_min, this.speed_max);
                this.speed_max = Math.max(this.speed_max, this.speed_min);
                // drawSpeeds(this.speed_min, this.speed_max);
                if (input_from_json.length > 0) {
                    new_nb_sim = true;
                    // routing_control._reloadSims();
                }
            }
        } else {
            this.speed_min = Math.min(this.speed_min_previously, this.speed_max);
            this.speed_max = Math.max(this.speed_max_previously, this.speed_min);;
        }
        // drawSpeeds(this.speed_min,this.speed_max);
    }
});





document.addEventListener("mouseup",function(){
    if (input_from_json.length > 0) {
        // if (tutorial < 0 || ((tutorial === 3 || tutorial === 4 || tutorial === 6) && task_done) || tutorial === 11) {
         if (tutorial < 0 || tutorial >= 3) {   
            triggerEverything();
        }
    }
});




/**
 * A running loop that listens to the current state of the animation to fire it again once all dots/circles have reached their destination
 * @type {{nbListener: loop_listener.nbListener, readonly nb: number, nbInternal: number, max_value: number, registerListener: loop_listener.registerListener}}
 */
const loop_listener = {
    done_once:false,
    max_duration:0,
    prev_state_lines: [],
    prev_state_dots: [],
    prev_state_middles: [],
    nbListener: function(){},
    registerListener: function(listener){
        this.nbListener = listener;
    }
};


/**
 * The dropdown selector of the cities in the HTML document
 * @type {HTMLElement}
 */
const cities_selector = document.getElementById("cities");
cities_selector.addEventListener("change",async function(){

    if (tutorial < 1) {
        if (tutorial === 0 && cities_selector.value === 'Wellington') {
            nextStepTutorial();
        } else if (tutorial >= 0 && cities_selector.value !== 'Wellington') {return false;}
        await resetEverything();
        traffic_signals_info = await getTrafficSignalsOf(cities_selector.value);

        await startAnimation(cities_selector.value);
        // trafLights();
    }

});



const type_map_selector = document.getElementById("type-map");
type_map_selector.addEventListener("change",function() {
    if (tutorial === 9 && type_map_selector.value !== 'toner') {
        return false
    } else if (tutorial === 9) {
        nextStepTutorial();
    }
    selectTiles(type_map_selector.value);
});

const tutorial_div = document.getElementById("tutorial");
tutorial_div.addEventListener("mouseover",function() {
    tutorial_div.style.cursor = "grab";
});
tutorial_div.addEventListener("mouseout",function() {
    tutorial_div.style.cursor = "";
});

tutorial_div.addEventListener("mousemove",function(e) {
    if (tutorial_moving) {
        tutorial_div.style.top = `${e.clientY-e_before.layerY}px`;
        tutorial_div.style.left = `${e.clientX-e_before.layerX}px`;
        // console.log("supposedly changing");
    }
});

tutorial_div.addEventListener("mousedown", function(e){
    tutorial_moving = true;
    e_before = e;
});

tutorial_div.addEventListener("mouseup", function(e){
    tutorial_moving = false;
});

// tutorial_div.addEventListener("mouseout", function(e){
//     tutorial_moving = false;
// });



document.body.onkeyup = function(e) {
    if (e.key === " " || e.code === "Space") {
        pause();
    } else if (e.key === "Shift" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        delete_mode_on = false;
    }
};

document.body.onkeydown = async function(e) {
    
    if (e.key === "Shift" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        delete_mode_on = true;
    } 
    
    // if (presaved.length > 0) {
    //     if (e.key === "ArrowLeft" || e.code === "ArrowLeft") {
    //         running = true;
    //         d3.select("div#experiment")
    //             .style("visibility", "hidden");
    //     }
    //     if (e.key === "ArrowRight" || e.code === "ArrowRight") {
    //         if (!requiresClick(preset_key) || last_click.length > 0) {
    //             running = false;
    //             d3.select("div#experiment")
    //                 .style("visibility", "visible");
    //             document.getElementById(`data`).value = `${data};${requiresClick(preset_key) ? last_click : "done"}`;
    //         }
    //     }
    // }
    
    if (tutorial === -1 && preset_key === -1) {
        if (e.key === "ArrowLeft" || e.code === "ArrowLeft") {
            running = true;
            d3.select("div#experiment")
                .style("visibility", "hidden");
        }
        // if (e.key === "ArrowRight" || e.code === "ArrowRight") {
        //     running = false;
        //     document.getElementById("experiment_form").removeAttribute("action");
        //     d3.select("form#experiment_form")
        //         .attr("action","index.php?preset=0");
        //     d3.select("button#form_button")
        //         .attr("type","submit")
        //         .attr("onclick",'');
        //     d3.select("div#experiment")
        //         .style("visibility", "visible");
        //     d3.select("span#tutorial")
        //         .style("visibility", "hidden");
        // }
    }
    
    // const nb_presets = 10;
    // if ((parseInt(e.key) > 0 && parseInt(e.key) <= nb_presets) || e.code.includes("Digit")) {
    //
    //     let key = 18;
    //     await resetEverything();
    //     colors = ["#FF6FBE","#FFD004","#392DFF"];
    //     d3.select('span#middle-value')
    //         .style("visibility",'hidden');
    //     const tmp = simulationsForPresets(key);
    //     nb_simulations_tangle.setValue("nb_simulations",tmp[0]["result"].length);
    //     document.getElementById("cities").value = citiesForPresets(key);
    //     presaved = tmp;
    //     traffic_signals_info = await getTrafficSignalsOf(cities_selector.value);
    //     await startAnimation(cities_selector.value);
    //     cities_selector.disabled = true;
    //     // const coordinates = coordinatesForPresets(key);
    //     // console.log(presaved[0]);
    //     const coordinates = [presaved[0].base_segments.segments[0].start_coordinates,presaved[0].base_segments.segments[presaved[0].base_segments.segments.length-1].end_coordinates];
    //     createRouting(map_instance, coordinates[0]);
    //     await routing_control._loadPreset(coordinates);
    //
    // } else if (e.key === "Escape" || e.code === "Escape") {
    //     document.getElementById("cities").value = "unknown";
    //     await resetEverything();
    // }

};



example_svg.addEventListener("mouseenter", function(e){
    if (input_from_json.length > 0) {
        const all_lines = document.getElementsByClassName("example-line");
        for (let i = 0 ; i < all_lines.length ; i++) {
            loop_listener.prev_state_lines.push(all_lines[i].getAttribute("d"));
        }
        const all_middles = document.getElementsByClassName("example-middle");
        for (let i = 0 ; i < all_middles.length ; i++) {
            loop_listener.prev_state_middles.push(all_middles[i].getAttribute("d"));
        }
        const all_circles = document.getElementsByClassName("example-circle");
        for (let i = 0 ; i < all_circles.length ; i++) {
            loop_listener.prev_state_dots.push(all_circles[i].getAttribute("display"));
        }
    }
    
})

example_svg.addEventListener("mouseleave", function(e){
    currently_hovering = -1;
    // const svg = d3.select("svg#example-container");
    // svg.select("line#moving-line").remove();
    if (input_from_json.length > 0) {
        d3.selectAll("path.example-line")
            .attr("d",function(d,i){
                return loop_listener.prev_state_lines[i];
            });
        d3.selectAll("line.example-middle")
            .attr("display",function(d,i){
                return loop_listener.prev_state_middles[i];
            });
        d3.selectAll("circle.example-circle")
            .attr("display",function(d,i){
                return loop_listener.prev_state_dots[i];
            });
        loop_listener.prev_state_lines = [];
        loop_listener.prev_state_dots = [];
        loop_listener.prev_state_middles = [];
    }

});

example_svg.addEventListener("mousemove", function(e) {
    if (tutorial === 14) {
        nextStepTutorial();
    }
    const svg_bounds = example_svg.getBoundingClientRect();
    if (input_from_json.length > 0 && document.getElementById("time-text") !== null && typeof document.getElementById("time-text") !== 'undefined') {
        const max_width = svg_bounds.width - SVG_MARGIN * 2;
        const unit = max_width / loop_listener.max_duration;
        const x = e.x - svg_bounds.x - SVG_MARGIN;
        if (x / unit < 0) {
            currently_hovering = 0;
        } else if (x / unit > loop_listener.max_duration) {
            currently_hovering = Math.round(loop_listener.max_duration);
        } else {
            currently_hovering = Math.round(x / unit);
        }

        const text_bounds = document.getElementById("time-text").getBoundingClientRect();
        const text_width = text_bounds.width;
        let x_pos = Math.max(SVG_MARGIN + unit * currently_hovering - text_width / 2, SVG_MARGIN);
        if (x_pos + text_width > svg_bounds.width - SVG_MARGIN) {
            x_pos = svg_bounds.width - SVG_MARGIN - text_width;
        }

        const text = d3.select("text#time-text")
            .attr("x", x_pos)
            .text(`${Math.round(currently_hovering / 60)} min`);
        d3.select("rect#time-rect")
            .attr("x", x_pos)
            .attr("width", text_bounds.width)
            .attr("height", text_bounds.height)
            .style("fill", "black");

        text.raise();
        // document.getElementById("time-holder").innerHTML = `${Math.round(currently_hovering/60)} min`;
        if (!loop_listener.done_once) {
            const y = (svg_bounds.height - 12) / input_from_json.length + 1;
            d3.selectAll("path.example-line")
                .attr("d", function (d, i) {
                    const cy = 14 + y * i;
                    return fromPositionsToString([[SVG_MARGIN, cy], [Math.min(Math.max(SVG_MARGIN,e.x - svg_bounds.x),svg_bounds.width-SVG_MARGIN), cy]]);
                });
            d3.select("rect#hider1")
                .attr("x", Math.min(Math.max(SVG_MARGIN,e.x - svg_bounds.x),svg_bounds.width-SVG_MARGIN));
            for (let i = 0; i < input_from_json.length; i++) {
                const ref = middle_value_selector.checked ? input_from_json[i].mean : input_from_json[i].median;
                if (ref <= currently_hovering) {
                    d3.select(`#${middle_value_selector.checked ? "mean" : "median"}-${i}`)
                        .attr("display", "inline");
                } else {
                    d3.select(`#${middle_value_selector.checked ? "mean" : "median"}-${i}`)
                        .attr("display","none");
                }
                for (let j = 0; j < input_from_json[i].circles.length; j++) {
                    const circle = document.getElementById(`ex-circle-${i}_${j}`);
                    if (circle.getAttribute("cx") <= e.x - svg_bounds.x) {
                        circle.setAttribute("display", "inline");
                    } else {
                        circle.setAttribute("display", "none");
                    }
                }
            }

        }
    }
    const svg = d3.select("svg#example-container");
    svg.select("line#moving-line")
        .attr("x1", Math.min(Math.max(SVG_MARGIN,e.x - svg_bounds.x),svg_bounds.width-SVG_MARGIN))
        .attr("x2", Math.min(Math.max(SVG_MARGIN,e.x - svg_bounds.x),svg_bounds.width-SVG_MARGIN))
    svg.selectAll("line.example-middle").raise();
    d3.selectAll(`rect.example-rect`).raise();
    d3.selectAll(`text.example-text`).raise();
    
});


const middle_value_selector = document.getElementById("middle");
middle_value_selector.addEventListener("change",async function(){
    if (tutorial >= 0 && tutorial < 16) {
        middle_value_selector.checked = false;
        return false;
    }
    if (middle_value_selector.checked) {
        if (tutorial === 16) {
            nextStepTutorial();
        }
        document.getElementById("mean").classList.add("option-selected");
        document.getElementById("median").classList.remove("option-selected");
    } else {
        document.getElementById("mean").classList.remove("option-selected");
        document.getElementById("median").classList.add("option-selected");
    }
    setUpMiddleValue();

});

const plot_selector = document.getElementById("plot");
plot_selector.addEventListener("change",async function(){
    if (tutorial >= 0 && tutorial < 17) {
        plot_selector.checked = false;
        return false;
    }
    
    if (plot_selector.checked) {
        if (tutorial === 17) {
            nextStepTutorial();
        }
        document.getElementById("distribution-plot").classList.add("option-selected");
        document.getElementById("dot-plot").classList.remove("option-selected");
        d3.select("svg g#dotplot")
            .attr('display','none');
        d3.select("svg g#distribution")
            .attr('display','inline');
    } else {
        document.getElementById("distribution-plot").classList.remove("option-selected");
        document.getElementById("dot-plot").classList.add("option-selected");
        d3.select("svg g#dotplot")
            .attr('display','inline');
        d3.select("svg g#distribution")
            .attr('display','none');
    }

});







