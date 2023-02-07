import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";

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
                <li>test</li>
            </ul>
        </div>
    );
};

export default TagPage;
