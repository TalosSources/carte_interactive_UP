let allPlaces = [];
let filteredPlaces = [];
let map, markers = [];
let highlightedId = "";

fetch('data/places.json')
    .then(response => response.json())
    .then(data => {
    allPlaces = data;
    map = initMap();
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
    renderTagFilters();
    filterPlaces(); // initial render
    });


function fitMapToPlaces(places) {
  if (places.length === 0) return;
  if (places.length === 1) {
    map.setView([places[0].lat, places[0].lng], 16);
    return;
  }
  const group = new L.featureGroup(
    places.map(p => L.marker([p.lat, p.lng]))
  );
  // TODO: Max zoom, to avoid getting too close? 
  map.fitBounds(group.getBounds(), { padding: [20, 20] });
}

function renderTagFilters() {
    const tagCounts = {};
    allPlaces.forEach(p => {
        const currentLang = localStorage.getItem('language') || 'fr';
        const languageTagsKey = `tags_${currentLang}`;
        placeTags = p[languageTagsKey] || p[`tags`]
        placeTags && placeTags.forEach(t => {
            tagCounts[t] = (tagCounts[t] || 0) + 1;
        })
    });
    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
    const tagsFilter = document.getElementById("tagsFilter");
    tagsFilter.innerHTML = ""; // Clear if re-rendering
    sortedTags.forEach(tag => {
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
        img.onerror = () => {
            img.remove();
        };
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
                // map.options.autoPan = false;
                marker[0].openPopup();
                // map.options.autoPan = true; 
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
        const marker = L.marker([place.lat, place.lng], {icon: greenIcon}).addTo(map)
            .bindPopup(popupHTML, {autoPan: false});
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
