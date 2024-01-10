import logging

from typing import Dict, List, TypedDict

import django.core.management.base
import django.db

import website.models
from website.management.commands.importing.RegionData import REGION_DATA_DICT
from website.management.commands.importing.SK3Api import getAllDataOf
from website.management.commands.importing.ImportInitiatives import importInitiatives, create_languages


"""
Loglevel:
- Debug
- Info: something that may be interesting to know, but is expectable
  - if initiatives, tags, … was already in the DB
- Warning: something that we observed that is unexpected
  - if the data if found to be strange
- Error: ?
- Critical: something that may render the process useless
  - if tags or locations to be linked cannot be found
- Fatal: something that make the process fail
  - nothing so far
"""
logging.basicConfig(level=logging.INFO)

"""
How to use this script: See CONTRIBUTING.md

WP documentation: Using the REST API
https://developer.wordpress.org/rest-api/using-the-rest-api/

REST and Python: Consuming APIs
https://realpython.com/api-integration-in-python/#rest-and-python-consuming-apis

Example API request:
https://reqbin.com/yoftqza4

"Manage Pods" page in WordPress:
https://sk-wp.azurewebsites.net/wp-admin/admin.php?page=pods
(Only available with WP login)
"""

# RJK: Response JSON (Sub) Key
RJK_ID = "id"  # -the WP post id
RJK_DATE = "date"
RJK_SLUG = "slug"
RJK_TITLE = "title"
RJSK_RENDERED = "rendered"
RJK_LATITUDE = "latitude"
RJK_LONGITUDE = "longitude"
RJK_STATUS = "status"

RJK_LANGUAGE_CODE = "language_code"
RJK_WELCOME_MESSAGE = "welcome_message"

STATUS_PUBLISH = "publish"

ADDRESS_DT = "address"
PAGE_DT = "page"
GOTEBORG_R = "goteborg"
OVERSATTNING_DT = "oversattning"
REGION_DT = "region"
TAGG_DT = "tagg"

InitiativeJSON = TypedDict('InitiativeJSON', {'status': str})

def isPublished(json_row: InitiativeJSON) -> bool:
    status = json_row[RJK_STATUS]
    return(status == STATUS_PUBLISH)

def importRegions() -> None:
    regions = getAllDataOf(REGION_DT)
    regions2 = filter(isPublished, regions)
    for resp_row in regions2:
        logging.debug(resp_row)
        wp_post_id = resp_row[RJK_ID]
        try:
            website.models.Region.objects.get(sk3_id=wp_post_id)
            continue
        except website.models.Region.DoesNotExist:
            pass

        lang_code = resp_row[RJK_LANGUAGE_CODE]
        if lang_code != "sv":
            # -this is not because we want Swedish, but because we want the minimal slug
            # -TODO: In the future we want this translated (so not skipping)
            continue
        slug = resp_row[RJK_SLUG]
        region_data = REGION_DATA_DICT[slug]
        new_obj = website.models.Region(
            sk3_id=wp_post_id,
            slug=slug,
            welcome_message_html=resp_row[RJK_WELCOME_MESSAGE],
            title=region_data.name, # TODO take this from response
            area=region_data.area
        )
        new_obj.save()

def importPages(region: str) -> None:
    data_type_full_name = f"{region}_{PAGE_DT}"
    region_obj = website.models.Region.objects.get(slug=region)
    pages = getAllDataOf(data_type_full_name)
    pages2 = filter(isPublished, pages)
    order = 0

    for page in pages2:
        if isinstance(page['page_type'], bool):
            continue
        if page['page_type'][0]['typename'] != 'MenuFullPage':
            continue
        wp_post_id = page['id']
        order += 1
        # try to find this translation
        try:
            website.models.RegionPageTranslation.objects.get(sk3_id=wp_post_id)
            continue
        except:
            pass
        regionPageBase = None
        # try to find other translation
        translations: Dict[str, int] = page['translations']
        for lang in translations:
            try:
                otherTranslation = website.models.RegionPageTranslation.objects.get(sk3_id=translations[lang])
                regionPageBase = otherTranslation.region_page
                break
            except:
                pass
        # maybe create new base
        if regionPageBase is None:
            slug = page['slug']
            regionPageBase = website.models.RegionPage(
                slug=slug,
                order=order,
                region=region_obj,
            )
            regionPageBase.save()

        # add translation
        lang = page['lang']
        lang_obj = create_languages(lang)
        title = page['title']['rendered']
        description = page['content']['rendered']
        translation = website.models.RegionPageTranslation(
            sk3_id=wp_post_id,
            region_page=regionPageBase,
            language=lang_obj,
            title=title,
            description=description,
        )
        translation.save()

def importTags() -> List[Dict[str, object]]:
    tags = getAllDataOf(TAGG_DT)
    tags2 = filter(isPublished, tags)
    return list(tags2)

def import_sk3_data(_args) -> None:
    importRegions()
    tags = importTags()
    process_tagg_rows(tags)

    #TODO for region in REGION_DATA_DICT.keys():
    for region in ["goteborg", "malmo", "stockholm", "global", "sjuharad", "gavle", "linkoping", 'umea', 'karlstad']:
        importPages(region)
        importInitiatives(region)

def process_tagg_rows(tags) -> None:
    def getShortestSlugs(tag_rows) -> Dict[str, str]:
        tagg_dict : Dict[str, str] = {}
        """
        tagg_dict uses this format:
        {
        [title : string] : slug
        }
        """
        logging.debug("============= entered function process_tagg_rows")
        nr_of_duplicates = 0
        logging.debug(f"{len(tag_rows)=}")
        for resp_row in tag_rows:
            title = resp_row[RJK_TITLE][RJSK_RENDERED]
            slug: str = resp_row[RJK_SLUG]
            if title in tagg_dict.keys():
                logging.warn(f"Found duplicate tag {title}. Slugs: '{slug}' vs. '{tagg_dict[title]}'")
                nr_of_duplicates += 1
                if len(slug) < len(tagg_dict[title]):
                    tagg_dict[title] = slug
            else:
                tagg_dict[title] = slug
        return tagg_dict

    tagg_dict = getShortestSlugs(tags)
    for tag_title in tagg_dict.keys():
        new_obj = website.models.Tag(
            slug=tagg_dict[tag_title],
            title=tag_title
        )
        try:
            new_obj.save()
        except:
            logging.info(f"Tag with slug {tagg_dict[tag_title]} was already present")

class Command(django.core.management.base.BaseCommand):
    help = "Migrate data from sk3"

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true")  # -available under "options" in help

    def handle(self, *args, **options):
        logging.debug(f"{args=}")
        logging.debug(f"{options=}")
        if options["clear"]:
            result_text = input("Are you sure you want to delete the whole database? (y/n) ")
            if result_text == "y":
                website.models.Region.objects.all().delete()
                website.models.Tag.objects.all().delete()
                website.models.InitiativeTitleText.objects.all().delete()
                website.models.InitiativeDescriptionText.objects.all().delete()
                website.models.Location.objects.all().delete()
                website.models.Initiative.objects.all().delete()
        else:
            import_sk3_data(args)
