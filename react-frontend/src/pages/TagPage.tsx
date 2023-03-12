import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import {renderCardCollection} from "../Cards";
import { Initiative } from "./Home";

const TagPage = () => {
    const {tagId} = useParams();

    const tag_api_url = `${process.env.REACT_APP_BACKEND_URL}/tags/` + tagId;
    const [tag, setTag] = useState({title:"",'initiatives':[]});
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);

    useEffect(() => {
        fetch(tag_api_url)
            .then(response => response.json())
            .then(response_json => {
                console.log("response_json:");
                console.log(response_json);
                setTag(response_json);
            });
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

    const taggedInitiatives = initiatives
                              .filter(initiative =>
                                initiative.tags.some(tag =>
                                    Number(tag.id) === Number(tagId)
                                )
                              );
    return (
        <div>
            <h2>Tag page</h2>
            <h3>ID: {tagId}</h3>
            <h3>Title: {tag.title}</h3>
            {renderCardCollection(taggedInitiatives)}
        </div>
    );
};

export default TagPage;
