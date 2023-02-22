import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import {renderCardCollection} from "../Cards";

function renderTags(initiative) {
    return <div id="tagPanel">
    {
        initiative.tags.map((tagElement) => (
            <a href={`/?s=${tagElement.title}`}>
            <div class="proposedTag">
                <div dangerouslySetInnerHTML={{__html: tagElement.title}}></div>
            </div></a>
        ))
    }</div>
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
    const [initiative, setInitiative] = useState({tags: []});
    const [initiatives, setInitiatives] = useState([]);

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
    useEffect(() => {
        const initiatives_api_url = `${process.env.REACT_APP_BACKEND_URL}/initiatives/`;
        fetch(initiatives_api_url)
            .then(response => response.json())
            .then(initiatives => {
                setInitiatives(initiatives);
            })
            .catch(err => console.error(err));
    }, []);

    const similarInitiatives = initiatives
    .map(initiativeB => 
        [
            initiative.tags.filter(tagA => initiativeB.tags.some(tagB => tagA.id === tagB.id)).length,
            initiativeB
        ]
    )
    .filter(([c,i]) => c>0)
    .sort(([ca,ia], [cb, ib]) => cb - ca)
    .slice(1,6)
    .map(([c,i]) => i);
    const renderedCards = renderCardCollection(similarInitiatives);

    return (
        <div>
            <h2>Details page for Initiative</h2>
            <h3>{getTitle(initiative)}</h3>
            <img src={initiative.main_image_url}/>
            <p dangerouslySetInnerHTML={{__html: "Description: " + getDescription(initiative)}}></p>
            {renderTags(initiative)}
            <h3>You may also like</h3>
            <div id="similarInitiativesCanvas">
                {renderedCards}
            </div>

        </div>
    );
};

export default Details;
