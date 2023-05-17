import React, {useState, useEffect} from "react";
import {Link, useParams} from "react-router-dom";
import {renderCardCollection, renderCards} from "../Cards";
import { Feature, fetchTags, Initiative, matchTagsWithInitiatives, Tag } from "../KesApi";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { GeoBoundingBox } from "../BoundingBox";
import { initiativeLocationFeatureToGeoCoordinate } from "../KesApi";
import styled from "styled-components";
import { getDescription, getTitle } from "../i18n";

const DetailsMainImage = styled.img`
    height: 20em;
    object-fit: cover;
`;
const DetailsMapView = styled.div`
    height: 20em;
`;

function renderTags(initiative : Initiative, tagsByInitiatives : Map<string, Tag[]>) {
    return <div id="tagPanel">
    {
        tagsByInitiatives.get(initiative.slug)?.map((tagElement) => (
            <a href={`/?t=${tagElement.slug}`}>
            <div className="proposedTag">
                <div dangerouslySetInnerHTML={{__html: tagElement.title}}></div>
            </div></a>
        ))
    }</div>
}

export default function Details({initiatives}:{initiatives : Initiative[]}) {
    const {initiativeSlug} = useParams();

    const [initiative, setInitiative] = useState<Initiative>({tags: [],
        id:0,
        initiative_images: [],
        slug:"",
        locations:{features:[]},
        main_image_url: "",
        initiative_translations: [],
        published: true,
        promote:false,
        region:'global',
        facebook:"",
        instagram: "",
        phone: "",
        homepage: "",
        mail: "",
    });
    const [tags, setTags] = useState<Tag[]>([]);

    useEffect(() => {
        fetchTags()
        .then(response_json => {
            console.log("tags", response_json);
            const tags = response_json.map((tag: Tag) => {
                tag.title = tag.title.replace("&amp;", "&")
                return tag
            }) 
            setTags(tags);
            // remove invalid strings in activeTags
        });
        window.scrollTo(0, 0)
    }, []);
    useEffect(() => {
        const initiative_api_url = `${process.env.REACT_APP_BACKEND_URL}/initiativeDetails?slug=` + initiativeSlug;
        fetch(initiative_api_url)
            .then(response => response.json())
            .then(response_json => {
                setInitiative(response_json[0]);
                console.log(response_json)
            })
            .catch(err => console.error(err));
        window.scrollTo(0, 0)
    }, [initiativeSlug]);

    const similarInitiatives = initiatives
    .map(function(initiativeB) : [number, Initiative] { 
        return [
            initiative.tags.filter(tagA => initiativeB.tags.some(tagB => tagA === tagB)).length,
            initiativeB
        ]
    })
    .filter(([c,i]) => c>0)
    .sort(([ca,ia], [cb, ib]) => cb - ca)
    .slice(1,6)
    .map(([c,i]) => i);
    const taggedInitiativMatching = matchTagsWithInitiatives(initiatives, tags)
    const renderedCards = renderCards(similarInitiatives, new Map(), ()=>null, undefined);

    const {t}=useTranslation();
    const mapMarkers = renderMapMarkers(initiative)
    return (
        <>
        {(()=>{
            if (!initiative.published) {
                return <div className="alert alert-danger" role="alert">
                    Warning! You are accessing unpublished content. Information might be inaccurate.
                </div>
            }
        })()}
        <div className="row business-page">
            <div className="col-md-8">
                <article>
                    <DetailsMainImage className="col-md-8 img img-fluid" src={initiative.main_image_url}/>
                    <div className="business-header">
                        <h1>{getTitle(initiative)}</h1>
                        <a title="Edit initiative" id="edit-button" href={'/admin/website/initiative/'+initiative.id+'/change/'}><div id="pen">✎</div></a><br/>
                    </div>
                    <div className="btn-group mb-1 mt-2" role="group" aria-label="Link list">
                        <ul className="list-group list-group-horizontal-sm">
                            {(()=>{
                                if (initiative.instagram) {
                                    return <li className="list-group-item p-0 border-0">
                                        <a href={"https://www.instagram.com/"+initiative.instagram} target="_blank" className="pr-3" aria-label="instagram link">
                                            <i className="fa fa-instagram" aria-hidden="true"></i> Instagram
                                        </a>
                                    </li>
                            }})()}
                            {(()=>{
                                if (initiative.facebook) {
                                    return <li className="list-group-item p-0 border-0">
                                        <a href={initiative.facebook} target="_blank" className="pr-3" aria-label="facebook link">
                                            <i className="fa fa-facebook" aria-hidden="true"></i> Facebook
                                        </a>
                                    </li>
                            }})()}
                            {(()=>{
                                if (initiative.homepage) {
                                    return <li className="list-group-item p-0 border-0">
                                        <a href={initiative.homepage} target="_blank" className="pr-3" aria-label="website link">
                                            <i className="fa fa-link" aria-hidden="true"></i> Webbplats
                                        </a>
                                    </li>
                            }})()}
                            {(()=>{
                                if (initiative.mail) {
                                    return <li className="list-group-item p-0 border-0">
                                        <a href={"mailto:"+initiative.mail} className="pr-3" aria-label="email">
                                            <i className="fa fa-envelope" aria-hidden="true"></i> E-postadress
                                        </a>
                                    </li>
                            }})()}
                            {(()=>{
                                if (initiative.phone) {
                                    return <li className="list-group-item p-0 border-0">
                                        <a href={"tel:"+initiative.phone} className="pr-3" aria-label="phone">
                                            <i className="fa fa-phone" aria-hidden="true"></i> Phone
                                        </a>
                                    </li>
                            }})()}
                        </ul>
                    </div>
                    <p dangerouslySetInnerHTML={{__html: getDescription(initiative)}}></p>
                </article>
            </div>
            <div className="col-md-4">
                {(() => {
                 if (initiative.locations.features.length > 0) {
                    return <DetailsMapView>
                    <MapContainer 
                        id="details-map" 
                        center={[59, 15]} 
                        zoom={6} 
                        scrollWheelZoom={false} 
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                        <ZoomToPoints initiative={initiative}/>
                        {mapMarkers}
                    </MapContainer>
                    </DetailsMapView>
                 }
                }
                )()}
                <h4>{initiative.area}</h4>
                <ul>
                {initiative.locations.features.map((feature) => <li>{feature.properties.title}</li>)}
                </ul>
                {renderTags(initiative, taggedInitiativMatching)}
            </div>
            {(()=>{
                if (similarInitiatives.length > 0) {
                    return <div id="suggestions">
                        <h3>You may also like</h3>
                        <div id="similarInitiativesCanvas" className="card-group">
                            {renderedCards}
                        </div>
                    </div>
                }
            })()}
        </div></>
    );
}

function ZoomToPoints({initiative } : {initiative : Initiative}) {
    if (initiative.locations.features.length === 0) {
        return null;
    }
    const bb = GeoBoundingBox.fromCoordinates(initiative.locations.features.map((feature) => initiativeLocationFeatureToGeoCoordinate(feature)))
    const map = useMap();
    map.fitBounds([
        [bb.getTopLeft().getLatitude(), bb.getTopLeft().getLongitude()],
        [bb.getBottomRight().getLatitude(), bb.getBottomRight().getLongitude()],
    ])
    return null;
}

function renderMapMarkers(initiative: Initiative) {
    const {t} = useTranslation();
    const icon : L.Icon<L.Icon.DefaultIconOptions> = new L.Icon.Default({iconUrl:'/marker-icon.png'})
    function feature2Marker(feature: Feature, index: number) {
        const title = feature.properties.title;
        L.Icon.Default.imagePath="/"
        return (
            <Marker 
                key={`m_${index}`}
                position={[feature['geometry']['coordinates'][1], feature['geometry']['coordinates'][0]]}
                title={title}
                icon={icon}
                >
                <Popup>
                    {feature.properties.title}
                </Popup>
            </Marker>
        );
    }

    return initiative.locations.features.map((feature, index) => feature2Marker(feature, index));
}
