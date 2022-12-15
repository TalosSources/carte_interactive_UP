import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";

const Details = () => {
    const {initiativeId} = useParams();

    const initiative_api_url = "http://127.0.0.1:8000/api/initiatives/" + initiativeId;
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

export default Details;
