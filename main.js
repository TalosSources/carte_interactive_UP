let allPlaces = [];
let filteredPlaces = [];
let map, markers = [];

fetch('data/places.json')
    .then(response => response.json())
    .then(data => {
    allPlaces = data;
    initMap();
    renderTagFilters();
    filterPlaces(); // initial render
    });

function initMap() {
    map = L.map('map').setView([46.5300, 6.61011], 13);
    
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

    map.on("moveend", () => {
        console.log("moved!")
        const bounds = map.getBounds();
        const visiblePlaces = filteredPlaces.filter(place => {
            return bounds.contains([place.lat, place.lng]);
        });
        console.log("found visiblePlaces: ", visiblePlaces);
        renderCards(visiblePlaces);
        // ???
    });
}

function fitMapToPlaces(places) {
  if (places.length === 0) return;
  const group = new L.featureGroup(
    places.map(p => L.marker([p.lat, p.lng]))
  );
  // TODO: Max zoom, to avoid getting too close? 
  map.fitBounds(group.getBounds(), { padding: [20, 20] });
}

function renderTagFilters() {
    const tagsSet = new Set();
    allPlaces.forEach(p => {
        const currentLang = localStorage.getItem('language') || 'fr';
        const languageTagsKey = `tags_${currentLang}`;
        placeTags = p[languageTagsKey] || p[`tags`]
        placeTags && placeTags.forEach(t => tagsSet.add(t))
    });
//   const tags = Array.from(tagsSet).sort().slice(0, 20); // limit to 20
    const tagsFilter = document.getElementById("tagsFilter");
    tagsFilter.innerHTML = ""; // Clear if re-rendering
    tagsSet.forEach(tag => {
        const label = document.createElement("label");
        label.style.backgroundColor = getTagColor(tag);
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = tag;
        input.addEventListener("change", filterPlaces);
        label.appendChild(input);
        label.append(tag);
        tagsFilter.appendChild(label);
    });
}

document.getElementById("searchInput").addEventListener("input", filterPlaces);

function filterPlaces() {
    const searchQuery = document.getElementById("searchInput").value.toLowerCase();
    const checkedTags = Array.from(document.querySelectorAll("#tagsFilter input:checked")).map(i => i.value);
    const currentLang = localStorage.getItem('language') || 'fr';

    filteredPlaces = allPlaces.filter(place => {
    const languageDescriptionKey = `description_${currentLang}`;
    const languageTagsKey = `tags_${currentLang}`;
    const placeDescription = place[languageDescriptionKey] || place[`description`]
    const placeTags = place[languageTagsKey] || place[`tags`]
    const matchesSearch = place.name.toLowerCase().includes(searchQuery) ||
                            (placeDescription && placeDescription.toLowerCase().includes(searchQuery)) ||
                            (placeTags && placeTags.join(" ").toLowerCase().includes(searchQuery));

    const matchesTags = checkedTags.length === 0 || placeTags?.some(t => checkedTags.includes(t));
    return matchesSearch && matchesTags;
    });

    renderCards(filteredPlaces);
    renderMarkers();
    fitMapToPlaces(filteredPlaces);
}

function renderCards(visiblePlaces) {
    const currentLang = localStorage.getItem('language') || 'fr';
    const languageDescriptionKey = `description_${currentLang}`;
    const languageTagsKey = `tags_${currentLang}`;

    const cardsDiv = document.getElementById("cards");
    cardsDiv.innerHTML = "";
    visiblePlaces.forEach(place => {
    const a = document.createElement("a");
    a.href = `place.html?id=${place.id}`;
    a.className = "card";

    if (place.image) {
        const img = document.createElement("img");
        img.src = place.image;
        img.alt = place.name;
        a.appendChild(img);
    }

    const h3 = document.createElement("h3");
    h3.textContent = place.name;
    a.appendChild(h3);

    const placeDescription = place[languageDescriptionKey] || place[`description`];
    if (placeDescription) {
        const p = document.createElement("p");
        p.textContent = placeDescription;
        a.appendChild(p);
    }

    const placeTags = place[languageTagsKey] || place[`tags`]
    if (placeTags && placeTags.length) {
        const tagsDiv = document.createElement("div");
        tagsDiv.className = "tags";
        placeTags.forEach(tag => {
            const span = document.createElement("span");
            span.textContent = tag;
            span.style.backgroundColor = getTagColor(tag)
            tagsDiv.appendChild(span);
        });
        a.appendChild(tagsDiv);
    }

    cardsDiv.appendChild(a);
    });
}

function renderMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    filteredPlaces.forEach(place => {
    const currentLang = localStorage.getItem('language') || 'fr';
    const languageDescriptionKey = `description_${currentLang}`;
    const placeDescription = place[languageDescriptionKey] || place[`description`]; // TODO: Factorize that in a method, and perhaps find a cleaner way.
    const marker = L.marker([place.lat, place.lng]).addTo(map)
        .bindPopup(`<b>${place.name}</b><br>${placeDescription || ""}`);
    markers.push(marker);
    });
}