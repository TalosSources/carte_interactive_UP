import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import {renderCardCollection} from "../Cards";
import { Initiative } from "../types/Initiative"; 

function renderTags(initiative : Initiative) {
    return <div id="tagPanel">
    {
        initiative.tags.map((tagElement) => (
            <a href={`/?t=${tagElement.slug}`}>
            <div className="proposedTag">
                <div dangerouslySetInnerHTML={{__html: tagElement.title}}></div>
            </div></a>
        ))
    }</div>
}


function getTitle(initiative : Initiative) {
    console.log("getTitle")
    if (initiative.initiative_title_texts.length > 0) {
        console.log(initiative.initiative_title_texts)
        return initiative.initiative_title_texts[0].text
    }
}


function getDescription(initiative : Initiative) {
    console.log("getDescription")
    if (initiative.initiative_description_texts.length >0) {
        console.log(initiative.initiative_description_texts)
        return initiative.initiative_description_texts[0].text
    }
}


export default function Details() {
    const {initiativeId} = useParams();

    const initiative_api_url = `${process.env.REACT_APP_BACKEND_URL}/initiatives/` + initiativeId;
    const [initiative, setInitiative] = useState<Initiative>({tags: [], locations:{features:[]},id:0, main_image_url: "",initiative_title_texts: [ ],initiative_description_texts: [ ],});
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);

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
    .map(function(initiativeB) : [number, Initiative] { 
        return [
            initiative.tags.filter(tagA => initiativeB.tags.some(tagB => tagA.id === tagB.id)).length,
            initiativeB
        ]
    })
    .filter(([c,i]) => c>0)
    .sort(([ca,ia], [cb, ib]) => cb - ca)
    .slice(1,6)
    .map(([c,i]) => i);
    const renderedCards = renderCardCollection(similarInitiatives, ()=>null, undefined);

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
}
