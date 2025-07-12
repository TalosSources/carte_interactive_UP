import logging
from typing import Any, List, TypedDict, Dict
import website.models

from website.management.commands.importing.RegionData import REGION_DATA_DICT
from website.management.commands.importing.SK3Api import isPublished, getAllDataOf
from website.management.commands.importing.common import create_languages

RegionDataType = TypedDict(
    "RegionDataType",
    {
        "slug": str,
        "email": str | None,
        "area": str | None,
    },
)

OfferedRegionType = TypedDict(
    "OfferedRegionType",
    {
        "slug": str,
        "lang": str,
        "translations": dict[str, int],
        "id": int,
        "welcome_message": str,
    },
)

RenderedContent = TypedDict("RenderedContent", {"rendered": str})

JsonPageTranslation = TypedDict(
    "JsonPageTranslation",
    {
        "lang": str,
        "slug": str,
        "id": int,
        "title": RenderedContent,
        "content": RenderedContent,
        "translations": Dict[str, int],
        "page_type": Any,
    },
)


def findPossibleExistingPageBase(jsonPageTranslation: JsonPageTranslation):
    translations: Dict[str, int] = jsonPageTranslation["translations"]
    for lang in translations:
        try:
            otherTranslation = website.models.RegionPageTranslation.objects.get(
                sk3_id=translations[lang]
            )
            return otherTranslation.region_page
        except:
            pass
    return None


def shallPageBeSkipped(page: JsonPageTranslation):
    if isinstance(page["page_type"], bool):
        return True
    if page["page_type"][0]["typename"] != "MenuFullPage":
        return True
    return False


def createRegionPageBase(page: JsonPageTranslation, regionSlug: str, order: int):
    slug = page["slug"]
    region_obj = website.models.Region.objects.get(slug=regionSlug)
    regionPageBase = website.models.RegionPage(
        slug=slug,
        order=order,
        region=region_obj,
    )
    regionPageBase.save()
    return regionPageBase


def createOrUpdatePageTranslation(
    base: website.models.RegionPage, page: JsonPageTranslation
):
    wp_post_id = page["id"]
    try:
        website.models.RegionPageTranslation.objects.get(sk3_id=wp_post_id)
        return
    except:
        pass

    # add translation
    lang = page["lang"]
    lang_obj = create_languages(lang)
    title = page["title"]["rendered"]
    description = page["content"]["rendered"]
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


def exists_already_in_db(region: dict[str, OfferedRegionType]):
    for lang in region:
        wp_post_id = region[lang]["id"]
        try:
            return website.models.RegionTranslation.objects.get(
                sk3_id=wp_post_id
            ).region
        except website.models.RegionTranslation.DoesNotExist:
            pass
    return None


def group_region_translations(offered_regions: List[OfferedRegionType]):
    regions: list[dict[str, OfferedRegionType]] = []
    sk3_id_to_region = {}

    for offered_region in offered_regions:
        sk3_id = offered_region["id"]
        lang = offered_region["lang"]
        if sk3_id in sk3_id_to_region:
            sk3_id_to_region[sk3_id][lang] = offered_region
        else:
            new_group: dict[str, OfferedRegionType] = {}
            new_group[lang] = offered_region
            regions.append(new_group)
            for lang_code in offered_region["translations"]:
                sk3_id_to_region[offered_region["translations"][lang_code]] = new_group

    return regions


def pivot_by_slug(grouped_regions: list[dict[str, OfferedRegionType]], slug_lang: str):
    pivoted_regions: dict[str, dict[str, OfferedRegionType]] = {}
    for group in grouped_regions:
        pivoted_regions[group[slug_lang]["slug"]] = group
    return pivoted_regions


def createRegion(region: dict[str, OfferedRegionType], slug_lang: str):
    resp_row = region[slug_lang]
    region_base = exists_already_in_db(region)

    if region_base is None:
        slug = resp_row["slug"]
        if slug == "global":
            slug = "sverige"
        region_data = REGION_DATA_DICT[slug]
        region_base = website.models.Region(slug=slug, area=region_data.area)
        region_base.save()
    return region_base


def createRegionTranslations(
    region: dict[str, OfferedRegionType], region_base: website.models.Region
):
    region_data = REGION_DATA_DICT[region_base.slug]
    for lang in region:
        translation = region[lang]
        try:
            website.models.RegionTranslation.objects.get(sk3_id=translation["id"])
        except website.models.RegionTranslation.DoesNotExist:
            region_translation = website.models.RegionTranslation(
                sk3_id=translation["id"],
                language=create_languages(translation["lang"]),
                welcome_message=translation["welcome_message"],
                region=region_base,
                title=region_data.name,
            )
            region_translation.save()


def createMumbai():
    mR: OfferedRegionType = {
        "slug": "mumbai",
        "lang": "en",
        "id": 37,
        "translations": {},
        "welcome_message": "This is the Mumbai section of SK.",
    }
    region = {"en": mR}
    base = createRegion(region, "en")
    createRegionTranslations(region, base)


def importRegions(regions_to_be_imported: List[str]) -> None:
    slug_lang = "sv"
    offered_regions: List[OfferedRegionType] = getAllDataOf("region")
    grouped_regions: list[dict[str, OfferedRegionType]] = group_region_translations(
        offered_regions
    )
    pivoted_regions = pivot_by_slug(grouped_regions, slug_lang)
    # pivoted_regions["sverige"] = pivoted_regions["global"]
    pivoted_regions["sverige"] = pivoted_regions["global"]
    regions = [pivoted_regions[rslug] for rslug in regions_to_be_imported]

    for region in regions:
        region_base = createRegion(region, slug_lang)
        createRegionTranslations(region, region_base)
        importPages(region_base.slug)
    createMumbai()
