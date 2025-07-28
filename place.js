fetch('data/places.json')
.then(response => response.json())
.then(data => {
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const place = data.find(p => p.id == id);

if (place) {
    document.getElementById("title").textContent = place.name;
    document.getElementById("description").textContent = place.description || "";

    const img = document.getElementById("image");
    if (place.image) {
    img.src = place.image;
    img.alt = place.name;
    } else {
    img.style.display = "none";
    }

    if (place.tags && place.tags.length) {
    const tagsDiv = document.getElementById("tags");
    place.tags.forEach(tag => {
        const span = document.createElement("span");
        span.textContent = tag;
        tagsDiv.appendChild(span);
    });
    }
} else {
    document.body.innerHTML = "<h1>Place not found</h1>";
}
});