import dataclasses
import logging
import sys
import os
from datetime import datetime
from slugify import slugify

import json
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

def generateNewSlug(beginning, model):
    slugified_beginning = slugify(beginning)
    possible_slug = slugified_beginning
    n = 0
    while 1:
        try:
            model.objects.get(slug=possible_slug)
            n += 1
            possible_slug = slugified_beginning + str(n)
        except model.DoesNotExist:
            return possible_slug

TMP_FOLDER = "./cache"
def requestSK3API(data_type_full_name, per_page=None, fields=None, page_nr=None):
    CACHE_FILE_NAME = f"{data_type_full_name}_{page_nr}"
    CACHE_FILE_PATH = os.path.join(TMP_FOLDER, CACHE_FILE_NAME)
    if os.path.isfile(CACHE_FILE_PATH):
        with open(CACHE_FILE_PATH, 'r') as f:
            return json.load(f)
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
    os.makedirs(os.path.dirname(CACHE_FILE_PATH), exist_ok=True)
    with open(CACHE_FILE_PATH, 'w') as f:
        json.dump(response_json, f)
    return response_json

def getAllDataOf(dataTypeFullName):
    CACHE_FILE_NAME = f"{dataTypeFullName}"
    CACHE_FILE_PATH = os.path.join(TMP_FOLDER, CACHE_FILE_NAME)
    if os.path.isfile(CACHE_FILE_PATH):
        with open(CACHE_FILE_PATH, 'r') as f:
            return json.load(f)
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
    os.makedirs(os.path.dirname(CACHE_FILE_PATH), exist_ok=True)
    with open(CACHE_FILE_PATH, 'w') as f:
        json.dump(responses, f)
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
        #importAddresses(region)
        importPages(region)
        businessRows = importInitiatives(region)
        beforeBusiness = datetime.now()
        process_business_rows(businessRows)
        afterBusiness = datetime.now()
        logging.debug(f"Importing buisnesses took {afterBusiness-beforeBusiness}")

    logging.debug("=== Reading from sk3 API done. Now starting processing ===")
    #clear_unused_tags_from_db()
    #generateStatistics()


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

    def getImageDict(row):
        result = {}
        if RJSK_ACF_MAIN_IMAGE in row[RJK_ACF] and row[RJK_ACF][RJSK_ACF_MAIN_IMAGE]: # : false | Dict
            sizes = row[RJK_ACF][RJSK_ACF_MAIN_IMAGE]['sizes']
            for key in sizes:
                if 'height' in key:
                    continue
                if 'width' in key:
                    continue
                width = sizes[key+'-width']
                height = sizes[key+'-height']
                result[(width, height)] = sizes[key]
        return result

    def createOrGetInitiativeBase(thisTranslationSK3):
        thisTranslationSK3Id = thisTranslationSK3[RJK_ID]
        if thisTranslationSK3Id in initiativeBasesOfTranslations:
            return initiativeBasesOfTranslations[thisTranslationSK3Id]
        translations_dict = thisTranslationSK3[RJK_TRANSLATIONS]
        try:
            return website.models.InitiativeTranslation.objects.get(sk3_id=thisTranslationSK3Id).initiative
        except:
            pass
        for translationId in translations_dict.values():
            try:
                return website.models.InitiativeTranslation.objects.get(sk3_id=translationId).initiative
            except:
                pass
        initiativeBase = addNewBaseInitiative(thisTranslationSK3)
        registerInitiativeBase(initiativeBase, thisTranslationSK3)
        importLocations(thisTranslationSK3, initiativeBase)
        return initiativeBase

    Languages = {
        'en' : {
            'english' : 'english',
            'native' : 'english',
            'flag' : '🇬🇧',
        },
        'sv' : {
            'english' : 'swedish',
            'native' : 'svenska',
            'flag' : '🇸🇪',
        },
        'de' : {
            'english' : 'german',
            'native' : 'deutsch',
            'flag' : '🇩🇪',
        },
    }
    def create_languages(code):
        Default_Lang = 'en'
        langs = website.models.Language
        try:
            return langs.objects.get(code=code)
        except langs.DoesNotExist:
            language = langs.objects.create(
                code=code,
                englishName=Languages[code]['english'],
                nativeName=Languages[code]['native'],
                flag=Languages[code]['flag'],
                )
            if code == Default_Lang:
                language.default = 'd'
            language.save()
            return language


    def addTranslationToInitiativeBase(row, initiativeBase):
        wp_post_id = row[RJK_ID]
        lang_code = row[RJK_LANG]
        lang_obj = create_languages(lang_code)
        title = row[RJK_TITLE][RJSK_RENDERED]
        afc = row[RJK_ACF]
        description = afc[RJSK_ACF_DESCRIPTION_ID]
        short_description = afc['short_description']
        new_title_obj = website.models.InitiativeTranslation(
            sk3_id=wp_post_id,
            language=lang_obj,
            title=title,
            short_description=short_description,
            description=description,
            initiative=initiativeBase
        )
        try:
            new_title_obj.save()
        except:
            otherTitle = website.models.InitiativeTranslation.objects.get(sk3_id=wp_post_id)
            logging.info(f"Translation for initiative {title} {wp_post_id} in lang {lang_code} was already present. Bound to initiative {otherTitle.sk3_id}")

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
        def getPhone():
            if 'phone_number' in row['acf']:
                if 'phone' in row['acf'] and row['acf']['phone'] != '':
                    if (row['acf']['phone'] != row['acf']['phone_number']):
                        logging.warn(f"Found inequal 'phone' and 'phone_number' entries for {title}.")
                return row['acf']['phone_number']
            if 'phone' in row['acf']:
                return row['acf']['phone']
            return None
        data_type_full_name = row[RJK_TYPE]
        main_image_url = getImageUrl(row)
        region_name = data_type_full_name.split("_")[0]
        assert region_name in REGION_DATA_DICT.keys()

        logging.debug(f"{main_image_url=}")
        region_obj = website.models.Region.objects.get(slug=region_name)
        title = row[RJK_TITLE][RJSK_RENDERED]
        phone = getPhone()
        mail = row['acf']['email']
        if len(mail)>127:
            print(f"Mail for {title} seems unreasonably long: '{mail}'")
        facebook = row['acf']['facebook_url']
        if len(facebook)>255:
            print(f"Facebook for {title} seems unreasonably long: '{facebook}'")
        website_url = row['acf']['website_url']
        if len(website_url)>511:
            print(f"Homepage-URL for {title} seems unreasonably long: '{website_url}'")
        instagram = row['acf']['instagram_username']
        if len(instagram)>127:
            print(f"Instagram for {title} seems unreasonably long: '{instagram}'")
        slug = generateNewSlug(title, website.models.Initiative) # TODO: Ideally, we want to have the english version
        new_initiative_obj = website.models.Initiative(
            region=region_obj,
            main_image_url=main_image_url,
            slug=slug,
            mail=mail,
            phone=phone,
            homepage=website_url,
            instagram=instagram,
            facebook=facebook
        )
        new_initiative_obj.save()
        for (imageSize, url) in getImageDict(row).items():
            width, height = imageSize
            website.models.InitiativeImage(width=width,height=height,
                                           url=url, initiative=new_initiative_obj).save()
        return new_initiative_obj
    
    def importLocations(row, initiativeObj):
        data_type_full_name = row[RJK_TYPE]
        if RJK_ADDRESS_AND_COORDINATE in row:
            address_and_coordinate_list_or_bool = row[RJK_ADDRESS_AND_COORDINATE]
            if address_and_coordinate_list_or_bool:
                for aac_dict in address_and_coordinate_list_or_bool:
                    location_id = aac_dict[RJSK_ADDRESS_AND_COORDINATE_ID]
                    latitude: str = aac_dict['latitude']
                    latitude = latitude.replace(',', '.')
                    longitude: str = aac_dict['longitude']
                    longitude = longitude.replace(',', '.')
                    # -please note order of lat and lng
                    geo_point = django.contrib.gis.geos.Point(float(longitude), float(latitude))
                    title = aac_dict['post_title']
                    new_obj = website.models.Location(
                        title=title,
                        coordinates=geo_point,
                        initiative=initiativeObj,
                    )
                    new_obj.save()
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
        for translationId in translations_dict.values():
            initiativeBasesOfTranslations[translationId] = initiativeBase

    logging.debug("============= entered function process_business_rows")
    initiativeBasesOfTranslations = {} # : {sk3TranslationId : sk4InitiativeBaseObj}

    for row in businessRows:
        checkRow(row)

        initiativeBase = createOrGetInitiativeBase(row)
        lang_code = row[RJK_LANG]
        if lang_code == 'en': # only take english tags for now
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
