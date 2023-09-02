/**
 * Provides the coordinates of a given city based on a name
 * @param {string} city The name of the city
 * @returns {number[]} The coordinates of the city
 */
function cityCoordinates(city) {
    switch(city) {
        case 'Alger':
            return [36.72979, 3.07554];
        case 'Oran':
            return [35.70134, -0.64630];
        case 'Auckland':
            return [-36.85410, 174.76313];
        case 'Wellington':
            return [-41.29209, 174.77446];
        case 'Christchurch':
            return [-43.53313, 172.63529];
        case 'Oklahoma City':
            return [35.46897, -97.52124];
        case 'Tulsa':
            return [36.15505, -95.98955];
        case 'Valparaiso':
            return [-33.04724, -71.61277];
        case 'Santiago':
            return [-33.45186, -70.65047];
        case 'Pucón':
            return [-39.27616, -71.97465];
        case 'Vina del Mar':
            return [-33.02505, -71.55225];
        case 'New Bedford':
            return [41.63524, -70.92745];
        case 'Boston':
            return [42.36026, -71.05728];
        case 'Albi':
            return [43.92734, 2.14621];
        case 'Toulouse':
            return [43.60442, 1.44375];
        case 'Thiès':
            return [14.79691, -16.92805];
        case 'Dakar':
            return [14.72117, -17.44774];
        case 'Saint-Louis':
            return [16.01829, -16.49064];
        case 'Touba':
            return [14.86437, -15.87442];
        case 'Mont-de-Marsan':
            return [43.89296, -0.50551];
        case 'Pau':
            return [43.29857, -0.37060];
        case 'Bordeaux':
            return [44.83807, -0.57777];
        case 'Berlin':
            return [52.517037,13.388860];
        case 'Toronto':
            return [43.65953, -79.39829];
        case 'Ottawa':
            return [45.42001, -75.68954];
        case 'Kitchener':
            return [43.45230, -80.49217];
        case 'Mississauga':
            return [43.58916, -79.64498];
        default:
            return [0,0];
    }
}

/**
 * Provides the port on which requests' answers will be sent
 * @param {string} city The name of the city
 * @returns {number} The number of the port on which data is sent
 */
function cityPort(city) {
    switch(city) {
        case 'Alger':
        case 'Oran':
            return 5656;
        case 'Auckland':
        case 'Wellington':
        case 'Christchurch':
            return 4568;
        case 'Oklahoma City':
        case 'Tulsa':
            return 3876;
        case 'Viña del Mar':
        case 'Santiago':
        case 'Pucón':
        case 'Valparaíso':
            return 3989;
        case 'Boston':
        case 'New Bedford':
            return 8118;
        case 'Toulouse':
        case 'Albi':
            return 4343;
        case 'Dakar':
        case 'Thiès':
        case 'Saint-Louis':
        case 'Touba':
            return 3333;
        case 'Mont-de-Marsan':
        case 'Pau':
        case 'Bordeaux':
            return 3033;
        case 'Berlin' :
            return 8088;
        case 'Mississauga':
        case 'Kitchener':
        case 'Ottawa':
        case 'Toronto' :
            return 8080;
        default:
            return 0;
    }
}




function getCountry(city) {
    switch(city) {
        case 'Auckland':
        case 'Wellington':
        case 'Christchurch':
            return "New Zealand";
        case 'Gyumri':
        case 'Vanadzor':
        case 'Yerevan':
            return "Armenia";
        case 'Busan':
        case 'Incheon':
        case 'Daegu':
        case 'Seoul':
            return "South Korea";
        case 'Boston':
        case 'New Bedford':
            return "Massachussetts";
        case 'Mont-de-Marsan':
        case 'Pau':
        case 'Bordeaux':
        case 'Toulouse':
        case 'Albi':
            return "France";
        case 'Aberdeen':
        case 'Dundee':
        case 'Edinburgh':
        case 'Glasgow':
            return "Scotland";
        case 'Berlin' :
            return "Germany";
        case 'Mississauga':
        case 'Kitchener':
        case 'Ottawa':
        case 'Toronto' :
            return "Ontario";
        default:
            return 0;
    }
}





function selectTiles(type) {
    if (map_instance === null || typeof map_instance === 'undefined') {
        return false;
    }
    switch(type) {
        case 'topography':
            L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            }).addTo(map_instance);
            break;
        case 'toner':
            L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.{ext}', {
                attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                subdomains: 'abcd',
                maxZoom: 19,
                ext: 'png'
            }).addTo(map_instance);
            break;
        case 'imagery':
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                maxZoom: 19
            }).addTo(map_instance);
            break;
        default:
        case 'regular':
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                subdomains: 'abcd',
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map_instance);
            break;
    }
    return true;
}



