import React from "react";
import {useNavigate, useParams} from "react-router-dom";
import '../App.css';
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
    console.log(props.value);
    return (
        <select value={props.value} onChange={props.handleSelectChange}>
            {
                props.regionList.map(
                    (regionElement) => (
                        //<option key={regionElement.id} value={regionElement.id}>
                        <option key={regionElement.id} value={regionElement.slug}>
                            {regionElement.title}
                        </option>
                    )
                )
            }
        </select>
    );
}

class RHomeCmp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            initiativeList: [],
            regionList: [],
            activeRegionSlug: this.props.rslug,
            activeRegion: {
                welcome_message_html: ""
            },
        };
        console.log(this.props);
        console.log("Home.constructor");

        // We have to bind to avoid this error:
        // "TypeError: Cannot read properties of undefined (reading 'setState')"
        // More info here: https://stackoverflow.com/a/39176279/2525237
        this.handleSelectChange = this.handleSelectChange.bind(this);
        this.handleSearchChange = this.handleSearchChange.bind(this);
    }

    componentDidMount() {
        console.log("componentDidMount");
        const initiativePromise = this.refreshInitiativeList();
        const regionPromise = this.refreshRegionList();

        regionPromise.then(regions => {
            this.setRegion(this.state.activeRegionSlug);
        });
        initiativePromise.then(initiatives => {
            this.setState({renderedCards : this.renderCardCollection(initiatives)});
        })

        // The id "map" has to be available before we can load the map script. Therefore we load this script here
        const mapScript = document.createElement("script");
        mapScript.src = "map.js";
        mapScript.async = true;
        document.body.appendChild(mapScript);
    }

    handleSelectChange(event) {
        console.log(`handleSelectChange - event.target.value=${event.target.value}`);
        const new_region_slug = event.target.value;
        this.props.navigate('/r/'+new_region_slug);
        this.setState({activeRegionSlug: new_region_slug});
        this.setRegion(new_region_slug);
    }

    componentDidUpdate(prevProps) {
    }

    handleSearchChange(event) {
        const search_string = event.target.value;
        const keywords=search_string.split(' ');
        function filter_initiative(initiative) {
            return keywords
            .map(keyword => keyword.toLowerCase())
            .every(keyword =>
                initiative.initiative_title_texts.some(itt => 
                        itt['text'].toLowerCase().includes(keyword)
                ) ||
                initiative.initiative_description_texts.some(idt => 
                        idt['text'].toLowerCase().includes(keyword)
                )
            )
        };
        let selected_initiatives = this.state.initiativeList.filter(filter_initiative);
        this.setState({renderedCards : this.renderCardCollection(selected_initiatives)});
    }

    setRegion(region_slug) {
        console.log("refreshActiveRegion");
        const region = this.state.regionList.filter(r => r['slug']===region_slug);
        this.setState({
            activeRegion: region[0],
        });
    }

    async refreshRegionList() {
        console.log("refreshRegionList");
        const region_api_url = "/api/regions/";
        try {
            const response = await fetch(region_api_url);
            const response_array = await response.json();
            // console.log(`response_array: ${response_array}`);
            this.setState({
                regionList: response_array,
            });
            return response_array;
        } catch (err) {
            return console.error(err);
        }
    }

    async refreshInitiativeList() {
        console.log("refreshInitiativeList");
        const initiatives_api_url = "/api/initiatives/";
        try {
            const response = await fetch(initiatives_api_url);
            const response_array = await response.json();
            this.setState({
                initiativeList: response_array,
            });
            return response_array;
        } catch (err) {
            return console.error(err);
        }
    }

    renderCardCollection(initiatives) {
        console.log("renderCardCollection");
        return initiatives.map(
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
                <h1>Smartakartan</h1>
		<SelectRegion
                    handleSelectChange={this.handleSelectChange}
                    value={this.state.activeRegionSlug}
                    regionList={this.state.regionList}
                />
                <div dangerouslySetInnerHTML={{__html: this.state.activeRegion.welcome_message_html}}></div>
                <div id="map"></div>
                Filter: <input name="search" onChange={this.handleSearchChange}/>
                <ul>
                    {this.state.renderedCards}
                </ul>
            </div>
        );
    }
}

export default function Home() {
    const navigation = useNavigate() // extract navigation prop here 
    let {regionSlug} = useParams();
    if (typeof regionSlug == 'undefined') {
        regionSlug = 'global';
    }
    console.log(regionSlug);

    return <RHomeCmp rslug={regionSlug} navigate={navigation} />
};
