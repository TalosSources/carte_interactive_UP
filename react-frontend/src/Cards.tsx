import React from 'react';
import styled from "styled-components";
import sanitizeHtml from "sanitize-html";
import {Initiative, getSmallestImage } from './KesApi';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './constants';

const CardContainer = styled.div`
    gap: 0.5em;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
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

function SkCard(props: {key?: string; id: string; image_url: string; title: string; description: string; }) {
    const { id, image_url, title, description} = props
    
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
        </Card>
    );
}

export function renderCards(initiatives: Initiative[]) {
    const {t} = useTranslation();
    return (initiatives.map(
              (initiativeElement) => {
                return <SkCard
                            key={initiativeElement.slug}
                            title={t('initiatives.'+initiativeElement.slug+'.title')}
                            id={initiativeElement.slug}
                            description={t('initiatives.'+initiativeElement.slug+'.short_description')}
                            image_url={getSmallestImage(initiativeElement)}
                        />;
              }
             )
    )
}

export function renderCardCollection(initiatives: Initiative[]) {
    return (<CardContainer className='card-group'>
            {renderCards(initiatives)}
            </CardContainer>)
}