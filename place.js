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