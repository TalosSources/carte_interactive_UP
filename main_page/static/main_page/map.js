const map = L.map('map');

let initLatNr = 57.70; // "y"
let initLngNr = 11.97; // "x"
let initLatLng = L.latLng(initLatNr, initLngNr);
let initZoomLevelNr = 12;
map.setView(initLatLng, initZoomLevelNr);
// [initLatNr, initLngNr]

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
    const location_api_url = "/api/main_page/";
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
