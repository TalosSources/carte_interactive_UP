let map = [];

// TODO: Modularize this one
function initMiniMap(place) {
    map = initMap(maxZoom = 18);
    const popupHTML = `<strong>${place.name}</strong>`;
    const marker = L.marker([place.lat, place.lng], {icon: greenIcon}).addTo(map)
        .bindPopup(popupHTML).openPopup();
    map.setView([place.lat, place.lng], 16)
    // map = L.map('map', {maxZoom: 16}).setView([46.5300, 6.61011], 13);


    return map;
}

fetch('data/places.json')
    .then(response => response.json())
    .then(data => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id");
        const place = data.find(p => p.id == id);

        if (place) {
            const currentLang = localStorage.getItem('language') || 'fr';
            const languageDescriptionKey = `description_${currentLang}`;
            const languageLongDescriptionKey = `long_description_${currentLang}`;
            const languageTagsKey = `tags_${currentLang}`;
            const placeDescription = place[languageDescriptionKey] || place[`description`];
            const placeLongDescription = place[languageLongDescriptionKey] || place[`long_description`];
            const placeWebsite = place[`website`];
            document.getElementById("title").textContent = place.name;
            
            // use HTML for descriptions: richer content
            document.getElementById("description").innerHTML = placeDescription || "";
            document.getElementById("website").innerHTML = placeWebsite ? `<a href="${placeWebsite}" data-i18n="website"></a>` : "";
            document.getElementById("longDescription").innerHTML = placeLongDescription || "";

            const img = document.getElementById("image");
            if (place.image) {
            img.src = place.image;
            img.alt = place.name;
            img.onerror = () => {
                img.style.display = "none";
            };
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

        map = initMiniMap(place);
        // map.invalidateSize();
        window.dispatchEvent(new Event('resize'));
        
});