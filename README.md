# Animated Hypothetical Trips to Communicate Space-Based Temporal Uncertainty on Digital Maps

This tool is a demo version. The simulation model uses pedestrian logic but sends request to the OSRM API default profile which returns itineraries for cars. As a result, this version might produce illogical detours and surprising changes of speed (not based on elevation). This is not the version (backend) that was used for the study, but still produces similar visuals (frontend) and allows for the same interactions.

## Description of files
- ``index.html`` contains the main HTML code for the tool webpage.
- ``tutorial.html`` contains the tutorial webpage.
- ``main.js`` contains the main JavaScript functions.
- ``LeafletAddOn.js`` contains the Leaflet extension used to manage the animation displayed on the map and the requests to OSRM+Overpass.
- ``plots.js`` contains the functions used for the static plots.
- ``presets_functions.js`` contains the functions that were used during the study to load the scenarios (unused here).
- ``settings.js`` contains the functions that are needed to connect to the correct port (local server, unused here), retrieve the correct coordinates and load the different map tiles.
- ``simulation.js`` contains the objects and functions needed for the simulation model and the sampling.
- ``variables.js`` contains the functions that manage the parameters (e.g., number of simulations, opacity).

All other HTML files are the preset scenarios (they contain the presaved data).

## Disclaimer
This tool was built first as a prototype and the code is not at its cleanest potential.
