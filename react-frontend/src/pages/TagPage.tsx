import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import {renderCardCollection} from "../Cards";
import { fetchTags, Tag, useInitiatives } from "../KesApi";

const TagPage = () => {
    const {tagId: tagSlug} = useParams();

    const [tags, setTags] = useState<Tag[]>([]);
    const initiatives = useInitiatives();

    useEffect(() => {
        fetchTags()
            .then(response_json => {
                setTags(response_json);
            });
    }, []);

    const taggedInitiatives = initiatives
                              .filter(initiative =>
                                initiative.tags.some(tag =>
                                    Number(tag) === Number(tagSlug)
                                )
                              );
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
            {renderCardCollection(taggedInitiatives)}
        </div>
    );
};

export default TagPage;
