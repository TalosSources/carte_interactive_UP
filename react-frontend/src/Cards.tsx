import React, { Suspense } from 'react';
import styled from "styled-components";
import sanitizeHtml from "sanitize-html";
import {Initiative, Tag, getSmallestImage } from './KesApi';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './constants';

const CardContainer = styled.div`
    //gap: 0.5em;
    //display: flex;
    //flex-direction: row;
    //max-width: 100%;
    //flex-wrap: wrap;
`;

const Card = styled.div`
    //position: relative;
    //flex: 1 10em;
    height: 20em;
    //background-color: beige;
    //border-radius: 0.3em;
    overflow: hidden;
    // -webkit-mask-image: linear-gradient(180deg, #000 70%, transparent);
    // -webkit-mask-repeat: no-repeat;
    min-width: 10em;
`;

const CardImage = styled.img`
    //width: 100%;
    height: 10em;
    //border-radius: 0.3em 0.3em 0 0;
    object-fit: cover;
`;

const CardTextContainer = styled.div`
    //padding: 0.5em;
    // -webkit-mask-image: linear-gradient(180deg, #000 70%, transparent);
    // -webkit-mask-repeat: no-repeat;
    
    //p {
        //padding: 0pt;
        //margin: 0pt;
    //}
`;

const CardTitle = styled.h3`
    font-weight: bold;
    color: black;
    //padding: 0.2em;
    font-size: 0.9em;

`;

const CardDescription = styled.p`
    font-size: 0.7em;
    color: black;
    //display: -webkit-box;
    //-webkit-line-clamp: 4;
    //-webkit-box-orient: vertical;
    overflow: hidden;
`;


const CardTagPanel = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    overflow-x: scroll;
    white-space: nowrap;
    //height: 2.5em;
    font-size: small;
    padding:0pt;
    width:100%;
`;

function SkCard(props: {key?: string; id: string; image_url: string; title: string; description: string; tags: Tag[], tagClick: ((clickedSlug: string) => void)}) {
    // CSS in React: https://www.w3schools.com/react/react_css.asp
    const { id, image_url, title, description, tags, tagClick} = props
    
    const cleanDescription = sanitizeHtml(description, { allowedTags: []})
    return (
        <Card className='card'>
            <Link to={'/details/' + id} 
            //style={{paddingBottom: tags?.length ? "2rem" : "0"}}
            >
                <CardImage className="card-image card-img-top" src={image_url}/>
                <CardTextContainer className="card-body">
                    <CardTitle className='card-title'>{title}</CardTitle>
                    <CardDescription className="card-text card-description">{cleanDescription}</CardDescription>
                </CardTextContainer>
            </Link>
            <CardTagPanel className="cardTagPanel card-footer">
            {
                tags.map((tagElement: Tag) => (
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

function sortTagsByValue(tags : Tag[], values:{ [x: string]: number; }) {
    function sortTagsByValue(tag_a: Tag, tag_b: Tag) {
        return values[tag_b.slug] - values[tag_a.slug]
    }
    tags.sort(sortTagsByValue);
    return tags

}

export function renderCards(initiatives: Initiative[], tagsByInitiatives : Map<string, Tag[]>, tagClick: ((clickedSlug: string) => void), tagSorting: { [x: string]: number; } | undefined) {
    const {t} = useTranslation();
    return (initiatives.map(
              (initiativeElement) => {
                let top_tags = tagsByInitiatives.get(initiativeElement.slug)
                if (typeof top_tags === 'undefined') {
                    // tags not yet propagated
                    top_tags = []
                }
                if (!(typeof tagSorting == "undefined")) {
                    sortTagsByValue(top_tags, tagSorting)
                }
                return (
                    <Suspense>
                        <SkCard
                            key={initiativeElement.slug}
                            title={t('initiatives.'+initiativeElement.slug+'.title')}
                            id={initiativeElement.slug}
                            description={t('initiatives.'+initiativeElement.slug+'.short_description')}
                            image_url={getSmallestImage(initiativeElement)}
                            tags={top_tags}
                            tagClick={tagClick}
                        /></Suspense>
                );
              }
             )
    )
}

export function renderCardCollection(initiatives: Initiative[], tagsByInitiatives : Map<string, Tag[]>, tagClick: ((clickedSlug: string) => void), tagSorting: { [x: string]: number; } | undefined) {
    const {t} = useTranslation();
    return (<CardContainer className='card-group'>
            {renderCards(initiatives, tagsByInitiatives, tagClick, tagSorting)}
            </CardContainer>)
}