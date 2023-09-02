
  
  


async function loadPreset(key,city_name) {
        if (key === 0) {
        // d3.select("div#experiment")
        //     .style("visibility","visible");     
        } else if (key > 0 && key <= 18) {
            // document.getElementById("form_button").innerHTML = "next"
            colors = ["#FF6FBE","#FFD004","#392DFF"];
            d3.select('span#middle-value')
                .style("visibility",'hidden');
            nb_simulations_tangle.setValue("nb_simulations",presaved[0]["result"].length);
            document.getElementById("cities").value = city_name;

            traffic_signals_info = await getTrafficSignalsOf(cities_selector.value);
            await startAnimation(cities_selector.value);
            cities_selector.disabled = true;
            const coordinates = [presaved[0].base_segments.segments[0].start_coordinates,presaved[0].base_segments.segments[presaved[0].base_segments.segments.length-1].end_coordinates];
            createRouting(map_instance, coordinates[0]);
            await routing_control._loadPreset(coordinates);
        } else if (key === 19) {
            document.getElementById("form_button").innerHTML = "Thanks!";
            
        }
        
        if (key >= 19) {
            document.getElementById("cities").value = "Toronto";
            traffic_signals_info = await getTrafficSignalsOf(cities_selector.value);
            await startAnimation(cities_selector.value);}
        
        if (requiresClick(key)) {
            document.getElementById("map").style.cursor = "crosshair";                     
        }
}




function requiresClick(i) {
    return i === 13 || i === 17;
    
}


function loadTutorial() {
    d3.select("div#experiment")
        .style("visibility", "hidden");
    d3.select("span#tutorial")
        .style("visibility", "visible");
    
    document.getElementById("tutorial").innerHTML = "^^ Start by selecting Wellington in the 'Choose a city' drop-down menu. ^^";
    tutorial = 0;
    
    type_map_selector.disabled = true;
    document.getElementById("color-for-0").disabled = true;
    
}

function nextStepTutorial() {
    tutorial++;
    task_done = false;
    let circle_marker;
    let color_pickers;
    switch(tutorial) {
        case 1:
            cities_selector.disabled = true;
            break;
        case 2:
            document.getElementById("tutorial").innerHTML = "Click again on the red marker to select a destination.";
            colors = ["#FF6FBE","#FFD004","#392DFF","#8FE042"];
            return L.circleMarker([-41.29237935805799,174.78196620941165],{radius:10,color:'red'}).addTo(map_instance);
        case 3:
            document.getElementById("tutorial").innerHTML = "^^ Try changing the number of dots on the menu by dragging the value in blue towards the left or the right. ^^";
            color_pickers = document.getElementsByClassName("color-for");
            for (let i = 0 ; i < color_pickers.length ; i++) {
                color_pickers[i].disabled = true;
            }
            break;
        case 4:
            loop_listener.done_once = false;
            nextStep(map_instance, input_from_json, nb_dots_tangle.getValue("nb_dots"));
            addLinesForExample();
            waiting_to_restart = false;
            document.getElementById("tutorial").innerHTML = "^^ Now try changing the number of simulations that are generated. ^^";
            break;
        case 5:
            document.getElementById("tutorial").innerHTML = "^^ You can also change the opacity of the dots. ^^";
            break;
        case 6:
            document.getElementById("tutorial").innerHTML = "^^ If you change the range of speeds, the simulations will be regenerated. ^^";
            break;
        case 7:
            document.getElementById("tutorial").innerHTML = "^^ Hovering over the color of a path on the top menu will display the total distance directly beside the path on the map. ^^";
            color_pickers = document.getElementsByClassName("color-for");
            for (let i = 0 ; i < color_pickers.length ; i++) {
                color_pickers[i].disabled = false;
            }
            break;
        case 8:
            // document.getElementById("tutorial").innerHTML = "^^ Clicking on a path color on this menu lets you choose your own. ^^";
            // tutorial++;
            setTimeout(nextStepTutorial(),1000);
            break;
        case 9:
            document.getElementById("tutorial").innerHTML = "^^ You can also change the type of tile that is displayed using the 'Choose a map' drop-down menu. Try selecting the 'Toner'. ^^";
            type_map_selector.disabled = false;
            break;
        case 10:
            document.getElementById("tutorial").innerHTML = "When both starting point and destination are set, clicking on a map will generate a new path that will pass through that point. For example, let's say you want to also drop by the red marker.";
            // type_map_selector.disabled = true;
            circle_marker = L.circleMarker([-41.29631151699859, 174.7795629501343],{radius:10,color:'red'}).addTo(map_instance);
            circle_marker.getElement().id = "circle_marker_tutorial";
            break;
        case 11:
            document.getElementById("tutorial").innerHTML = "You can also drag a path to add a detour. Try dragging one path on the new red marker.";
            circle_marker = L.circleMarker([-41.289865230584894, 174.77587223052979],{radius:10,color:'red'}).addTo(map_instance);
            circle_marker.getElement().id = "circle_marker_tutorial";
            break;
        case 12:
            document.getElementById("tutorial").innerHTML = "Did you notice that creating detours added new black markers on the path? If you want to remove a stop along a path, hold SHIFT while clicking on the associated black marker.";
            break;
        case 13:
            document.getElementById("tutorial").innerHTML = "You can also remove a whole path by holding SHIFT while clicking on either the color picker associated with the path, or the path itself.";
            break;
        case 14:
            d3.select("span#tutorial")
                .style("top", "65vh");
            document.getElementById("tutorial").innerHTML = "vv On the bottom bar, you can hover onto the plot to replay specific moments. vv";
            break;
        case 15:
            setTimeout(function() {
                document.getElementById("tutorial").innerHTML = "vv And if you hover over the vertical bars on the plot, you have access to the median value. vv";
            },3000);
            break;
        case 16:
            document.getElementById("tutorial").innerHTML = "vv But you can also use the toggle button to display mean values instead of median values. vv";
            break;
        case 17:
            document.getElementById("tutorial").innerHTML = "vv The other toggle button is used to switch to a distribution plot. vv";
            break;
        case 18:
            document.getElementById("tutorial").innerHTML = "Now try to use what you learnt to move the starting or ending point.";
            break;
        case 19:
            document.getElementById("tutorial").innerHTML = "Finally, if you hold SHIFT while clicking on a starting or ending point, everything will be reset.";
            break;
        case 20:
            tutorial = -1;
            document.getElementById("tutorial").innerHTML = "Congrats! You now know how to use this tool. There are many other things that you can do, such as zooming, panning, dragging additional stops... or even pause the animation using the SPACEBAR. Don't hesitate to try and do what you want. Press the RIGHTARROW key when you want to exit the tutorial.";
            document.getElementById("form_button").innerHTML = "Start experiment";
            
            break;
        default:
            break;

    }
    

}


