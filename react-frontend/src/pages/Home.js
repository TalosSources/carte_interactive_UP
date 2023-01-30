import React from "react";
import '../App.css';
import {useNavigate} from "react-router-dom";
// useNavigate: Previously useHistory

function SkCard(props) {
    // CSS in React: https://www.w3schools.com/react/react_css.asp
    return (
        <div style={{backgroundColor: "lightgreen"}}>
            <a href={'details/' + props.id}>{props.title}</a>
        </div>
    );
}

function SelectRegion(props) {
    // Inspiration: https://reactjs.org/docs/forms.html#the-select-tag
    return (
        <select value={props.value} onChange={props.handleSelectChange}>
            {
                props.regionList.map(
                    (regionElement) => (
                        //<option key={regionElement.id} value={regionElement.slug}>
                        <option key={regionElement.id} value={regionElement.id}>
                            {regionElement.slug}
                        </option>
                    )
                )
            }
        </select>
    );
}

class HomeCmp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            initiativeList: [],
            regionList: [],
        };
        console.log("Home.constructor");

        // We have to bind to avoid this error:
        // "TypeError: Cannot read properties of undefined (reading 'setState')"
        // More info here: https://stackoverflow.com/a/39176279/2525237
        this.handleSelectChange = this.handleSelectChange.bind(this);
    }

    componentDidMount() {
        console.log("componentDidMount");
        this.refreshInitiativeList();
        this.refreshRegionList();

        // The id "map" has to be available before we can load the map script. Therefore we load this script here
        const mapScript = document.createElement("script");
        mapScript.src = "map.js";
        mapScript.async = true;
        document.body.appendChild(mapScript);
    }

    handleSelectChange(event) {
        console.log(`handleSelectChange - event.target.value=${event.target.value}`);
        this.props.navigate('/r/'+event.target.value);
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
            (initiativeElement) => {
                let title = initiativeElement
                            .initiative_title_texts[0]['text'];
                return (
                <div key={initiativeElement.id}>
                    <SkCard
                        title={title}
                        url={initiativeElement.url}
                        id={initiativeElement.id}
                    />
                </div>
            )
        });
    }
    
    render() {
        console.log("render");
        return (
            <div className="Home">
                <h1>Smartakartan (React frontend) --- update</h1>
                <h2>Region</h2>
                <h3>Select</h3>
                <SelectRegion
                    handleSelectChange={this.handleSelectChange}
                    value={this.state.activeRegionId}
                    regionList={this.state.regionList}
                />
                <h3>Welcome message</h3>
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

export default function Home() {
    const navigation = useNavigate() // extract navigation prop here 

    return <HomeCmp navigate={navigation} />
};
