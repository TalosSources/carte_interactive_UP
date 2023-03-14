import React from "react";
import { Initiative, Tag } from "./pages/Home";

function SkCard(props: { id: number; image_url: string; title: string; description: string; tags: Tag[], tagClick: ((clickedSlug: string) => void)}) {
    // CSS in React: https://www.w3schools.com/react/react_css.asp
    return (
        <div>
        <a href={'/details/' + props.id}>
            <img className="card-image" src={props.image_url}/>
            <div className="card-text">
                <div className="card-title" dangerouslySetInnerHTML={{__html: props.title}}></div>
                <div className="card-description" dangerouslySetInnerHTML={{__html: props.description}}></div>
            </div>
        </a>
        <div className="cardTagPanel">
        {
            props.tags.map((tagElement) => (
                <div className="proposedTag" onClick={() => props.tagClick(tagElement.slug)}>
                    <div dangerouslySetInnerHTML={{__html: tagElement.title}}></div>
                </div>
            ))
        }</div></div>
    );
}

function sortTagsByValue(tags : Tag[], values:{ [x: string]: number; }) {
    function sortTagsByValue(tag_a: Tag, tag_b: Tag) {
        return values[tag_b.id] - values[tag_a.id]
    }
    tags.sort(sortTagsByValue);
    return tags

}

export function renderCardCollection(initiatives: Initiative[], tagClick: ((clickedSlug: string) => void), tagSorting: { [x: string]: number; } | undefined) {
    return <div className="cards">
            {initiatives.map(
              (initiativeElement) => {
                const title = initiativeElement
                    .initiative_title_texts[0]['text'];
                const description = initiativeElement
                    .initiative_description_texts[0]['text'];
                const top_tags = initiativeElement.tags
                if (!(typeof tagSorting == "undefined")) {
                    sortTagsByValue(top_tags, tagSorting)
                }
                console.log(top_tags);
                return (
                    <div className="card" key={initiativeElement.id}>
                        <SkCard
                            title={title}
                            id={initiativeElement.id}
                            description={description}
                            image_url={initiativeElement.main_image_url}
                            tags={top_tags}
                            tagClick={tagClick}
                        />
                    </div>
                );
              }
             )
    }</div>;
}