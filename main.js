const map = L.map('map').setView([59.3293, 18.0686], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

fetch('data/places.json')
  .then(response => response.json())
  .then(places => {
    const placesDiv = document.getElementById('places');
    places.forEach(place => {
      const marker = L.marker([place.lat, place.lng]).addTo(map)
        .bindPopup(`<b>${place.name}</b><br>${place.description}`);

      const card = document.createElement('div');
      card.innerHTML = `<h3>${place.name}</h3><p>${place.description}</p>`;
      placesDiv.appendChild(card);
    });
  });