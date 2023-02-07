import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";

function renderTags(initiative) {
    console.log("renderTags")
    if (Object.hasOwn(initiative, 'tags') && typeof initiative.tags != 'undefined') {
        console.log(initiative.tags)
        // const tag_href_str=`${process.env.REACT_APP_BACKEND_URL}/tags/${tagElement.id}`;
        return initiative.tags.map(
            (tagElement) => (
                <li key={tagElement.id}>
                    <a href={`/tag/${tagElement.id}`}>{tagElement.title}</a>
                </li>
            )
        );
    }
}


function getTitle(initiative) {
    console.log("getTitle")
    if (typeof initiative.initiative_title_texts != 'undefined') {
        console.log(initiative.initiative_title_texts)
        return initiative.initiative_title_texts[0].text
    }
}


function getDescription(initiative) {
    console.log("getDescription")
    if (typeof initiative.initiative_description_texts != 'undefined') {
        console.log(initiative.initiative_description_texts)
        return initiative.initiative_description_texts[0].text
    }
}


function Details() {
    const {initiativeId} = useParams();

    const initiative_api_url = `${process.env.REACT_APP_BACKEND_URL}/initiatives/` + initiativeId;
    const [initiative, setInitiative] = useState({});

    useEffect(() => {
        fetch(initiative_api_url)
            .then(response => response.json())
            .then(response_json => {
                console.log("response_json:");
                console.log(response_json);
                setInitiative(response_json);
            })
            .catch(err => console.error(err));
    }, []);

    console.log("initiative:")
    console.log(initiative)
    return (
        <div>
            <h2>Details page for Initiative</h2>
            <h3>ID: {initiativeId}</h3>
            <h3>Title: {getTitle(initiative)}</h3>
            <p dangerouslySetInnerHTML={{__html: "Description: " + getDescription(initiative)}}></p>
            <h3>Tags:</h3>
            <ul>
                {renderTags(initiative)}
            </ul>
        </div>
    );
};

export default Details;
