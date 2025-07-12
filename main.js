// 1️⃣ Create the map and set view to your city
const map = L.map('map').setView([59.3293, 18.0686], 13); // Stockholm coords as example

// 2️⃣ Add the OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

// 3️⃣ Load the places.json file
fetch('data/places.json')
  .then(response => response.json())
  .then(places => {
    // 4️⃣ Get the div where we will show the cards
    const placesDiv = document.getElementById('places');

    // 5️⃣ For each place, add a marker AND a card
    places.forEach(place => {
      // Add marker to map
      const marker = L.marker([place.lat, place.lng]).addTo(map);
      marker.bindPopup(`<b>${place.name}</b><br>${place.description}`);

      // Create a card element
      const card = document.createElement('div');
      card.className = 'place-card';
      card.innerHTML = `
        <h3>${place.name}</h3>
        <p>${place.description}</p>
      `;

      // Optional: zoom to marker on click
      card.onclick = () => {
        map.setView([place.lat, place.lng], 15);
        marker.openPopup();
      };

      // Add card to the sidebar/container
      placesDiv.appendChild(card);
    });
  })
  .catch(error => {
    console.error('Failed to load places.json', error);
  });
