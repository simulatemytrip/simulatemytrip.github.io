function hoverOverDot(id) {
    if (tutorial === 15) {
        nextStepTutorial();
    }
    d3.selectAll("text.example-text")
        .style("visibility","hidden");
    d3.selectAll("rect.example-rect")
        .style("visibility","hidden");
    d3.select(`rect#ex-rect-${id}`)
        .style("visibility","visible")
        .raise();
    d3.select(`text#ex-text-${id}`)
        .style("visibility","visible")
        .raise();
    

}




function stopHoverOverDot(id) {
    setTimeout(function() {
        d3.select(`text#ex-text-${id}`)
            .style("visibility","hidden");
        d3.select(`rect#ex-rect-${id}`)
            .style("visibility","hidden");
    },500);


}

function removeExampleCircles() {
    d3.selectAll("svg#example-container circle").remove();
}


function addLinesForExample() {
    const svg = d3.select("svg#example-container");
    const svg2 = d3.select("svg#time-svg");
    const svg_bounds = example_svg.getBoundingClientRect();

    const text = svg2.append("text")
        .attr("id", `time-text`)
        .style("fill", "white")
        .attr("x", SVG_MARGIN)
        .attr("y",document.getElementById("time-svg").getBoundingClientRect().height-1)
        .text(`0 min`);
    const text_element = text._groups[0][0];
    const text_bounds = text_element.getBoundingClientRect();
    svg2.append("rect")
        .attr("id", `time-rect`)
        .attr("x", text_element.getAttribute("x"))
        .attr("y", (text_element.getAttribute("y") - text_bounds.width / 3)-1)
        .attr("width", text_bounds.width)
        .attr("height", text_bounds.height)
        .style("fill", "black");
    
    
    svg.append("line")
        .attr("id","moving-line")
        .attr("x1",SVG_MARGIN)
        .attr("x2",SVG_MARGIN)
        .attr("y1",0)
        .attr("y2",svg_bounds.height)
        .style("stroke-width","1px")
        .style("stroke-dasharray", 3)
        .style("stroke","black");
    
    
    const dotplot = svg.select("g#dotplot");
    const y = (svg_bounds.height-12)/input_from_json.length+1;
    for (let i = 0 ; i < input_from_json.length ; i++) {
        let cy = 14+y*i;
        dotplot.append("path")
            .attr("id",`ex-line-${i}`)
            .classed("example-line",true)
            // .style("opacity",opacity_tangle.getValue("opacity")/100)
            .attr("stroke",colors[i%colors.length])
            .attr("d",fromPositionsToString([[10,cy],[10,cy]]));

    }

}

function setUpAllExampleDots(input) {
    const svg = d3.select("svg#example-container");
    const svg_element = document.getElementById("example-container");
    const dotplot = svg.select("g#dotplot");
    const svg_bounds = svg_element.getBoundingClientRect();
    const max_width = svg_bounds.width - SVG_MARGIN*2;
    const unit = max_width / input[input.length-1].duration;
    const y = (svg_bounds.height-12) / input_from_json.length + 1;
    for (let i = 0 ; i < input.length ; i++) {
        const index = input[i].index;
        const id = `${index}_${input[i].num}`;
        const duration = input[i].duration;
        dotplot.append("circle")
            .attr("id", `ex-circle-${id}`)
            .classed("example-circle", true)
            .attr("display","none")
            .style("fill", colors[index%colors.length])
            .style("opacity", opacity_tangle.getValue("opacity") / 100)
            .style("stroke-width", "0px")
            .style("z-index", 1000)
            .attr("r", 6)
            .attr("cy",  14 + y * index)
            .attr("cx", SVG_MARGIN + unit * duration);
        // const text = dotplot.append("text")
        //     .attr("id", `ex-text-${id}`)
        //     .classed("example-text", true)
        //     .style("visibility", "hidden")
        //     .style("fill", "white")
        //     .attr("x", SVG_MARGIN + unit * duration - 20)
        //     .attr("y",  13 + y * index)
        //     .text(`${Math.round(duration / 60)}min`);
        // const text_element = text._groups[0][0];
        // const text_bounds = text_element.getBoundingClientRect();
        // dotplot.append("rect")
        //     .attr("id", `ex-rect-${id}`)
        //     .classed("example-rect", true)
        //     .style("visibility", "hidden")
        //     .attr("x", text_element.getAttribute("x"))
        //     .attr("y", text_element.getAttribute("y") - text_bounds.width / 3)
        //     .attr("width", text_bounds.width)
        //     .attr("height", text_bounds.height)
        //     .style("fill", "black");
    }
    setUpMiddleValue();
    // dotplot.selectAll("rect").raise();
    // dotplot.selectAll("text").raise();

}

function setUpMiddleValue() {
    d3.selectAll("line.example-middle").remove();
    const svg = d3.select("svg#example-container");
    const svg_bounds = document.getElementById("example-container").getBoundingClientRect();
    const max_width = svg_bounds.width - SVG_MARGIN*2;
    const unit = max_width / loop_listener.max_duration;
    const y = (svg_bounds.height-12) / input_from_json.length + 1;
    
    for (let i = 0 ; i < input_from_json.length ; i++) {
        const value = middle_value_selector.checked ? input_from_json[i].mean : input_from_json[i].median;
        svg.append("line")
            .attr("id", `${middle_value_selector.checked ? "mean" : "median"}-${i}`)
            .attr("display",loop_listener.done_once ? "inline" : "none")
            .classed("example-middle", true)
            // .attr("display","none")
            .style("stroke",colors[i%colors.length])
            .style("stroke-width","2px")
            .attr("x1",SVG_MARGIN+unit*value)
            .attr("x2",SVG_MARGIN+unit*value)
            .attr("y1",13 + y * i- (y/2))
            .attr("y2", 13+ y * i+(y/2))
            .attr("onmousemove", `hoverOverDot("${middle_value_selector.checked ? "mean" : "median"}${i}")`)
            .attr("onmouseout", `stopHoverOverDot("${middle_value_selector.checked ? "mean" : "median"}${i}")`)
        // .attr("cx", unit * duration);
        const text = svg.append("text")
            .attr("id", `ex-text-${middle_value_selector.checked ? "mean" : "median"}${i}`)
            .classed("example-text", true)
            .style("visibility", "hidden")
            .style("fill", "white")
            .attr("x", SVG_MARGIN+ unit * value- 20)
            .attr("y", 13 + y * i)
            .text(`${Math.round(value/60)}min`);
        const text_element = text._groups[0][0];
        const text_bounds = text_element.getBoundingClientRect();
        svg.append("rect")
            .attr("id", `ex-rect-${middle_value_selector.checked ? "mean" : "median"}${i}`)
            .classed("example-rect", true)
            .style("visibility", "hidden")
            .attr("x", text_element.getAttribute("x"))
            .attr("y", text_element.getAttribute("y") - text_bounds.width / 3)
            .attr("width", text_bounds.width)
            .attr("height", text_bounds.height)
            .style("fill", "red");
    }

    // svg.selectAll(`line.example-${middle_value_selector.checked ? "mean" : "median"}`).raise();
}


function* exampleElementsGen(input,draw_line) {
    let time = 0;
    const paths_length = [];
    if (draw_line) {
        for (let i = 0 ; i < input_from_json.length ; i++) {
            paths_length.push(d3.select(`path#ex-distribution-${i}`).node().getTotalLength());
        }
    }
    for (let i = 0 ; i < input.length ; i++) {
        if (input[i].duration <= time) {
            d3.select(`circle#ex-circle-${input[i].index}_${input[i].num}`)
                .attr('display','inline');
        } else if (time <= input[input.length-1].duration) {
            i--;
            time++;
            const svg_bounds = document.getElementById("example-container").getBoundingClientRect();
            const unit = (svg_bounds.width - SVG_MARGIN*2) / input[input.length - 1].duration;
            d3.select("svg line#moving-line")
                .attr("x1",Math.min(SVG_MARGIN+unit*time,svg_bounds.width-SVG_MARGIN))
                .attr("x2",Math.min(SVG_MARGIN+unit*time,svg_bounds.width-SVG_MARGIN));
            if (draw_line) {
                const y = (svg_bounds.height - 12) / input_from_json.length + 1;
                d3.selectAll("path.example-line")
                    .attr("d", function (d, i) {
                        const cy = 14 + y * i;
                        return fromPositionsToString([[SVG_MARGIN, cy], [Math.min(SVG_MARGIN + unit * time, svg_bounds.width - SVG_MARGIN), cy]]);
                    });
                d3.selectAll("line.example-middle")
                    .attr("display",function(d,i) {
                        const value = (middle_value_selector.checked ? input_from_json[i].mean : input_from_json[i].median);
                        return (value <= time) ? "inline" : "none";
                    });


                d3.select("rect#hider1.hider-rectangle")
                    .attr("x",Math.min(SVG_MARGIN+time*unit,svg_bounds.width-SVG_MARGIN));
                
            }
            const text_bounds = document.getElementById("time-text").getBoundingClientRect();
            const text_width = text_bounds.width;
            let x_pos = Math.max(SVG_MARGIN+unit*time-text_width/2,SVG_MARGIN);
            if (x_pos+text_width > svg_bounds.width-SVG_MARGIN) {
                x_pos = svg_bounds.width-SVG_MARGIN - text_width;
            }

            const text = d3.select("text#time-text")
                .attr("x", x_pos)
                .text(`${Math.round(time/60)} min`);
            d3.select("rect#time-rect")
                .attr("x", x_pos)
                .attr("width", text_bounds.width)
                .attr("height", text_bounds.height)
                .style("fill", "black");
            
            text.raise();

            yield time;
        } else {
            time++;
        }
    }
}

function launchUpdateExampleElements(input,draw_line) {
    global_time = 0;
    clearInterval(special_loop);
    const elements_gen = exampleElementsGen(input,draw_line);
    special_loop = setInterval(function() {
        if (running && currently_hovering < 0) {
            const elements_state = elements_gen.next();
            let time = elements_state.value;
            global_time = time;
            if (typeof time === 'undefined' || time === null) {
                time = 0;
            }
            // document.getElementById("time-holder").innerHTML = `${Math.round(time/60)} min`;
            if (elements_state.done && Object.keys(temporary_loops).length >= nb_dots_tangle.getValue("nb_dots")*nb_dots_tangle.getValue("multiplier") || (global_time > loop_listener.max_duration+30)) {
                clearInterval(special_loop);
                all_loops = clearLoops();
                temporary_loops = {};
                loop_listener.done_once = true;
                loop_listener.nbListener();

            } else if (elements_state.done) {
                if (typeof global_time === 'undefined' || global_time === null || global_time  === 'NaN') {
                    global_time = 0;
                }
                if(global_time < loop_listener.max_duration) {
                    global_time = loop_listener.max_duration;
                }
                global_time++;
            }
        }
    },INTERVAL);
    // all_loops.push(loop);

}

function createHider() {
    
    d3.selectAll("g#distribution rect").remove();
    const svg_bounds = document.getElementById("example-container").getBoundingClientRect();
    const distribution = d3.select("svg#example-container g#distribution");
    distribution.append("rect")
        .attr("id","hider1")
        .classed("hider-rectangle",true)
        .style("fill","white")
        .attr("x",SVG_MARGIN)
        .attr("y",0)
        .attr("width",svg_bounds.width-SVG_MARGIN)
        .attr("height",svg_bounds.height);
    
}



function curve(input) {

    d3.selectAll("g path.example-distribution").remove();
    const svg_bounds = document.getElementById("example-container").getBoundingClientRect();

    let xScale = d3.scaleLinear().domain([0, Math.ceil(loop_listener.max_duration) + (Math.ceil(loop_listener.max_duration)/(svg_bounds.width-SVG_MARGIN*2)*(SVG_MARGIN*5))+30]).range([SVG_MARGIN, svg_bounds.width+SVG_MARGIN*4]);

    let max = 0;
    const dataset = [];

    for (let i  = 0 ; i < input_from_json.length ; i++) {
        const tmp_dataset = [[0,0]];
        let j = 0;
        for (let k = 0 ; k <= Math.ceil(loop_listener.max_duration) + (Math.ceil(loop_listener.max_duration)/(svg_bounds.width-SVG_MARGIN*2)*(SVG_MARGIN*5)) ; k+=30) {
            tmp_dataset.push([k,0]);
            while (j < input.length && input[j].duration <= k) {
                if (input[j].index === i) {
                    tmp_dataset[tmp_dataset.length - 1][1]++;
                }
                j++;
            }
            max = Math.max(max,tmp_dataset[tmp_dataset.length-1][1]);

        }

        tmp_dataset.push([ Math.ceil(loop_listener.max_duration) + (Math.ceil(loop_listener.max_duration)/(svg_bounds.width-SVG_MARGIN*2)*(SVG_MARGIN*5)),0]);
        
        dataset.push(tmp_dataset);

    }

    
    const distribution = d3.select("svg#example-container g#distribution");

    // distribution.append("g")
    //     .attr("transform", `translate(0,${svg_bounds.height-30})`)
    //     .call(d3.axisBottom(xScale));
    //
    // distribution.append("g")
    //     .call(d3.axisLeft(yScale));
    const horizontal_bin = (svg_bounds.height-12)/input_from_json.length+1;
    for (let i = 0 ; i < input_from_json.length ; i++) {

        // dataset[i].push([loop_listener.max_duration,0]);
        let yScale = d3.scaleLinear().domain([0, max]).range([13 + horizontal_bin * i, horizontal_bin * i]);

        const line = d3.line()
            .x(function (d) {
                return xScale(d[0]);
            })
            .y(function (d) {
                return yScale(d[1]) + 1;
            })
            .curve(d3.curveCatmullRomClosed.alpha(1));
        // .curve(d3.curveCatmullRom.alpha(0.5));


        distribution.append("path")
            .attr("id", `ex-distribution-${i}`)
            .attr("display", "inline")
            .classed("example-distribution", true)
            .datum(dataset[i])
            // .attr("transform", "translate(" + 100 + "," + 100 + ")")
            .attr("d", line)
            .style("fill", colors[i % colors.length])
            .style("stroke", colors[i % colors.length])
            .style("stroke-width", "1px");


        // const line_length = line_drawn.node().getTotalLength();
        //
        // line_drawn.attr("stroke-dashoffset", line_length)
        //     .attr("stroke-dasharray", line_length);

    }
    createHider();
        
}


