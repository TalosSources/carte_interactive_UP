import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import {renderCardCollection} from "../Cards";
import { fetchInitiatives, fetchTags, Initiative, matchTagsWithInitiatives, Tag } from "../KesApi";

const TagPage = () => {
    const {tagId: tagSlug} = useParams();

    const [tags, setTags] = useState<Tag[]>([]);
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);

    useEffect(() => {
        fetchTags()
            .then(response_json => {
                setTags(response_json);
            });
    }, []);
    useEffect(() => {
        fetchInitiatives()
            .then(initiatives => {
                setInitiatives(initiatives);
            })
            .catch(err => console.error(err));
    }, []);

    const taggedInitiatives = initiatives
                              .filter(initiative =>
                                initiative.tags.some(tag =>
                                    Number(tag) === Number(tagSlug)
                                )
                              );
    const tagsByInitiatives = matchTagsWithInitiatives(initiatives, tags);
    let tag = undefined;
    for (const t of tags) {
        if (t.slug === tagSlug) {
            tag = t;
            break;
        }
    }
    return (
        <div>
            <h2>Tag page</h2>
            <h3>ID: {tagSlug}</h3>
            <h3>Title: {tag?.title}</h3>
            {renderCardCollection(taggedInitiatives, tagsByInitiatives, ()=>null, undefined)}
        </div>
    );
};

export default TagPage;
