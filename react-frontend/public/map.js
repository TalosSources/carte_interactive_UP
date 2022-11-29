const map = L.map('map');

// Setting the position and zoom..
// ..if the user doesn't allow sharing of position
let initLatNr = 57.70; // "y"
let initLngNr = 11.97; // "x"
let initLatLng = L.latLng(initLatNr, initLngNr);
let initZoomLevelNr = 12;
map.setView(initLatLng, initZoomLevelNr);

// ..if the user does allow sharing of position
map.locate({setView: true, maxZoom: 14});
/*
function onLocationError(e) {
    alert(e.message);
}
map.on('locationerror', onLocationError);
 */
// map.on('locationfound', onLocationFound)

const maxZoomNr = 19;
const attributionSg = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const osmUrlTemplateSg = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const osmTileLayerOptionsOt = {
    maxZoom: maxZoomNr,
    attribution: attributionSg
};
const osmTileLayer = L.tileLayer(osmUrlTemplateSg, osmTileLayerOptionsOt);
osmTileLayer.addTo(map);

/*
let myPointLat = 51.5;
let myPointLng = -0.04;
let myPointMarker = L.marker([myPointLat, myPointLng]);
myPointMarker.addTo(map);
const myPointMarkerPopup = myPointMarker.bindPopup("Hello Leaflet (this takes html or text)");
myPointMarkerPopup.openPopup();
*/

async function load_locations() {
    const location_api_url = "http://127.0.0.1:8009/api/locations/";
    // TODO: in_bbox=_____
    const response = await fetch(location_api_url);
    const geojson = await response.json();
    return geojson;
}

async function render_locations() {
    const locations = await load_locations();
    const geo_json_ot = L.geoJSON(locations);
    geo_json_ot.addTo(map);
}

map.on("moveend", render_locations);

render_locations();
