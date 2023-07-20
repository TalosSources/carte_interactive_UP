import React, {useState, useEffect, Suspense} from "react";
import {Link, useParams} from "react-router-dom";
import {renderCards} from "../Cards";
import { Feature, fetchRegionPage, fetchTags, Initiative, matchTagsWithInitiatives, Tag } from "../KesApi";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { GeoBoundingBox } from "../BoundingBox";
import { initiativeLocationFeatureToGeoCoordinate } from "../KesApi";
import styled from "styled-components";
import { getDescription, getTitle, registerInitiativeTranslations, registerRegionPageDescription } from "../i18n";
import PageNotFound from "./PageNotFound";
import { t } from "i18next";

export default function RegionPage() {
    const {regionSlugP, page} = useParams();

    if (typeof regionSlugP === 'undefined') {
        return <PageNotFound/>
    }
    if (typeof page === 'undefined') {
        return <PageNotFound/>
    }

    useEffect(() => {
        fetchRegionPage(regionSlugP, page)
        .then(rp => {
            registerRegionPageDescription(rp[0], regionSlugP, page)
        })
    }, [])

    const description = t('region.'+regionSlugP+'.'+page+'.description');

    return <>
        <h1>{t('region.'+regionSlugP+'.'+page+'.title')}</h1>
        <div className="card-title" dangerouslySetInnerHTML={{__html: description}}></div>
        </>;

}

