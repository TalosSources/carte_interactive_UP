let allPlaces = [];
let filteredPlaces = [];
let map, markers = [];
let highlightedId = "";

fetch('data/places.json')
    .then(response => response.json())
    .then(data => {
    allPlaces = data;
    initMap();
    renderTagFilters();
    filterPlaces(); // initial render
    });
var LeafIcon = L.Icon.extend({
    options: {
        iconSize:     [38, 95],        // taille de l'icône
        shadowSize:   [50, 64],        // taille de l'ombre
        iconAnchor:   [22, 94],        // point de l'icône correspondant à la position du marqueur
        shadowAnchor: [4, 62],         // idem pour l'ombre
        popupAnchor:  [-3, -76]        // point à partir duquel la popup s'ouvre par rapport à l'icône
    }
});
var greenIcon = new LeafIcon({
    iconUrl: 'https://raw.githubusercontent.com/TalosSources/carte_interactive_UP/refs/heads/static/NEW%20ICON-01.png',
});
function initMap() {
    map = L.map('map', {maxZoom: 16}).setView([46.5300, 6.61011], 13);
    
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
    places.map(p => L.marker([p.lat, p.lng]{ icon: greenIcon })))
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
const toggleBtn = document.getElementById('filterReset');
toggleBtn.onclick = () => {
    searchInput = document.getElementById("searchInput")
    searchInput.value = "";

    tagInputs = document.querySelectorAll('#tagsFilter input[type="checkbox"]');
    tagInputs.forEach(input => {
        if (input.checked) {
            input.checked = false;
        }
    })
    filterPlaces();
};

function filterPlaces() {
    const searchQuery = normalizeString(document.getElementById("searchInput").value);
    const checkedTags = Array.from(document.querySelectorAll("#tagsFilter input:checked")).map(i => i.value);
    const currentLang = localStorage.getItem('language') || 'fr';

    filteredPlaces = allPlaces.filter(place => {
    const languageDescriptionKey = `description_${currentLang}`;
    const languageLongDescriptionKey = `long_description_${currentLang}`;
    const languageTagsKey = `tags_${currentLang}`;
    const placeDescription = place[languageDescriptionKey] || place[`description`]
    const placeLongDescription = place[languageLongDescriptionKey] || place[`long_description`]
    const placeTags = place[languageTagsKey] || place[`tags`]
    const matchesSearch = place.name.toLowerCase().includes(searchQuery) ||
                            (placeDescription && normalizeString(placeDescription).includes(searchQuery)) ||
                            (placeLongDescription && normalizeString(placeLongDescription).includes(searchQuery)) ||
                            (placeTags && normalizeString(placeTags.join(" ")).includes(searchQuery));

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

    const currentCardContainer = document.getElementById("cards");
    const currentVisibleIds = new Set(
        [...currentCardContainer.children].map(card => card.dataset.id)
    );
    const newVisibleIds = new Set(visiblePlaces.map(p => p.id));
    [...currentCardContainer.children].forEach(card => {
        if (!newVisibleIds.has(card.dataset.id)) {
            currentCardContainer.removeChild(card);
        }
    });
    visiblePlaces.forEach(place => {
        if (!currentVisibleIds.has(place.id)) {
            const card = createCard(place, languageDescriptionKey, languageTagsKey); // assume this creates and returns the <a> element
            currentCardContainer.appendChild(card);
        }
    });

    if (highlightedId) {
        const card = currentCardContainer.querySelector(`[data-id="${highlightedId}"]`);
        if (card) {
            // card.classList.add("highlighted");
            highlightCardById(highlightedId, false);
        }
    }
}

function createCard(place, ldk, ltk) {
    const card = document.createElement("a");
    card.href = `place.html?id=${place.id}`;
    card.className = "card";
    card.dataset.id = place.id;

    if (place.image) {
        const img = document.createElement("img");
        img.src = place.image;
        img.alt = place.name;
        card.appendChild(img);
    }

    const h3 = document.createElement("h3");
    h3.textContent = place.name;
    card.appendChild(h3);

    const placeDescription = place[ldk] || place[`description`];
    if (placeDescription) {
        const p = document.createElement("p");
        p.textContent = placeDescription;
        card.appendChild(p);
    }

    const placeTags = place[ltk] || place[`tags`]
    if (placeTags && placeTags.length) {
        const tagsDiv = document.createElement("div");
        tagsDiv.className = "tags";
        placeTags.forEach(tag => {
            const span = document.createElement("span");
            span.textContent = tag;
            span.style.backgroundColor = getTagColor(tag)
            span.onclick = (event) => {
                event.stopPropagation();
                event.preventDefault();
                const tagFilters = document.querySelectorAll('#tagsFilter input[type="checkbox"]');
                tagFilters.forEach(input => {
                    if (input.value === tag) {
                        input.checked = true;
                        // Manually dispatch change event to trigger filtering
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });
            }
            tagsDiv.appendChild(span);
        });
        card.appendChild(tagsDiv);
    }

    card.addEventListener('mouseover', () => {
        console.log("hovered card ", place.name);
        markers.forEach(marker => {
            if (marker[1] === place.id) {
                console.log("found corresponding marker!")
                map.options.autoPan = false;
                marker[0].openPopup();
                map.options.autoPan = true; 
                highlightCardById(place.id, false);
                // marker[0].getPopup().openOn(map);
            } 
        })
    })

    return card;
}

function renderMarkers() {
    markers.forEach(m => map.removeLayer(m[0]));
    markers = [];

    filteredPlaces.forEach(place => {
        const currentLang = localStorage.getItem('language') || 'fr';
        const languageDescriptionKey = `description_${currentLang}`;
        const placeDescription = place[languageDescriptionKey] || place[`description`]; // TODO: Factorize that in a method, and perhaps find a cleaner way.
        const popupHTML = `
            <a href="place.html?id=${place.id}" class="popup-link">
                <div class="popup-card">
                <strong>${place.name}</strong><br>
                ${placeDescription || ""}
                </div>
            </a>
        `;
        const marker = L.marker([place.lat, place.lng]).addTo(map)
            .bindPopup(popupHTML);
        // marker.on('popupopen', () => {
        //     highlightCardById(place.id);
        // })
        marker.on('click', () => {
            highlightCardById(place.id);
        })
        marker.on('popupclose', () => {
            console.log("closed popup: ", place.id);
            unhighlightCard(place.id);
        })
        // marker = marker.bindTooltip(place.name); // optional, I think unneccessary
            // .bindPopup(`<b><a href="place.html?id=${place.id}">${place.name}</a></b><br>${placeDescription || ""}`);
        markers.push([marker, place.id]);
    });
}

function unhighlightCard(id) {
    if (highlightedId === id) {
        const target = document.querySelector(`.card[data-id="${id}"]`);
        if (target) {
            target.classList.remove('highlighted');
        }
        highlightedId = "";
    }
}

function highlightCardById(id, moveFirst=true) {
    // Remove highlight from all
    document.querySelectorAll('.card').forEach(card => {
        console.log("card here: ", card)
        card.classList.remove('highlighted');
    });
    highlightedId = "";

    // Add highlight to the matching one
    const target = document.querySelector(`.card[data-id="${id}"]`);
    console.log("in highlightCardById, found target=", target)
    if (target) {
        target.classList.add('highlighted');
        const container = document.getElementById("cards"); // adjust to your layout
        if (moveFirst && target && container) {
            container.prepend(target);
        }
        highlightedId = id;
        // Optional: scroll to it
        // target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}
