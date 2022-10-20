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

async function load_initiative() {
    // initiative_api_url is defined in the html, in a separate <script> tag, just above the one which loads this file.
    // We have to define it outside the .js file, because Django templates do not work in Javascript";
    // TODO: in_bbox=_____
    const initiative_response = await fetch(initiative_api_url);
    console.log(`initiative_response = ${initiative_response}`);
    const initiative_json = await initiative_response.json();
    console.log(`initiative_json = ${JSON.stringify(initiative_json, null, 4)}`);
    return initiative_json;
}

async function render_locations() {
    const initiative = await load_initiative();
    const locations = initiative.locations;
    const geo_json_ot = L.geoJSON(locations);
    geo_json_ot.addTo(map);
}

map.on("moveend", render_locations);

render_locations();
