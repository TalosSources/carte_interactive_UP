const map = L.map('map');
let xNr = 51.505;
let yNr = -0.09;
let zoomLevelNr = 14;
map.setView([xNr, yNr], zoomLevelNr);

const maxZoomNr = 19;
const attributionSg = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const osmTemplateSg = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const osmTileLayerOptionsOt = {
    maxZoom: maxZoomNr,
    attribution: attributionSg
}
const osmTileLayer = L.tileLayer(osmTemplateSg, osmTileLayerOptionsOt);
osmTileLayer.addTo(map);
