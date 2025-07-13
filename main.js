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
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

function renderTagFilters() {
    const tagsSet = new Set();
    allPlaces.forEach(p => p.tags && p.tags.forEach(t => tagsSet.add(t)));
//   const tags = Array.from(tagsSet).sort().slice(0, 20); // limit to 20
    const tagsFilter = document.getElementById("tagsFilter");
    tagsFilter.innerHTML = ""; // Clear if re-rendering
    tagsSet.forEach(tag => {
    const label = document.createElement("label");
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

    filteredPlaces = allPlaces.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchQuery) ||
                            (place.description && place.description.toLowerCase().includes(searchQuery)) ||
                            (place.tags && place.tags.join(" ").toLowerCase().includes(searchQuery));

    const matchesTags = checkedTags.length === 0 || place.tags?.some(t => checkedTags.includes(t));
    return matchesSearch && matchesTags;
    });

    renderCards();
    renderMarkers();
}

function renderCards() {
    const cardsDiv = document.getElementById("cards");
    cardsDiv.innerHTML = "";
    filteredPlaces.forEach(place => {
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

    if (place.description) {
        const p = document.createElement("p");
        p.textContent = place.description;
        a.appendChild(p);
    }

    if (place.tags && place.tags.length) {
        const tagsDiv = document.createElement("div");
        tagsDiv.className = "tags";
        place.tags.forEach(tag => {
        const span = document.createElement("span");
        span.textContent = tag;
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
    const marker = L.marker([place.lat, place.lng]).addTo(map)
        .bindPopup(`<b>${place.name}</b><br>${place.description || ""}`);
    markers.push(marker);
    });
}