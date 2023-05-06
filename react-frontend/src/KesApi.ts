import { GeoCoordinate } from "./Coordinate";

export interface Region {
    id : number;
    properties : {
        slug : string;
        title : string;
        welcome_message_html: string;
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
}

export interface Initiative {
    id : number;
    slug : string;
    tags : string[];
    locations : {features : Feature[]};
    main_image_url : string;
    initiative_images : InitiativeImage[];
    initiative_translations : {
        language : string,
        title : string,
        short_description : string,
        description : string,
    }[];
}

export interface InitiativeImage {
    width : number;
    height : number;
    url : string;
}

function getTranslationWithFallback(i: Initiative, l: string) {
    if (l in i.initiative_translations) {
        return i.initiative_translations[l]
    }
    return Object.entries(i.initiative_translations)[0][1]
}

export function initiativeLocationFeatureToGeoCoordinate(feature: Feature) {
    return new GeoCoordinate({'longitude': feature.geometry.coordinates[0], 'latitude': feature['geometry']['coordinates'][1]})
}

export function getTitleWithFallback(i: Initiative, l: string) {
    return getTranslationWithFallback(i, l)['title']
}

export function getShortDescriptionWithFallback(i: Initiative, l: string) {
    return getTranslationWithFallback(i, l)['short_description']
}

export function getDescriptionWithFallback(i: Initiative, l: string) {
    return getTranslationWithFallback(i, l)['description']
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