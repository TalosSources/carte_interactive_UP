import internal from "stream";
import { GeoCoordinate } from "./Coordinate";

export interface Region {
    properties : {
        slug : string;
        title : string;
        welcome_message_html: string;
        rp_region: {
            slug: string;
            order: number;
            rp_translations: {
                language: string;
                title: string;
            }[]
        }[]
    }
}

export interface Language {
    flag : string;
    code : string;
    nativeName : string;
    englishName : string;
}

export interface Tag {
    title : string;
    slug : string;
}

export interface Feature {
    geometry:{coordinates: number[]};
    properties:{title:string};
}

export interface Initiative {
    id : number;
    slug : string;
    region : string,
    tags : string[];
    locations : {features : Feature[]};
    main_image_url : string;
    state : string;
    promote : boolean;
    initiative_images : InitiativeImage[];
    initiative_translations : {
        language : string,
        title : string,
        short_description : string,
        description : string,
    }[];
    facebook:string,
    instagram:string,
    phone:string,
    homepage:string,
    mail:string,
    area:string,
    online_only:boolean,
}

export interface InitiativeImage {
    width : number;
    height : number;
    url : string;
}

export interface RegionPage {
    rp_translations : {
        language:string;
        title:string;
        description:string;
    }[]
}

export function initiativeLocationFeatureToGeoCoordinate(feature: Feature) {
    return new GeoCoordinate({'longitude': feature.geometry.coordinates[0], 'latitude': feature['geometry']['coordinates'][1]})
}

export async function fetchRegionPage(region:string, page:string) : Promise<RegionPage[]> {
    const tag_api_url = `${process.env.REACT_APP_BACKEND_URL}/regionPage?region=${region}&page=${page}`;
    const response = await fetch(tag_api_url, {credentials:'omit'})
    return response.json();

}

export function getSmallestImage(i: Initiative) {
    let result=''
    let resultSize = Number.MAX_VALUE
    for (const image of i.initiative_images) {
        const imageSize = image.height*image.width
        if (imageSize < resultSize) {
            result = image.url;
            resultSize = imageSize;
        }
    }
    return result;
}

function fetchFromDB(path : string) {
    const tag_api_url = `${process.env.REACT_APP_BACKEND_URL}/${path}/`;
    return fetch(tag_api_url, {credentials:'omit'});
}

export async function fetchTags() : Promise<Tag[]> {
    const response = await fetchFromDB('tags')
    return await response.json();
}

export async function fetchLanguages() : Promise<Language[]> {
    return fetchFromDB('languages').then(r => r.json())
}

export async function fetchInitiatives() : Promise<Initiative[]> {
    const response = await fetchFromDB('initiatives');
    const json = await response.json()
    return json;
}

export async function fetchRegions() : Promise<Region[]> {
    const r = await fetchFromDB('regions');
    const json = await r.json();
    return json['features']
}

export function matchTagsWithInitiatives(initiatives: Initiative[], tags: Tag[]) {
    const resultMap = new Map();
    for (const i of initiatives) {
        const tagsOfThisInitiative : Tag[] = []
        for (const tagSlug of i.tags) {
            for (const t of tags) {
                if (t.slug === tagSlug) {
                    tagsOfThisInitiative.push(t);
                    break;
                }
            }
        }
        resultMap.set(i.slug, tagsOfThisInitiative);
    }
    return resultMap;
}