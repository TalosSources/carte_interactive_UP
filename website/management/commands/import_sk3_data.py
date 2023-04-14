import dataclasses
import logging
import sys
from datetime import datetime

import django.contrib.gis.geos
import django.core.management.base
import django.db
import requests

import website.models

from typing import Dict, List, Optional

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

curl --header "Authorization: Bearer LbjFbvboclZd7bcjhNMkMJLl0SIv1Pe7" "https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/global_business/"
(It's safest to always put the url within citation marks)

https://docs.djangoproject.com/en/4.1/howto/custom-management-commands/

"""

# RJK: Response JSON (Sub) Key

RJK_ID = "id"  # -the WP post id
RJK_TYPE = "type"
RJK_DATE = "date"
RJK_SLUG = "slug"
RJK_TITLE = "title"
RJSK_RENDERED = "rendered"
RJK_ACF = "acf"  # -advanced custom fields (WP)
RJSK_ACF_SHORT_DESCRIPTION = "short_description"  # unused
RJSK_ACF_DESCRIPTION_ID = "description"
RJSK_ACF_MAIN_IMAGE = "main_image"
RJSK_ACF_MAIN_IMAGE_URL = "url"
RJK_LATITUDE = "latitude"
RJK_LONGITUDE = "longitude"
RJK_STATUS = "status"
RJK_TRANSLATIONS = "translations"
RJK_LANG = "lang"
RJK_ADDRESS_AND_COORDINATE = "address_and_coordinate"
RJSK_ADDRESS_AND_COORDINATE_ID = "id"  # -another field called "ID" is also available, which has the same value AFAIK

RJK_HUVUDTAGGAR = "huvudtaggar"
RJK_SUBTAGGAR = "subtaggar"
RJK_TRANSAKTIONSFORM = "transaktionsform"
RJK_TAGGAR = "taggar"

RJK_LANGUAGE_CODE = "language_code"
RJK_WELCOME_MESSAGE = "welcome_message"

STATUS_PUBLISH = "publish"

PER_PAGE = 100  # -max is 100: https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/
FIELDS = []
"""
FIELDS = [RJK_ID, RJK_STATUS, RJK_DATE, RJK_SLUG, RJK_TITLE, RJK_ACF, RJK_LATITUDE, RJK_LONGITUDE,
    RJK_ADDRESS_AND_COORDINATE, RJK_LANGUAGE_CODE, RJK_WELCOME_MESSAGE, RJK_TRANSLATIONS, RJK_LANG]
"""
# data_type = "global_business"
# See https://sk-wp.azurewebsites.net/wp-admin/admin.php?page=pods
ADDRESS_DT = "address"
PAGE_DT = "page"
BUSINESS_DT = "business"
GOTEBORG_R = "goteborg"
OVERSATTNING_DT = "oversattning"
GLOBAL_R = "global"
REGION_DT = "region"
TAGG_DT = "tagg"


@dataclasses.dataclass
class RegionData:
    name: str
    area: django.contrib.gis.geos.Polygon


REGION_DATA_DICT = {
    "gavle": RegionData(name="Gävle", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((17.077645913509762, 60.699070904289485),
            (17.11197818698215, 60.63886310495179),
            (17.204932817408636, 60.655481950213876),
            (17.167167316589012, 60.6993649396649),
            (17.077645913509762, 60.699070904289485))
        )
    )),
    "goteborg": RegionData(name="Göteborg", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((11.925401093582142, 57.689568545605425),
            (12.03638016933202, 57.68245690713329),
            (12.03608040451827, 57.62297997831338),
            (11.933598563618602, 57.61438419604527),
            (11.925401093582142, 57.689568545605425))
        )
    )),
    "linkoping": RegionData(name="Linköping", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing( # = Göteborg TODO
            ((11.925401093582142, 57.689568545605425),
            (12.03638016933202, 57.68245690713329),
            (12.03608040451827, 57.62297997831338),
            (11.933598563618602, 57.61438419604527),
            (11.925401093582142, 57.689568545605425))
        )
    )),
    "karlstad": RegionData(name="Karlstad", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((13.475279848392983, 59.41602274519939),
            (13.604369196649156, 59.393830755190955),
            (13.553900754644749, 59.35517852830722),
            (13.397002264875942, 59.386663307532906),
            (13.475279848392983, 59.41602274519939))
        )
    )),
    "malmo": RegionData(name="Malmö", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((13.010306234755156, 55.64519863885748),
            (13.084807268190234, 55.56102410084758),
            (12.929625392095048, 55.57014849918855),
            (13.010306234755156, 55.64519863885748))
        )
    )),
    "sjuharad": RegionData(name="Sjuhärad", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((14.206499714918326, 57.85457566201329),
            (11.857397392491432, 57.586455763764135),
            (13.264187269288032, 57.16096031630569),
            (14.206499714918326, 57.85457566201329))
        )
    )),
    "stockholm": RegionData(name="Stockholm", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((18.08573118034145, 59.57756097353471),
            (18.78610955917813, 59.33609249026372),
            (18.039039288419005, 59.148575718907594),
            (17.653487857324105, 59.32330815025737),
            (18.08573118034145, 59.57756097353471))
        )
    )),
    "umea": RegionData(name="Umeå", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((20.272687805012996, 63.86819938869472),
            (20.386327630206594, 63.82885670594015),
            (20.316976437792373, 63.77353273455124),
            (20.198873417047363, 63.786729400444166),
            (20.109952828753883, 63.855494691747076),
            (20.272687805012996, 63.86819938869472))
        )
    )),
    "global": RegionData(name="Hela Sverige", area=django.contrib.gis.geos.Polygon(
        django.contrib.gis.geos.LinearRing(
            ((20.352595005064796, 69.02952599870233),
            (24.351618219128373, 65.86602404663931),
            (17.84771233251949, 55.838700895944626),
            (12.969782917562823, 55.16671299640125),
            (9.981501834526311, 58.711547373103386),
            (16.52935303117985, 67.99959938511587),
            (20.352595005064796, 69.02952599870233))
        )
    )),
}

# Contains sub-lists on this format: [sk3_id_en, sk3_id_sv], where the order of langs is undetermined
# business_lang_combos_list = []

def requestSK3API(data_type_full_name, per_page=None, fields=None, page_nr=None):
    bearer_token = "LbjFbvboclZd7bcjhNMkMJLl0SIv1Pe7"
    header_dict = {"Authorization": f"Bearer {bearer_token}"}
    api_url = f"https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/{data_type_full_name}/"
    if fields:
        api_url += f"&_fields={','.join(FIELDS)}"
        # -documentation: https://developer.wordpress.org/rest-api/using-the-rest-api/global-parameters/#_fields
    if per_page:
        api_url += f"&per_page={PER_PAGE}&page={page_nr}"
        # -documentation: https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/
    api_url = api_url.replace('&', '?', 1)
    logging.debug(f"Calling requests.get with {api_url=}")
    response = requests.get(api_url, headers=header_dict)
    response_json = response.json()  # -can be a list or a dict
    if type(response_json) is dict and response_json.get("code", "") == "rest_post_invalid_page_number":
        logging.debug(f"No more data found for {page_nr=} Exiting while loop")
        return None

    if response.status_code != 200:
        logging.critical(f"WARNING response code was not 200 --- {response.status_code=}")
        return None
    return response_json

def getAllDataOf(dataTypeFullName):
        page_nr = 1
        responses = []
        while True:
            logging.debug(f"Page nr: {page_nr}")
            response_json = requestSK3API(dataTypeFullName, PER_PAGE, FIELDS, page_nr)  # -can be a list or a dict
            if response_json is None:
                break

            logging.debug(f"Number of rows: {len(response_json)}")

            responses += response_json
            page_nr += 1
        return responses
    
def isPublished(json_row):
    status = json_row[RJK_STATUS]
    return(status == STATUS_PUBLISH)

def importRegions():
    regions = getAllDataOf(REGION_DT)
    regions = filter(lambda row: isPublished(row), regions)
    for resp_row in regions:

        """
        {'id': 19,
         'date': '2020-01-09T12:05:16',
         'date_gmt': '2020-01-09T12:05:16',
         'guid': {
            'rendered': 'http://sk-wp.azurewebsites.net/?post_type=region&#038;p=19'},
            'modified': '2023-03-16T12:20:05',
            'modified_gmt': '2023-03-16T12:20:05',
            'slug': 'gothenburg',
            'status': 'publish',
            'type': 'region',
            'link': 'https://sk-wp.azurewebsites.net/index.php/en/region/gothenburg/',
            'title': {'rendered': 'Gothenburg'
         },
         'template': '',
         'url_path': 'gothenburg',
         'pages_api_path': 'goteborg_page',
         'businesses_api_path': 'goteborg_business',
         'language_code': 'en',
         'welcome_message': '<h2>Explore the Gothenburg sharing initiatives that make it easy to rent, share, borrow, give and take!</h2>',
         'region_menu_order': '30',
         'hide': '0',
         'acf': [],
         'lang': 'en',
         'translations': {
           'en': 19,
           'sv': 20
         },
         'pll_sync_post': [],
         '_links': {
           'self': [
            {
                'href': 'https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/region/19'}],
                'collection': [{'href': 'https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/region'
            }
           ],
           'about': [
            {
                'href': 'https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/types/region'
            }
           ],
           'wp:attachment': [
            {
                'href': 'https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/media?parent=19'
            }
           ],
           'curies': [
            {
                'name': 'wp',
                'href': 'https://api.w.org/{rel}',
                'templated': True
            }
           ]
         }
        }
        """

        logging.debug(resp_row)
        wp_post_id = resp_row[RJK_ID]
        try:
            existing_obj = website.models.Region.objects.get(sk3_id=wp_post_id)
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

def importAddresses(region):

    """
    {
        "id": 12247,
        "date": "2023-01-23T20:14:11",
        "date_gmt": "2023-01-23T20:14:11",
        "guid": {
        "rendered": "https:\/\/sk-wp.azurewebsites.net\/?post_type=address_gbg&#038;p=12247"
        },
        "modified": "2023-01-23T20:14:11",
        "modified_gmt": "2023-01-23T20:14:11",
        "slug": "saggatan-19",
        "status": "publish",
        "type": "address_gbg",
        "link": "https:\/\/sk-wp.azurewebsites.net\/index.php\/address-gbg\/saggatan-19\/",
        "title": {
        "rendered": "S\u00e5ggatan 19"
        },
        "template": "",
        "latitude": "57.69513792779139",
        "longitude": "11.925602211999262",
        "acf": [],
        "_links": {
        "self": [
            {
            "href": "https:\/\/sk-wp.azurewebsites.net\/index.php\/wp-json\/wp\/v2\/address_gbg\/12247"
            }
        ],
        "collection": [
            {
            "href": "https:\/\/sk-wp.azurewebsites.net\/index.php\/wp-json\/wp\/v2\/address_gbg"
            }
        ],
        "about": [
            {
            "href": "https:\/\/sk-wp.azurewebsites.net\/index.php\/wp-json\/wp\/v2\/types\/address_gbg"
            }
        ],
        "wp:attachment": [
            {
            "href": "https:\/\/sk-wp.azurewebsites.net\/index.php\/wp-json\/wp\/v2\/media?parent=12247"
            }
        ],
        "curies": [
            {
            "name": "wp",
            "href": "https:\/\/api.w.org\/{rel}",
            "templated": true
            }
        ]
        }
    }
    """

    if region == GOTEBORG_R:
        region = "gbg"
    data_type_full_name = f"{ADDRESS_DT}_{region}"
    addresses = getAllDataOf(data_type_full_name)
    addresses = filter(lambda row: isPublished(row), addresses)
    for resp_row in addresses:
        wp_post_id = resp_row[RJK_ID]
        try:
            existing_obj = website.models.Location.objects.get(sk3_id=wp_post_id)
            continue
        except website.models.Location.DoesNotExist:
            pass
        latitude: str = resp_row[RJK_LATITUDE]
        latitude = latitude.replace(',', '.')
        longitude: str = resp_row[RJK_LONGITUDE]
        longitude = longitude.replace(',', '.')
        geo_point = django.contrib.gis.geos.Point(float(longitude), float(latitude))
        # -please note order of lat and lng
        title = resp_row[RJK_TITLE][RJSK_RENDERED]
        new_obj = website.models.Location(
            sk3_id=wp_post_id,
            title=title,
            coordinates=geo_point
        )
        new_obj.save()

def importPages(region):
    data_type_full_name = f"{region}_{PAGE_DT}"
    pages = getAllDataOf(data_type_full_name)
    pages = filter(lambda row: isPublished(row), pages)
    logging.warning(f"INFO: Case (data type) not covered: {data_type_full_name=}. Continuing")

def importInitiatives(region : str):
    data_type_full_name = f"{region}_{BUSINESS_DT}"
    initiatives = response_json = getAllDataOf(data_type_full_name)
    return list(filter(lambda row: isPublished(row), initiatives))

def importTags():
    tags = response_json = getAllDataOf(TAGG_DT)
    tags = filter(lambda row: isPublished(row), tags)
    return list(tags)

def generateStatistics():
    tag_count = {}
    for initiative_obj in website.models.Initiative.objects.all():
        for tag_obj in initiative_obj.tags.all():
            if tag_obj.slug in tag_count:
                tag_count[tag_obj.slug] += 1
            else:
                tag_count[tag_obj.slug] = 1
    logging.info(tag_count)



def import_sk3_data(i_args: List[str]):
    importRegions()
    tags = importTags()
    process_tagg_rows(tags)

    #TODO for region in REGION_DATA_DICT.keys():
    for region in ["goteborg", "malmo"]:
        importAddresses(region)
        importPages(region)
        businessRows = importInitiatives(region)
        beforeBusiness = datetime.now()
        process_business_rows(businessRows)
        afterBusiness = datetime.now()
        logging.debug(f"Importing buisnesses took {afterBusiness-beforeBusiness}")

    logging.debug("=== Reading from sk3 API done. Now starting processing ===")
    clear_unused_tags_from_db()
    generateStatistics()


LANG_CODE_EN = "en"
LANG_CODE_SV = "sv"


def clear_unused_tags_from_db() -> None:
    for tag_obj in website.models.Tag.objects.all():
        for initiative_obj in website.models.Initiative.objects.all():
            if tag_obj in initiative_obj.tags.all():
                break
        else:
            tag_obj.delete()

def process_business_rows(businessRows):
    """
    Background information

    SK3 data scheme:
        For every language and initiative, there is a full datarow of information.
          This contain besides others: localized title, localized description, image_url and tags. (Yes, duplicated data.)
          And a dict with all translations of this initiative.

    SK4 scheme:
        For every initiative, there is a _InitiativeBases_ containing the tags, slug and image_url.
        And in a separate table, there are _InitiatveTranslations_ for every language.
    """
    def getImageUrl(row):
        if RJSK_ACF_MAIN_IMAGE in row[RJK_ACF] and row[RJK_ACF][RJSK_ACF_MAIN_IMAGE]: # : false | Dict
            return row[RJK_ACF][RJSK_ACF_MAIN_IMAGE][RJSK_ACF_MAIN_IMAGE_URL]
        else:
            return ""

    def createOrGetInitiativeBase(thisTranslationSK3):
        thisTranslationSK3Id = thisTranslationSK3[RJK_ID]
        if thisTranslationSK3Id in initiativeBasesOfTranslations:
            return initiativeBasesOfTranslations[thisTranslationSK3Id]
        translations_dict = thisTranslationSK3[RJK_TRANSLATIONS]
        try:
            return website.models.Initiative.objects.get(sk3_id=thisTranslationSK3Id)
        except:
            pass
        for translationId in translations_dict:
            try:
                return website.models.Initiative.objects.get(sk3_id=translationId)
            except:
                pass
        initiativeBase = addNewBaseInitiative(thisTranslationSK3)
        registerInitiativeBase(initiativeBase, thisTranslationSK3)
        linkLocations(thisTranslationSK3, initiativeBase)
        return initiativeBase

    def addTranslationToInitiativeBase(row, initiativeBase):
        wp_post_id = row[RJK_ID]
        lang_code = row[RJK_LANG]
        title = row[RJK_TITLE][RJSK_RENDERED]
        afc = row[RJK_ACF]
        description = afc[RJSK_ACF_DESCRIPTION_ID]
        new_title_obj = website.models.InitiativeTitleText(
            sk3_id=wp_post_id,
            language_code=lang_code,
            text=title,
            initiative=initiativeBase
        )
        try:
            new_title_obj.save()
        except:
            otherTitle = website.models.InitiativeTitleText.objects.get(sk3_id=wp_post_id)
            logging.info(f"Title for initiative {title} {wp_post_id} in lang {lang_code} was already present. Bound to initiative {otherTitle.initiative.sk3_id}")
        new_description_obj = website.models.InitiativeDescriptionText(
            sk3_id=wp_post_id,
            language_code=lang_code,
            text=description,
            initiative=initiativeBase
        )
        try:
            new_description_obj.save()
        except:
            logging.info(f"Description for initiative {title} {wp_post_id} in lang {lang_code} was already present.")

    def checkRow(row):
        wp_post_id = row[RJK_ID]
        resp_row_afc = row[RJK_ACF]
        description = resp_row_afc[RJSK_ACF_DESCRIPTION_ID]
        translations_dict = row[RJK_TRANSLATIONS]
        title = row[RJK_TITLE][RJSK_RENDERED]

        if LANG_CODE_SV not in translations_dict:
            logging.warning(f"Missing Swedish translation for {wp_post_id=}")
        if LANG_CODE_EN not in translations_dict:
            logging.warning(f"Missing English translation for {wp_post_id=}")
        if not description:
            logging.warning(f"WARNING: Description for {title} is empty")
            description = "-"
        if len(description) > 12000:
            logging.info(f"INFO: Description for {title} is very long: {len(description)} characters")

    def addNewBaseInitiative(row):
        wp_post_id = row[RJK_ID]
        data_type_full_name = row[RJK_TYPE]
        main_image_url = getImageUrl(row)
        region_name = data_type_full_name.split("_")[0]
        assert region_name in REGION_DATA_DICT.keys()

        logging.debug(f"{main_image_url=}")
        region_obj = website.models.Region.objects.get(slug=region_name)
        new_initiative_obj = website.models.Initiative(
            sk3_id=wp_post_id,
            region=region_obj,
            main_image_url=main_image_url
        )
        logging.debug(f"Saving Initiative object for {wp_post_id=}")
        new_initiative_obj.save()
        return new_initiative_obj
    
    def linkLocations(row, initiativeObj):
        data_type_full_name = row[RJK_TYPE]
        if RJK_ADDRESS_AND_COORDINATE in row:
            address_and_coordinate_list_or_bool = row[RJK_ADDRESS_AND_COORDINATE]
            if address_and_coordinate_list_or_bool:
                for aac_dict in address_and_coordinate_list_or_bool:
                    # Address comes first, so we can connect here (and don't have to save until later)
                    location_id = aac_dict[RJSK_ADDRESS_AND_COORDINATE_ID]
                    try:
                        location = website.models.Location.objects.get(sk3_id=location_id)
                        # -only works when added to db, so will not work during testing
                        location.initiative = initiativeObj
                        location.save()
                    except website.models.Location.DoesNotExist:
                        logging.critical(f"Location doesn't exist for sk3_id '{location_id}'")
        else:
            if GLOBAL_R not in data_type_full_name:
                logging.warning(f"WARNING: No location available for non-global initiative: {initiativeBase}")

    def linkTags(row, initiativeObj):
        all_tags_list = []
        for rjk in [RJK_HUVUDTAGGAR, RJK_TAGGAR, RJK_SUBTAGGAR, RJK_TRANSAKTIONSFORM]:
            tags_list_or_bool = row[rjk]
            if tags_list_or_bool:  # ensures that this is not False or []
                all_tags_list.extend(tags_list_or_bool)
        logging.debug(f"{len(all_tags_list)=}")
        for tag_title in all_tags_list:
            try:
                tag = website.models.Tag.objects.get(title=tag_title)
                initiativeObj.tags.add(tag)
            except:
                logging.critical(f"Failure when loading tag {tag_title}")
        return all_tags_list

    def registerInitiativeBase(initiativeBase, row):
        translations_dict = row[RJK_TRANSLATIONS]
        for translationId in translations_dict:
            initiativeBasesOfTranslations[translationId] = initiativeBase

    logging.debug("============= entered function process_business_rows")
    initiativeBasesOfTranslations = {} # : {sk3TranslationId : sk4InitiativeBaseObj}

    for row in businessRows:
        """
        {
            "id": 11636,
            "date": "2022-09-20T15:09:25",
            "date_gmt": "2022-09-20T15:09:25",
            "guid": {
            "rendered": "http:\/\/sk-wp.azurewebsites.net\/?post_type=goteborg_business&#038;p=11636"
            },
            "modified": "2022-09-20T15:09:25",
            "modified_gmt": "2022-09-20T15:09:25",
            "slug": "the-free-shop-aterbruket-lansmansgarden",
            "status": "publish",
            "type": "goteborg_business",
            "link": "https:\/\/sk-wp.azurewebsites.net\/index.php\/en\/goteborg-business\/the-free-shop-aterbruket-lansmansgarden\/",
            "title": {
            "rendered": "The Free Shop \u00c5terbruket L\u00e4nsmansg\u00e5rden"
            },
            "template": "",
            "address_and_coordinate": [
            {
                "latitude": "57.73348851727369",
                "longitude": "11.898837895906174",
                "ID": 11634,
                "post_title": "S\u00f6dra Fj\u00e4dermolnsgatan 12",
                "post_content": "",
                "post_excerpt": "",
                "post_author": "12",
                "post_date": "2022-09-20 15:00:19",
                "post_date_gmt": "2022-09-20 15:00:19",
                "post_status": "publish",
                "comment_status": "closed",
                "ping_status": "closed",
                "post_password": "",
                "post_name": "sodra-fjadermolnsgatan-12",
                "to_ping": "",
                "pinged": "",
                "post_modified": "2022-09-20 15:00:19",
                "post_modified_gmt": "2022-09-20 15:00:19",
                "post_content_filtered": "",
                "post_parent": 0,
                "guid": "http:\/\/sk-wp.azurewebsites.net\/?post_type=address_gbg&#038;p=11634",
                "menu_order": 0,
                "post_type": "address_gbg",
                "post_mime_type": "",
                "comment_count": "0",
                "comments": false,
                "id": 11634
            }
            ],
            "icon": "",
            "huvudtaggar": [
            "Things"
            ],
            "subtaggar": [
            "Board games",
            "Books &amp; media",
            "Clothes",
            "Gadgets",
            "Sports and leisure equipment",
            "Toys"
            ],
            "transaktionsform": [
            "Give &amp; get"
            ],
            "taggar": [
            "L\u00e4nsmansg\u00e5rden",
            "Free shop",
            "Free",
            "Give away"
            ],
            "acf": {
            "email": "",
            "phone": "",
            "phone_number": "0704-990899",
            "instagram_username": "",
            "facebook_url": "",
            "website_url": "",
            "online_only": false,
            "city": [
                19
            ],
            "area": "L\u00e4nsmansg\u00e5rden",
            "main_image": false,
            "short_description": "Gratisbutik i L\u00e4nsmansg\u00e5rden",
            "description": "<p>For more than ten year pensioneer Roine has run \u00c5terbruket, a free shop in L\u00e4nsmansg\u00e5rden. Come and collect a sweater, a book or why not a VHS tape?<\/p>\n<p>A free shop is like a second hand shop, with the difference that everything is for free. So swing by and drop off something you have that works, but you don&#8217;t need.<\/p>\n<p>You&#8217;re more than welcome to drop off things in the free shop during it&#8217;s opening hours. It&#8217;s only during these hours that Roine will pick up the phone.<\/p>\n",
            "hide_opening_hours": false,
            "always_open": false,
            "text_for_opening_hours": "",
            "closed_on_monday": false,
            "opening_hour_monday": "11:00",
            "closing_hour_monday": "15:00",
            "closed_on_tuesday": true,
            "closed_on_wednesday": false,
            "opening_hour_wednesday": "16:00",
            "closing_hour_wednesday": "19:00",
            "closed_on_thursday": true,
            "closed_on_friday": true,
            "closed_on_saturday": true,
            "closed_on_sunday": true
            },
            "lang": "en",
            "translations": {
            "en": 11636,
            "sv": 11629
            },
            "pll_sync_post": [],
            "_links": {
            "self": [
                {
                "href": "https:\/\/sk-wp.azurewebsites.net\/index.php\/wp-json\/wp\/v2\/goteborg_business\/11636"
                }
            ],
            "collection": [
                {
                "href": "https:\/\/sk-wp.azurewebsites.net\/index.php\/wp-json\/wp\/v2\/goteborg_business"
                }
            ],
            "about": [
                {
                "href": "https:\/\/sk-wp.azurewebsites.net\/index.php\/wp-json\/wp\/v2\/types\/goteborg_business"
                }
            ],
            "wp:attachment": [
                {
                "href": "https:\/\/sk-wp.azurewebsites.net\/index.php\/wp-json\/wp\/v2\/media?parent=11636"
                }
            ],
            "curies": [
                {
                "name": "wp",
                "href": "https:\/\/api.w.org\/{rel}",
                "templated": true
                }
            ]
            }
        },
        """
        checkRow(row)

        initiativeBase = createOrGetInitiativeBase(row)
        tags = linkTags(row, initiativeBase)
        addTranslationToInitiativeBase(row, initiativeBase)

def process_tagg_rows(tags):

    """
    {
        "id": 12291,
        "date": "2023-01-27T10:19:28",
        "date_gmt": "2023-01-27T10:19:28",
        "guid": {
        "rendered": "https:\/\/sk-wp.azurewebsites.net\/index.php\/tagg\/ramar\/"
        },
        "modified": "2023-01-27T10:19:28",
        "modified_gmt": "2023-01-27T10:19:28",
        "slug": "ramar",
        "status": "publish",
        "type": "tagg",
        "link": "https:\/\/sk-wp.azurewebsites.net\/index.php\/tagg\/ramar\/",
        "title": {
        "rendered": "Ramar"
        },
        "template": "",
        "grupp": false,
        "beskrivning": "",
        "goteborg_huvudtagg": false,
        "goteborg_subtagg": false,
        "goteborg_transaktionsform": false,
        "malmo_huvudtagg": false,
        "malmo_subtagg": false,
        "malmo_transaktionsform": false,
        "global_huvudtagg": false,
        "global_subtagg": false,
        "global_transaktionsform": false,
        "karlstad_huvudtagg": false,
        "karlstad_subtagg": false,
        "karlstad_transaktionsform": false,
        "sjuharda_huvudtagg": false,
        "sjuharda_subtagg": false,
        "sjuharda_transaktionsform": false,
        "umea_huvudtagg": false,
        "umea_subtagg": false,
        "umea_transaktionsform": false,
        "stockholm_huvudtagg": false,
        "stockholm_subtagg": false,
        "stockholm_transaktionsform": false,
        "gavle_huvudtagg": false,
        "gavle_subtagg": false,
        "gavle_transaktionsform": false,
        "acf": [],
        "lang": "sv",
        "translations": {
        "sv": 12291
        },
        "pll_sync_post": [],
        "_links": {
        "self": [
            {
            "href": "https:\/\/sk-wp.azurewebsites.net\/index.php\/wp-json\/wp\/v2\/tagg\/12291"
            }
        ],
        "collection": [
            {
            "href": "https:\/\/sk-wp.azurewebsites.net\/index.php\/wp-json\/wp\/v2\/tagg"
            }
        ],
        "about": [
            {
            "href": "https:\/\/sk-wp.azurewebsites.net\/index.php\/wp-json\/wp\/v2\/types\/tagg"
            }
        ],
        "wp:attachment": [
            {
            "href": "https:\/\/sk-wp.azurewebsites.net\/index.php\/wp-json\/wp\/v2\/media?parent=12291"
            }
        ],
        "curies": [
            {
            "name": "wp",
            "href": "https:\/\/api.w.org\/{rel}",
            "templated": true
            }
        ]
        }
    },
    """

    def getShortestSlugs(tag_rows):
        tagg_dict = {}
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
            slug = resp_row[RJK_SLUG]
            wp_post_id = resp_row[RJK_ID]
            if title in tagg_dict.keys():
                logging.warn(f"Found duplicate tag {title}. Slugs: '{slug}' vs. '{tagg_dict[title]}'")
                nr_of_duplicates += 1
                if len(slug) < len(tagg_dict[title]):
                    tagg_dict[title] = slug
            else:
                tagg_dict[title] = slug
        return tagg_dict


        logging.debug(f"{nr_of_duplicates=}")
        logging.debug(f"{len(tagg_dict)=}")

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
        parser.add_argument("--clear_unused_tags", action="store_true")  # -available under "options" in help
        # parser.add_argument("--sk3_data_types", nargs="*", type=str)  # -available under "positional arguments" in help

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
        elif options["clear_unused_tags"]:
            clear_unused_tags_from_db()
        else:
            import_sk3_data(args)
