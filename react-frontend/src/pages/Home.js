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
            search_string: "",
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
        this.loadInitiativeList();
        this.loadRegions();

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
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.activeRegionSlug != this.state.activeRegionSlug) {
            this.refreshRegion();
        }
        if (prevState.regionList != this.state.regionList) {
            this.refreshRegion();
        }
        if (prevState.search_string != this.state.search_string || prevState.initiativeList != this.state.initiativeList) {
            this.refreshCards();
        }
    }

    refreshCards() {
        const search_string = this.state.search_string;
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

    handleSearchChange(event) {
        this.setState({search_string: event.target.value});
    }

    refreshRegion() {
        console.log("refreshActiveRegion");
        const region_slug = this.state.activeRegionSlug;
        const region = this.state.regionList.filter(r => r['slug']===region_slug);
        if (region.length == 0) {
            return;
        }
        this.setState({
            activeRegion: region[0],
        });
    }

    loadRegions() {
        console.log("refreshRegionList");
        const region_api_url = "/api/regions/";
        fetch(region_api_url)
            .then(r => r.json())
            .then(regions => 
                this.setState({
                    regionList: regions,
                })
            )
            .catch(err => console.error(err));
    }

    loadInitiativeList() {
        console.log("refreshInitiativeList");
        const initiatives_api_url = "/api/initiatives/";
        fetch(initiatives_api_url)
            .then(r => r.json())
            .then(initiatives => 
                this.setState({
                    initiativeList: initiatives,
                })
            )
            .catch(err => console.error(err));
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
