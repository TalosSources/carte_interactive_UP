import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import {renderCardCollection} from "../Cards";
import { fetchInitiatives, fetchTags, Initiative, matchTagsWithInitiatives, Tag } from "../KesApi";
import { useTranslation } from "react-i18next";
import '../i18n';
import { registerInitiativeTranslations } from "../i18n";

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
    const {initiativeSlug} = useParams();

    const initiative_api_url = `${process.env.REACT_APP_BACKEND_URL}/initiatives?slug=` + initiativeSlug;
    const [initiative, setInitiative] = useState<Initiative>({tags: [],
        id:0,
        initiative_images: [],
        slug:"",
        locations:{features:[]},
        main_image_url: "",
        initiative_translations: [],
    });
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

    useEffect(() => {
        fetch(initiative_api_url)
            .then(response => response.json())
            .then(response_json => {
                setInitiative(response_json[0]);
            })
            .catch(err => console.error(err));
    }, []);
    useEffect(() => {
        fetchInitiatives()
            .then(initiatives => {
                setInitiatives(initiatives);
                for (const i of initiatives) {
                    registerInitiativeTranslations(i);
                }
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

    const {t}=useTranslation();
    return (
        <div>
            <h2>{t('initiatives.'+initiative.slug+'.title')}</h2>
            <a href={'/admin/website/initiative/'+initiative.id+'/change/'}>Edit</a><br/>
            <img src={initiative.main_image_url}/>
            <p dangerouslySetInnerHTML={{__html: "Description: " + t('initiatives.'+initiative.slug+'.description')}}></p>
            {renderTags(initiative, taggedInitiativMatching)}
            <h3>You may also like</h3>
            <div id="similarInitiativesCanvas">
                {renderedCards}
            </div>

        </div>
    );
}
