import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import { Tag } from "../types/Initiative"; 


function renderTags(tags : Tag[]) {
    console.log("renderTags")
    if (typeof tags != 'undefined') {
        console.log(tags)
        return tags.map(
            (tagElement) => (
                <li key={tagElement.id}>
                    <a href={`/tag/${tagElement.id}`}>{tagElement.title}</a>
                </li>
            )
        );
    }
}


const Sitemap = () => {
    const tag_api_url = `${process.env.REACT_APP_BACKEND_URL}/tags/`;
    const [tags, setTags] = useState([]);

    useEffect(() => {
        fetch(tag_api_url)
            .then(response => response.json())
            .then(response_json => {
                console.log("response_json:");
                console.log(response_json);
                setTags(response_json);
            });
    }, []);

    return (
        <div>
            <h2>Sitemap</h2>
            <h3>All tags</h3>
            <ul>
                {renderTags(tags)}
            </ul>
        </div>
    );
};

export default Sitemap;
