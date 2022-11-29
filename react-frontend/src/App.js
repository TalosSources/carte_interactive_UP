import React from 'react';
import './App.css';


function SkCard(props) {
    // This is a React function component
    // React CSS: https://www.w3schools.com/react/react_css.asp
    return (
        <div style={{backgroundColor: "lightgreen"}}>
            <p>{props.title} --- title here</p>
        </div>
    );
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            maxNrToShowUnused: 5,
            cardList: [],
        };
    }

    componentDidMount() {
        // Overridden (see details in documentation)
        this.refreshCardList();
    }

    renderCard(cardElement) {
        console.log(cardElement);
        return (
            <SkCard
                title={cardElement.name}
            />
        );
    }

    renderCardCollection() {
        // let retReactNode;
        // this.state.cardList.forEach(element => {
        //     retReactNode.append();
        // });
        // console.log(retReactNode);
        return this.state.cardList.map((element) => (
            <div key={element.id}>{this.renderCard(element)}</div>
        ));
    }

    refreshCardList() {
        const initiatives_api_url = "http://127.0.0.1:8009/api/initiatives/";
        fetch(initiatives_api_url)
            .then(response => response.json())
            .then(response_array => {
                console.log(response_array);
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
                <h3>Cards</h3>
                <ul>
                    {this.renderCardCollection()}
                </ul>
            </div>
        );
    }
}

export default App;
