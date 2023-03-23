import React from 'react';
import styled from "styled-components";
import sanitizeHtml from "sanitize-html";
import { Initiative, Tag } from "./pages/Home";

const CardContainer = styled.div`
    display: flex;
    flex-direction: row;
    max-width: 100%;
    max-height: 100%;
    flex-wrap: wrap;
    overflow: scroll; 

`;

const Card = styled.div`
    position: relative;
    display: flex;
    flex-direction: column
    height: fit-content;
    width: 30%;
    min-width: 200px;
    max-width: 300px;
    max-height: 30rem;
    background-color: beige;
    margin: 0.5em;
    padding: 0.1em;
    border-radius: 0.3em;
    overflow: hidden;
    // -webkit-mask-image: linear-gradient(180deg, #000 70%, transparent);
    // -webkit-mask-repeat: no-repeat;
`;

const CardImage = styled.img`
    width: 100%;
`;

const CardTextContainer = styled.div`
    padding: 0.5em;
    // -webkit-mask-image: linear-gradient(180deg, #000 70%, transparent);
    // -webkit-mask-repeat: no-repeat;
    
    p {
        padding: 0pt;
        margin: 0pt;
    }
`;

const CardTitle = styled.h3`
    font-weight: bold;
    color: black;
    padding: 0.2em;
    font-size: medium;

`;

const CardDescription = styled.p`
    font-size: 0.8em;
    color: black;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;


const CardTagPanel = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    overflow-x: scroll;
    white-space: nowrap;
    height: 2.5em;
    font-size: small;
`;

function SkCard(props: {key?: number; id: number; image_url: string; title: string; description: string; tags: Tag[], tagClick: ((clickedSlug: string) => void)}) {
    // CSS in React: https://www.w3schools.com/react/react_css.asp
    const { id, image_url, title, description} = props
    
    const cleanDescription = sanitizeHtml(description, { allowedTags: []})
    return (
        <Card>
            <a href={'/details/' + id} 
            style={{paddingBottom: tags?.length ? "2rem" : "0"}}
            >
                <CardImage className="card-image" src={image_url}/>
                <CardTextContainer className="card-text">
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className="card-description">{cleanDescription}</CardDescription>
                </CardTextContainer>
            </a>
            <CardTagPanel className="cardTagPanel">
            {
                tags.map((tagElement) => (
                    <div 
                        key={tagElement.slug}
                        className="proposedTag" 
                        onClick={() => tagClick(tagElement.slug)
                        }>
                        
                        <div>{tagElement.title}</div>
                    </div>
                ))
            }</CardTagPanel>
        </Card>
    );
}

// export function renderCardCollection(initiatives, tagClick, tagSorting) {
//     return <CardContainer>
// =======
//         <div>
//         <a href={'/details/' + props.id}>
//             <img className="card-image" src={props.image_url}/>
//             <div className="card-text">
//                 <div className="card-title" dangerouslySetInnerHTML={{__html: props.title}}></div>
//                 <div className="card-description" dangerouslySetInnerHTML={{__html: props.description}}></div>
//             </div>
//         </a>
//         <div className="cardTagPanel">
//         {
//             props.tags.map((tagElement) => (
//                 <div className="proposedTag" onClick={() => props.tagClick(tagElement.slug)}>
//                     <div dangerouslySetInnerHTML={{__html: tagElement.title}}></div>
//                 </div>
//             ))
//         }</div></div>
//     );
// }

function sortTagsByValue(tags : Tag[], values:{ [x: string]: number; }) {
    function sortTagsByValue(tag_a: Tag, tag_b: Tag) {
        return values[tag_b.id] - values[tag_a.id]
    }
    tags.sort(sortTagsByValue);
    return tags

}

export function renderCardCollection(initiatives: Initiative[], tagClick: ((clickedSlug: string) => void), tagSorting: { [x: string]: number; } | undefined) {
    return (<CardContainer>
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
                        <SkCard
                            key={initiativeElement.id}
                            title={title}
                            id={initiativeElement.id}
                            description={description}
                            image_url={initiativeElement.main_image_url}
                            tags={top_tags}
                            tagClick={tagClick}
                        />
                );
              }
             )
    }</CardContainer>)
}