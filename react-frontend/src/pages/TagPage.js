import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";

function renderInitiatives(tag) {
    console.log("renderTags")
    if (Object.hasOwn(tag, 'initiatives') && typeof tag.initiatives != 'undefined') {
        console.log(tag.initiatives)
        // const tag_href_str=`${process.env.REACT_APP_BACKEND_URL}/tags/${tagElement.id}`;
        return tag.initiatives.map(
            (initiativeElement) => (
                <li key={initiativeElement.id}>
                    <a href={`/details/${initiativeElement.id}`}>{initiativeElement.initiative_title_texts[0].text}</a>
                </li>
            )
        );
    }
}

const TagPage = () => {
    const {tagId} = useParams();

    const tag_api_url = `${process.env.REACT_APP_BACKEND_URL}/tags/` + tagId;
    const [tag, setTag] = useState({});

    useEffect(() => {
        fetch(tag_api_url)
            .then(response => response.json())
            .then(response_json => {
                console.log("response_json:");
                console.log(response_json);
                setTag(response_json);
            });
    }, []);

    return (
        <div>
            <h2>Tag page</h2>
            <h3>ID: {tagId}</h3>
            <h3>Title: {tag.title}</h3>
            <ul>
                {renderInitiatives(tag)}
            </ul>
        </div>
    );
};

export default TagPage;
