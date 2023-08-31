import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GeoCoordinate } from "./Coordinate";
import { registerInitiativeTranslations, registerRegionPageDescription } from "./i18n";
import { GeoBoundingBox } from "./BoundingBox";

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
    title: string;
    slug: string;
}

export interface Feature {
    geometry: { coordinates: number[] };
    properties: { title: string };
}

export interface Initiative {
    id: number;
    slug: string;
    region: string,
    tags: string[];
    locations: { features: Feature[] };
    main_image_url: string;
    state: string;
    promote: boolean;
    initiative_images: InitiativeImage[];
    initiative_translations: {
        language: string,
        title: string,
        short_description: string,
        description: string,
        query_tokens: {
            title: string,
            short_description: string,
            description: string,
        }
    }[];
    facebook: string,
    instagram: string,
    phone: string,
    homepage: string,
    mail: string,
    area: string,
    online_only: boolean,
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

export async function fetchRegionPage(region:string, page:string) : Promise<RegionPage> {
    const tag_api_url = `${process.env.REACT_APP_BACKEND_URL}/regionPage?region=${region}&page=${page}`;
    const response = await fetch(tag_api_url, {credentials:'omit'})
    const rp : RegionPage = (await response.json())[0]
    registerRegionPageDescription(rp, region, page)
    return rp;
}
export function useRegionPage(regionSlugP:string, page:string) {
    useQueryClient();
    const {data}= useQuery({queryKey:['regionPage', regionSlugP, page],
                            queryFn: () => fetchRegionPage(regionSlugP, page), suspense: true})
    if (typeof data === 'undefined') {
        throw "Some error should already have kicked"
    }
    return data;
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

async function fetchInitiative(initiativeSlug:string) {
    const initiative_api_url = `${process.env.REACT_APP_BACKEND_URL}/initiativeDetails?slug=` + initiativeSlug;
    const initiative = await fetch(initiative_api_url, {credentials:'omit'})
        .then(response => response.json())
        .then(response_json => response_json[0])
        .catch(err => console.error(err));
    registerInitiativeTranslations(initiative);
    return initiative;
}

export function useInitiative(initiativeSlug: string) : Initiative {
    useQueryClient();
    const {data}= useQuery({queryKey:['initiative', initiativeSlug],
                            queryFn: ()=>fetchInitiative(initiativeSlug), suspense: true})
    if (typeof data === 'undefined') {
        throw "Some error should already have kicked"
    }
    return data;
}

export async function fetchTags() : Promise<Tag[]> {
    const response = await fetchFromDB('tags')
    let tags = await response.json();
    tags = tags.map((tag: Tag) => {
        tag.title = tag.title.replace("&amp;", "&")
        return tag
    }) 
    return tags;
}

export function useTags() : Tag[] {
    useQueryClient();
    const {data}= useQuery({queryKey:['allTags'], queryFn: fetchTags, suspense: true})
    if (typeof data === 'undefined') {
        throw "Some error should already have kicked"
    }
    return data;
}

export async function fetchLanguages() : Promise<Language[]> {
    return fetchFromDB('languages').then(r => r.json())
}

export async function fetchInitiatives() : Promise<Initiative[]> {
    const r = await fetchFromDB('initiatives');
    const initiatives : Initiative[] = await r.json();
    for (const i of initiatives) {
        registerInitiativeTranslations(i);
    }

    return initiatives;
}
export function useInitiatives() : Initiative[] {
    useQueryClient();
    const {data} = useQuery({queryKey:['allInitiatives'], queryFn: fetchInitiatives, suspense: true})
    if (typeof data === 'undefined') {
        throw "Some error should already have kicked"
    }
    return data;
}

function initiativeInsideMap(initiative: Initiative, mapBounds: GeoBoundingBox) {
    return initiative.locations.features.some(
        feature => mapBounds.contains(initiativeLocationFeatureToGeoCoordinate(feature))
    );
}

export function useFilteredInitiatives(tags: string[], searchQuery: string, bb: GeoBoundingBox | "Hide global" | "Show all") : Initiative[] {
    function initiativeMatchesCurrentSearch(initiative: Initiative) {
        return initiativeMatchesSearch(initiative, searchQuery)
    }

    function initiativeMatchCurrentTags(initiative: Initiative) {
        return tags.every((tagSlug: string) => initiative.tags.some(iTag => iTag == tagSlug))
    }
    
    function initiativeMatchesSearch(initiative: Initiative, searchString: string) {
        const translations = initiative.initiative_translations;
        return searchString
            .split(' ')
            .map(keyword => keyword.toLowerCase())
            .every(keyword =>
                translations.some((translation) => translation.query_tokens.title.includes(keyword)) ||
                initiative.tags.some(tag => tag.includes(keyword)) ||
                translations.some((translation) => translation.query_tokens.short_description.includes(keyword)) ||
                translations.some((translation) => translation.query_tokens.description.includes(keyword)) ||
                false
            );
    }

    let initiatives: Initiative[] = useInitiatives();

    if (bb === 'Hide global') {
        initiatives = initiatives.filter(i => i.locations.features.length > 0)
    } else if (bb !== 'Show all') {
        initiatives = initiatives.filter(i => initiativeInsideMap(i, bb));
    }
    initiatives = initiatives
        .filter(initiativeMatchCurrentTags)
        .filter(initiativeMatchesCurrentSearch);
    return initiatives;
}


export async function fetchRegions() : Promise<Region[]> {
    const r = await fetchFromDB('regions');
    const json = await r.json();
    return json['features']
}

export function matchTagsWithInitiatives(initiatives: Initiative[], tags: Tag[]) {
    const resultMap = new Map<string, Tag[]>();
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