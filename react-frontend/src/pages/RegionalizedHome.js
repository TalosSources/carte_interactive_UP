import React from "react";
import {useNavigate, useParams} from "react-router-dom";
import '../App.css';
// import {useNavigate} from "react-router-dom";
// useNavigate: Previously useHistory

function SkCard(props) {
    // CSS in React: https://www.w3schools.com/react/react_css.asp
    return (
        <div style={{backgroundColor: "lightgreen"}}>
            <a href={'details/' + props.id}>{props.title}</a>
        </div>
    );
}

class RHomeCmp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            initiativeList: [],
            regionList: [],
            activeRegionId: this.props.rid,
            activeRegion: {
                welcome_message_html: ""
            },
        };
        console.log(this.props);
        console.log("Home.constructor");

        // We have to bind to avoid this error:
        // "TypeError: Cannot read properties of undefined (reading 'setState')"
        // More info here: https://stackoverflow.com/a/39176279/2525237
    }

    componentDidMount() {
        console.log("componentDidMount");
        this.refreshInitiativeList();
        this.refreshRegionList();
        this.refreshActiveRegion();

        // The id "map" has to be available before we can load the map script. Therefore we load this script here
        const mapScript = document.createElement("script");
        mapScript.src = "map.js";
        mapScript.async = true;
        document.body.appendChild(mapScript);
    }

    componentDidUpdate(prevProps) {
        console.log("componentDidUpdate");
        if (Number(this.state.activeRegionId) !== Number(this.state.activeRegion.id)) {
            console.log("componentDidUpdate: New ID, refreshing active region");
            console.log(`this.state.activeRegionId=${this.state.activeRegionId} --- type: ${typeof this.state.activeRegionId}`);
            console.log(`this.state.activeRegion.id=${this.state.activeRegion.id} --- type: ${typeof this.state.activeRegion.id}`);
            this.refreshActiveRegion();
        }
    }

    refreshActiveRegion() {
        console.log("refreshActiveRegion");
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
        console.log("refreshRegionList");
        const region_api_url = "/api/regions/";
        fetch(region_api_url)
            .then(response => response.json())
            .then(response_array => {
                // console.log(`response_array: ${response_array}`);
                this.setState({
                    regionList: response_array,
                });
            })
            .catch(err => console.error(err));
    }

    refreshInitiativeList() {
        console.log("refreshInitiativeList");
        const initiatives_api_url = "/api/initiatives/";
        fetch(initiatives_api_url)
            .then(response => response.json())
            .then(response_array => {
                // console.log(`response_array: ${response_array}`);
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

    renderCardCollection() {
        console.log("renderCardCollection");
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
    
    render() {
        console.log("render");
        return (
            <div className="Home">
                <h1>Smartakartan (React frontend)</h1>
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

export default function RHome() {
    const navigation = useNavigate() // extract navigation prop here 
    const {regionId} = useParams();

    return <RHomeCmp rid={regionId} navigate={navigation} />
};
