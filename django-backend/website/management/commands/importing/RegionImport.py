import logging
from typing import Any, List, TypedDict, Dict
import website.models

from website.management.commands.importing.RegionData import REGION_DATA_DICT
from website.management.commands.importing.SK3Api import isPublished, getAllDataOf
from website.management.commands.importing.common import create_languages

RegionDataType = TypedDict('RegionDataType', {
    'slug': str,
    'email': str | None,
    'area': str | None,
    }
)

OfferedRegionType = TypedDict('OfferedRegionType', {
    'slug': str,
    'lang': str,
    'translations': dict[str, int],
    'id': int,
    "welcome_message": str,
})

RenderedContent = TypedDict('RenderedContent', {'rendered': str})

JsonPageTranslation = TypedDict('JsonPageTranslation', {
    'lang': str,
    'slug': str,
    'id': int,
    'title': RenderedContent,
    'content': RenderedContent,
    'translations': Dict[str, int],
    'page_type': Any,
})

def findPossibleExistingPageBase(jsonPageTranslation: JsonPageTranslation):
    translations: Dict[str, int] = jsonPageTranslation['translations']
    for lang in translations:
        try:
            otherTranslation = website.models.RegionPageTranslation.objects.get(sk3_id=translations[lang])
            return otherTranslation.region_page
        except:
            pass
    return None

def shallPageBeSkipped(page: JsonPageTranslation):
    if isinstance(page['page_type'], bool):
        return True
    if page['page_type'][0]['typename'] != 'MenuFullPage':
        return True
    return False

def createRegionPageBase(page:JsonPageTranslation, regionSlug: str, order: int):
    slug = page['slug']
    region_obj = website.models.Region.objects.get(slug=regionSlug)
    regionPageBase = website.models.RegionPage(
        slug=slug,
        order=order,
        region=region_obj,
    )
    regionPageBase.save()
    return regionPageBase

def createOrUpdatePageTranslation(base: website.models.RegionPage, page: JsonPageTranslation):
    wp_post_id = page['id']
    try:
        website.models.RegionPageTranslation.objects.get(sk3_id=wp_post_id)
        return
    except:
        pass

    # add translation
    lang = page['lang']
    lang_obj = create_languages(lang)
    title = page['title']['rendered']
    description = page['content']['rendered']
    translation = website.models.RegionPageTranslation(
        sk3_id=wp_post_id,
        region_page=base,
        language=lang_obj,
        title=title,
        description=description,
    )
    translation.save()


def importPages(region: str) -> None:
    data_type_full_name = f"{region}_page"
    pages = getAllDataOf(data_type_full_name)
    pages2 = filter(isPublished, pages)
    order = 0

    for page in pages2:
        if shallPageBeSkipped(page):
            continue
        order += 1
        regionPageBase = findPossibleExistingPageBase(page)
        if regionPageBase is None:
            regionPageBase = createRegionPageBase(page, region, order)
        else:
            regionPageBase.order = order

        createOrUpdatePageTranslation(regionPageBase, page)


def exists_already_in_db(region: OfferedRegionType):
        wp_post_id = region["id"]
        try:
            return website.models.Region.objects.get(sk3_id=wp_post_id)
        except website.models.Region.DoesNotExist:
            return None

def group_region_translations(offered_regions: List[OfferedRegionType]):
    regions: list[dict[str, OfferedRegionType]] = []
    sk3_id_to_region = {}

    for offered_region in offered_regions:
        sk3_id = offered_region['id']
        lang = offered_region['lang']
        if sk3_id in sk3_id_to_region:
            sk3_id_to_region[sk3_id][lang] = offered_region
        else:
            new_group: dict[str, OfferedRegionType] = {}
            new_group[lang] = offered_region
            regions.append(new_group)
            for lang_code in offered_region["translations"]:
                sk3_id_to_region[offered_region["translations"][lang_code]] = new_group

    return regions
            
def pivot_by_swedish_slug(grouped_regions: list[dict[str, OfferedRegionType]]):
    pivoted_regions: dict[str, dict[str, OfferedRegionType]] = {}
    for group in grouped_regions:
        pivoted_regions[group['sv']['slug']] = group
    return pivoted_regions

def createRegion(region: dict[str, OfferedRegionType]):
    # -this is not because we want Swedish, but because we want the minimal slug
    # -TODO: In the future we want this translated (so not skipping)
    resp_row = region['sv']
    region_base = exists_already_in_db(resp_row)

    if region_base is None:
        slug = resp_row['slug']
        region_data = REGION_DATA_DICT[slug]
        wp_post_id = resp_row["id"]
        region_base = website.models.Region(
            sk3_id=wp_post_id,
            slug=slug,
            welcome_message_html=resp_row["welcome_message"],
            title=region_data.name, # TODO take this from response
            area=region_data.area
        )
        region_base.save()
    return region_base

def createRegionTranslations():
    logging.warn("Region translations import not yet implemented.")
    #TODO
    pass

def createMumbai():
    mR : OfferedRegionType = {
        'slug': 'mumbai',
        'lang': 'en',
        'id': 37,
        'translations': {},
        'welcome_message': "This is the Mumbai secton of SK"
    }
    createRegion({'sv': mR})

def importRegions(regions_to_be_imported: List[str]) -> None:
    offered_regions: List[OfferedRegionType] = getAllDataOf("region")
    grouped_regions: list[dict[str, OfferedRegionType]] = group_region_translations(offered_regions)
    pivoted_regions = pivot_by_swedish_slug(grouped_regions)
    regions = [pivoted_regions[rslug] for rslug in regions_to_be_imported]

    for region in regions:
        region_base = createRegion(region)
        createRegionTranslations()
        importPages(region_base.slug)
    createMumbai()
