import { useQuery, useQueryClient } from '@tanstack/react-query'
import { registerInitiativeTranslations, registerRegionPageDescription } from './i18n'
import L, { type LatLngBounds, type LatLng } from 'leaflet'

export interface Region {
  properties: {
    slug: string
    rp_region: Array<{
      slug: string
      order: number
      rp_translations: Array<{
        language: string
        title: string
      }>
    }>
    r_translations: Array<{
      title: string
      language: string
      welcome_message: string
    }>
  }
  geometry: {
    coordinates: number[][][] // 1 x n x 2.
  }
}

export interface Language {
  flag: string
  code: string
  nativeName: string
  englishName: string
}

export interface Tag {
  title: string
  slug: string
}

export interface Feature {
  geometry: { coordinates: number[] }
  properties: { title: string }
}

export interface Initiative {
  id: number
  slug: string
  region: string
  tags: string[]
  locations: { features: Feature[] }
  main_image_url: string
  state: string
  promote: boolean
  initiative_translations: Array<{
    language: string
    title: string
    short_description: string
    description: string
    query_tokens: {
      title: string
      short_description: string
      description: string
    }
  }>
  facebook: string
  instagram: string
  phone: string
  homepage: string
  mail: string
  area: string
  online_only: boolean
}

export interface RegionPage {
  rp_translations: Array<{
    language: string
    title: string
    description: string
  }>
}

export function initiativeLocationFeatureToGeoCoordinate (feature: Feature): LatLng {
  return L.latLng({ lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] })
}

export async function fetchRegionPage (region: string, page: string): Promise<RegionPage> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL ?? ''
  const tagApiUrl = `${backendUrl}/regionPage?region=${region}&page=${page}`
  const response = await fetch(tagApiUrl, { credentials: 'omit' })
  const rp: RegionPage = (await response.json())[0]
  registerRegionPageDescription(rp, region, page)
  return rp
}
export function useRegionPage (regionSlugP: string, page: string): RegionPage {
  useQueryClient()
  const { data } = useQuery({
    queryKey: ['regionPage', regionSlugP, page],
    queryFn: async () => await fetchRegionPage(regionSlugP, page),
    suspense: true
  })
  if (typeof data === 'undefined') {
    throw Error('Some error should already have kicked')
  }
  return data
}

export function getSmallestImage (i: Initiative): string {
  return i.main_image_url
}

async function fetchFromDB (path: string): Promise<Response> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL ?? ''
  const tagApiUrl = `${backendUrl}/${path}/`
  return await fetch(tagApiUrl, { credentials: 'omit' })
}

async function fetchInitiative (initiativeSlug: string): Promise<Initiative> {
  const backendUrl = process.env.REACT_APP_BACKEND_URL ?? ''
  const initiativeApiUrl = `${backendUrl}/initiativeDetails?slug=` + initiativeSlug
  const initiative = await fetch(initiativeApiUrl, { credentials: 'omit' })
    .then(async response => await response.json())
    .then(responseJson => responseJson[0])
    .catch(err => { console.error(err) })
  registerInitiativeTranslations(initiative)
  return initiative
}

export function useInitiative (initiativeSlug: string): Initiative {
  useQueryClient()
  const { data } = useQuery({
    queryKey: ['initiative', initiativeSlug],
    queryFn: async () => await fetchInitiative(initiativeSlug),
    suspense: true
  })
  if (typeof data === 'undefined') {
    throw Error('Some error should already have kicked')
  }
  return data
}

export async function fetchTags (): Promise<Tag[]> {
  const response = await fetchFromDB('tags')
  let tags = await response.json()
  tags = tags.map((tag: Tag) => {
    tag.title = tag.title.replace('&amp;', '&')
    return tag
  })
  return tags
}

export function useTags (): Tag[] {
  useQueryClient()
  const { data } = useQuery({ queryKey: ['allTags'], queryFn: fetchTags, suspense: true })
  if (typeof data === 'undefined') {
    throw Error('Some error should already have kicked')
  }
  return data
}

export async function fetchLanguages (): Promise<Language[]> {
  return await fetchFromDB('languages').then(async r => await r.json())
}

export async function fetchInitiatives (): Promise<Initiative[]> {
  const r = await fetchFromDB('initiatives')
  const initiatives: Initiative[] = await r.json()
  for (const i of initiatives) {
    registerInitiativeTranslations(i)
  }

  return initiatives
}
export function useInitiatives (): Initiative[] {
  useQueryClient()
  const { data } = useQuery({ queryKey: ['allInitiatives'], queryFn: fetchInitiatives, suspense: true })
  if (typeof data === 'undefined') {
    throw Error('Some error should already have kicked')
  }
  return data
}

function initiativeInsideMap (initiative: Initiative, mapBounds: LatLngBounds): boolean {
  if (!mapBounds.isValid()) {
    return false
  }
  return initiative.locations.features.some(
    feature => mapBounds.contains(initiativeLocationFeatureToGeoCoordinate(feature))
  )
}

export function useFilteredInitiatives (tags: string[], searchQuery: string, bb: LatLngBounds): Initiative[] {
  function initiativeMatchesCurrentSearch (initiative: Initiative): boolean {
    return initiativeMatchesSearch(initiative, searchQuery)
  }

  function initiativeMatchCurrentTags (initiative: Initiative): boolean {
    return tags.every((tagSlug: string) => initiative.tags.includes(tagSlug))
  }

  function initiativeMatchesSearch (initiative: Initiative, searchString: string): boolean {
    const translations = initiative.initiative_translations
    return searchString
      .split(' ')
      .map(keyword => keyword.toLowerCase())
      .every(keyword =>
        translations.some((translation) => translation.query_tokens.title.includes(keyword)) ||
                initiative.tags.some(tag => tag.includes(keyword)) ||
                translations.some((translation) => translation.query_tokens.short_description.includes(keyword)) ||
                translations.some((translation) => translation.query_tokens.description.includes(keyword)) ||
                false
      )
  }

  let initiatives: Initiative[] = useInitiatives()

  initiatives = initiatives.filter(i => initiativeInsideMap(i, bb))
  initiatives = initiatives
    .filter(initiativeMatchCurrentTags)
    .filter(initiativeMatchesCurrentSearch)
  return initiatives
}

export async function fetchRegions (): Promise<Region[]> {
  const r = await fetchFromDB('regions')
  const json = await r.json()
  return json.features
}

export function matchTagsWithInitiatives (initiatives: Initiative[], tags: Tag[]): Map<string, Tag[]> {
  const resultMap = new Map<string, Tag[]>()
  for (const i of initiatives) {
    const tagsOfThisInitiative: Tag[] = []
    for (const tagSlug of i.tags) {
      for (const t of tags) {
        if (t.slug === tagSlug) {
          tagsOfThisInitiative.push(t)
          break
        }
      }
    }
    resultMap.set(i.slug, tagsOfThisInitiative)
  }
  return resultMap
}
