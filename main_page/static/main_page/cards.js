async function load_initiatives() {
    const initiatives_api_url = "/api/initiatives/";
    const response = await fetch(initiatives_api_url);
    const response_array = await response.json();  // Returns an array of objects, so we don't need to use JSON.parse
    return response_array;
}

async function render_initiatives() {
    const cards_response_array = await load_initiatives();
    console.log(cards_response_array);
    const cards_div_elem = document.getElementById("cards");
    cards_div_elem.innerHTML += "<ul>";
    for (let card_object of cards_response_array) {
        console.log(card_object);
        cards_div_elem.innerHTML += `<li>${card_object.name}</li>`;
    }
    cards_div_elem.innerHTML += "</ul>";
}

// map.on("moveend", render_locations);

render_initiatives();
