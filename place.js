fetch('data/places.json')
.then(response => response.json())
.then(data => {
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const place = data.find(p => p.id == id);
initMiniMap();

// TODO: Modularize this one
function initMiniMap() {
    map = L.map('map');

    // ok but not very appealing
    var osm_org = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
    });

    // absolutely unusable but very cool
    var stadia_stamenWatercolor = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.{ext}', {
        minZoom: 1,
        maxZoom: 16,
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        ext: 'jpg'
    });

    var stadia_stamenToner = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.{ext}', {
	    minZoom: 0,
	    maxZoom: 20,
	    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	    ext: 'png'
    });

    // osm_org.addTo(map);
    // stadia_stamenWatercolor.addTo(map);
    stadia_stamenToner.addTo(map);

    const marker = L.marker([place.lat, place.lng]).addTo(map)
    const group = new L.featureGroup([marker]);
    // TODO: Max zoom, to avoid getting too close? 
    map.fitBounds(group.getBounds(), { padding: [20, 20] });
    map.setZoom(16)
}

if (place) {
    const currentLang = localStorage.getItem('language') || 'fr';
    const languageDescriptionKey = `description_${currentLang}`;
    const languageLongDescriptionKey = `long_description_${currentLang}`;
    const languageTagsKey = `tags_${currentLang}`;
    const placeDescription = place[languageDescriptionKey] || place[`description`];
    const placeLongDescription = place[languageLongDescriptionKey] || place[`long_description`];
    document.getElementById("title").textContent = place.name;
    
    // use HTML for descriptions: richer content
    document.getElementById("description").innerHTML = placeLongDescription || placeDescription || "";
    // document.getElementById("description").textContent = placeDescription || "";

    const img = document.getElementById("image");
    if (place.image) {
    img.src = place.image;
    img.alt = place.name;
    } else {
    img.style.display = "none";
    }

    const placeTags = place[languageTagsKey] || place[`tags`]
    if (placeTags && placeTags.length) {
    const tagsDiv = document.getElementById("tags");
    placeTags.forEach(tag => {
        const span = document.createElement("span");
        span.textContent = tag;
        span.style.backgroundColor = getTagColor(tag);
        tagsDiv.appendChild(span);
    });
    }
} else {
    document.body.innerHTML = "<h1>Place not found</h1>";
}
});