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

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            cardList: [],
        };
    }

    // Overridden (see details in documentation)
    componentDidMount() {
        this.refreshCardList();

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
                title={cardElement.name}
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
        return this.state.cardList.map(
            (element) => (
                <div key={element.id}>{this.renderCard(element)}</div>
            )
        );
    }

    refreshCardList() {
        const initiatives_api_url = "http://127.0.0.1:8009/api/initiatives/";
        fetch(initiatives_api_url)
            .then(response => response.json())
            .then(response_array => {
                console.log(`response_array: ${response_array}`);
                this.setState({
                    cardList: response_array,
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
            <div className="App">
                <h2>Smarta Kartan</h2>
                <h3>Map</h3>
                <div id="map"></div>
                <h3>Cards</h3>
                <ul>
                    {this.renderCardCollection()}
                </ul>

            </div>

        );
    }
}

export default App;
