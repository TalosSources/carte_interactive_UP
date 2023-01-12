import React from "react";
import '../App.css';

function SkCard(props) {
    // This is a React "function component"
    // CSS in React: https://www.w3schools.com/react/react_css.asp
    return (
        <div style={{backgroundColor: "lightgreen"}}>
            <a href={'details/' + props.id}>{props.title}</a>
        </div>
    );
}

class Home extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            initiativeList: [],
            regionList: [],
            activeRegionId: 28,
            activeRegion: {},
        };
    }

    // Overridden (see details in documentation)
    componentDidMount() {
        this.refreshInitiativeList();
        this.refreshRegionList();
        this.refreshActiveRegion();

        // The id "map" has to be available before we can load the map script. Therefore we load this script here
        const mapScript = document.createElement("script");
        mapScript.src = "map.js";
        mapScript.async = true;
        document.body.appendChild(mapScript);
    }

    renderCardCollection() {
        return this.state.initiativeList.map(
            (initiativeElement) => (
                <div key={initiativeElement.id}>
                    <SkCard
                    title={initiativeElement.title}
                    url={initiativeElement.url}
                    id={initiativeElement.id}
                    />
                </div>
            )
        );
    }

    renderRegions() {
        // let retReactNode;
        // this.state.cardList.forEach(element => {
        //     retReactNode.append();
        // });
        // console.log(retReactNode);
        return this.state.regionList.map(
            (regionElement) => (
                <div key={regionElement.id}>
                    <p>{regionElement.slug}</p>
                </div>
            )
        );
    }

    refreshActiveRegion() {
        const active_region_api_url = "/api/regions/" + this.state.activeRegionId;
        fetch(active_region_api_url)
            .then(response => response.json())
            .then(response_obj => {
                console.log(`response_obj: ${response_obj}`);
                this.setState({
                    activeRegion: response_obj,
                });
            })
            .catch(err => console.error(err));
    }

    refreshRegionList() {
        const region_api_url = "/api/regions/";
        fetch(region_api_url)
            .then(response => response.json())
            .then(response_array => {
                console.log(`response_array: ${response_array}`);
                this.setState({
                    regionList: response_array,
                });
            })
            .catch(err => console.error(err));
    }

    refreshInitiativeList() {
        const initiatives_api_url = "/api/initiatives/";
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
                <h1>Smartakartan (React frontend)</h1>
                <h2>Region</h2>
                <h3>Select</h3>
                <ul>
                    {this.renderRegions()}
                </ul>
                <h3>Welcome message</h3>
                <div>{this.state.activeRegion.welcome_message_html}</div>
                <h2>Map</h2>
                <div id="map"></div>
                <h2>Cards</h2>
                <ul>
                    {this.renderCardCollection()}
                </ul>
            </div>
        );
    }
}

export default Home;
