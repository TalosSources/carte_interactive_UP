import React from "react";
import '../App.css';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';

const mockData = {

    name: "Test",
    position: [51.506, -0.10],
    description: "This is a test thing",
    image: "https://picsum.photos/id/237/200/300"

}

function SkCard(props) {
    // This is a React "function component"
    // CSS in React: https://www.w3schools.com/react/react_css.asp
    return (
        <div style={{ backgroundColor: "lightgreen" }}>
            <a href={'details/' + props.id}>{props.title}</a>
        </div>
    );
}


class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            initiativeList: [],
        };
    }

    // Overridden (see details in documentation)
    componentDidMount() {
        this.refreshInitiativeList();

        // The id "map" has to be available before we can load the map script. Therefore we load this script here
        const mapScript = document.createElement("script");
        mapScript.src = "map.js";
        mapScript.async = true;
        document.body.appendChild(mapScript);
    }

    renderCard(cardElement) {
        // console.log(`cardElement: ${cardElement}`);
        console.log("cardElement:");
        console.log(cardElement);
        return (
            <SkCard
                title={cardElement.title}
                url={cardElement.url}
                id={cardElement.id}
            />
        );
    }

    renderCardCollection() {
        // let retReactNode;
        // this.state.cardList.forEach(element => {
        //     retReactNode.append();
        // });
        // console.log(retReactNode);
        return this.state.initiativeList.map(
            (initiativeElement) => (
                <div key={initiativeElement.id}>{this.renderCard(initiativeElement)}</div>
            )
        );
    }

    refreshInitiativeList() {
        const initiatives_api_url = "http://127.0.0.1:8000/api/initiatives/";
        fetch(initiatives_api_url)
            .then(response => response.json())
            .then(response_array => {
                console.log(`response_array: ${response_array}`);
                this.setState({
                    initiativeList: response_array,
                });
            })
            .catch(err => console.error(err));

        // console.log(response);
        // const response_array = response.json();
        // console.log(response_array);
        // return response_array;
    }

    render() {
        return (
            <div className="Home">
                <h2>Smarta Kartan</h2>
                <h3>Map</h3>

                <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false} style={{ "height": "40vh", "width": "100vw" }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[51.505, -0.09]}>
                        <Popup>
                            <img src={mockData.image} />
                            <p>{mockData.description}
                            </p>

                        </Popup>
                    </Marker>
                </MapContainer>
                <h3>Cards</h3>
                <ul>
                    {this.renderCardCollection()}
                </ul>

            </div>

        );
    }
}

export default Home;
