import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import {renderCardCollection} from "../Cards";
import { fetchInitiatives, fetchTags, getDescriptionWithFallback, getTitleWithFallback, Initiative, matchTagsWithInitiatives, Tag } from "../KesApi";

function renderTags(initiative : Initiative, tagsByInitiatives : Map<string, Tag[]>) {
    return <div id="tagPanel">
    {
        tagsByInitiatives.get(initiative.slug)?.map((tagElement) => (
            <a href={`/?t=${tagElement.slug}`}>
            <div className="proposedTag">
                <div dangerouslySetInnerHTML={{__html: tagElement.title}}></div>
            </div></a>
        ))
    }</div>
}

export default function Details() {
    const {initiativeId} = useParams();

    const initiative_api_url = `${process.env.REACT_APP_BACKEND_URL}/initiatives/` + initiativeId;
    const [initiative, setInitiative] = useState<Initiative>({tags: [],
        id:0,
        initiative_images: [],
        slug:"",
        locations:{features:[]},
        main_image_url: "",
        initiative_translations: {},
    });
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

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
        fetchInitiatives()
            .then(initiatives => {
                setInitiatives(initiatives);
            })
            .catch(err => console.error(err));
        // fetch tags
        fetchTags()
        .then(response_json => {
            console.log("tags", response_json);
            const tags = response_json.map((tag: Tag) => {
                tag.title = tag.title.replace("&amp;", "&")
                return tag
            }) 
            setTags(tags);
            // remove invalid strings in activeTags
        });
    }, []);

    const similarInitiatives = initiatives
    .map(function(initiativeB) : [number, Initiative] { 
        return [
            initiative.tags.filter(tagA => initiativeB.tags.some(tagB => tagA === tagB)).length,
            initiativeB
        ]
    })
    .filter(([c,i]) => c>0)
    .sort(([ca,ia], [cb, ib]) => cb - ca)
    .slice(1,6)
    .map(([c,i]) => i);
    const taggedInitiativMatching = matchTagsWithInitiatives(initiatives, tags)
    const renderedCards = renderCardCollection(similarInitiatives, taggedInitiativMatching, ()=>null, undefined);

    return (
        <div>
            <h2>Details page for Initiative</h2>
            <h3>{getTitleWithFallback(initiative, 'en')}</h3>
            <img src={initiative.main_image_url}/>
            <p dangerouslySetInnerHTML={{__html: "Description: " + getDescriptionWithFallback(initiative, 'en')}}></p>
            {renderTags(initiative, taggedInitiativMatching)}
            <h3>You may also like</h3>
            <div id="similarInitiativesCanvas">
                {renderedCards}
            </div>

        </div>
    );
}
