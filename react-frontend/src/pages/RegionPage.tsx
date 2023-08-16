import React, {useEffect} from "react";
import {useParams} from "react-router-dom";
import { fetchRegionPage, useRegionPage} from "../KesApi";
import {registerRegionPageDescription } from "../i18n";
import PageNotFound from "./PageNotFound";
import { t } from "i18next";
import { QueryBoundaries } from "../QueryBoundary";

export default function RegionPage() {
    return <QueryBoundaries>
        <RegionPageBody/>
    </QueryBoundaries>
}

function RegionPageBody() {
    const {regionSlugP, page} = useParams();

    if (typeof regionSlugP === 'undefined') {
        return <PageNotFound/>
    }
    if (typeof page === 'undefined') {
        return <PageNotFound/>
    }

    useRegionPage(regionSlugP, page);

    const description = t('region.'+regionSlugP+'.'+page+'.description');

    return <>
        <h1>{t('region.'+regionSlugP+'.'+page+'.title')}</h1>
        <div className="card-title" dangerouslySetInnerHTML={{__html: description}}></div>
        </>;

}
