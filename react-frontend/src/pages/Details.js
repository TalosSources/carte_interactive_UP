import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";

const Details = () => {
    const {initiativeId} = useParams();

    const initiative_api_url = "/api/initiatives/" + initiativeId;
    const [initiative, setInitiative] = useState({});

    useEffect(() => {
        fetch(initiative_api_url)
            .then(response => response.json())
            .then(response_json => {
                console.log("response_json:");
                console.log(response_json);
                setInitiative(response_json);
            });
    }, []);

    return (
        <div>
            <h2>Details page for Initiative</h2>
            <h3>ID: {initiativeId}</h3>
            <h3>Name: {initiative.name}</h3>
            <p>Description: {initiative.description}</p>
        </div>
    );
};


/*
            .then(setInitiative);

            .then(response_json => {
                console.log("response_json:");
                console.log(response_json);
                setInitiative(response_json);
            });

    const fetchData = () => {

    };


            .catch(err => console.error(err));


const fetchData = async () => {
    const response = await fetch(initiative_api_url);
    const json_data = await response.json();
    setInitiative(json_data);
    console.log("json_data:");
    console.log(json_data);
};

const initiative_api_url = "http://127.0.0.1:8000/api/initiatives/" + initiativeId;
fetch(initiative_api_url)
    .then(response => response.json())
    .then(response_json => {
        console.log("response_json:");
        console.log(response_json);
        return <h2>Details page, initiative ID: {initiativeId}, initiative name: {response_json.name}</h2>;
    })
    .catch(err => console.error(err));


let initiativeName;

    // https://www.robinwieruch.de/react-hooks-fetch-data/
const fetchData = async () => {
    const response = await fetch(initiative_api_url);
    const json_data = await response.json();
    console.log("json_data:");
    console.log(json_data);
};
useEffect(fetchData);

const initiative_api_url = "http://127.0.0.1:8000/api/initiatives/" + initiativeId;
const response = await fetch(initiative_api_url);
const json_data = await response.json();

let initiativeName;
fetch(initiative_api_url)
    .then(response => response.json())
    .then(response_json => {
        console.log("response_json:");
        console.log(response_json);
        initiativeName = response_json.name;
    })
    .catch(err => console.error(err));




export default class Details extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const {initiativeId} = useParams();


        return (
            <h2>Details page, initiative ID: {initiativeId}</h2>
        );
    }
}

*/


export default Details;
