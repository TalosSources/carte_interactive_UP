import logging
import random
import os
import subprocess
from pathlib import Path
from typing import Dict, Literal, Sequence, TypedDict, Union, List, Set

from django.core.files import File
import django.contrib.gis.geos
from slugify import slugify

import website.models
from website.management.commands.importing.SK3Api import getAllDataOf
from website.management.commands.importing.RegionData import REGION_DATA_DICT
from website.management.commands.importing.SK3Api import TMP_FOLDER

TitleType = TypedDict('tt', {'rendered': str})
MainImageType = TypedDict('mit', {'url': str})
AcfType = TypedDict('acft', {'phone': str,
                             'email': str | None,
                             'area': str | None,
                             'phone_number': str,
                             'online_only': bool | None,
                             'description': str | None,
                             'short_description': str | None,
                             'main_image': Literal[False] | MainImageType,
                             'instagram_username': str | None,
                             'website_url': str | None,
                             'facebook_url': str | None,
                   })
AddressAndCoordinateType=TypedDict('aact', {'latitude': str, 'longitude':str,'post_title':str})
InitiativeJSON = TypedDict('InitiativeJSON', {
        'status': str,
        'type': str,
        'title': TitleType,
        'id': str,
        'translations': dict[str, str],
        'acf': AcfType,
        'address_and_coordinate': Literal[False] | List[AddressAndCoordinateType],
        'huvudtaggar': List[str] | Literal[False],
        'taggar': List[str] | Literal[False],
        'subtaggar': List[str] | Literal[False],
        'transaktionsform': List[str] | Literal[False],
    })

BUSINESS_DT = "business"
RJK_ID = "id"  # -the WP post id
RJK_ACF = "acf"  # -advanced custom fields (WP)
RJSK_ACF_SHORT_DESCRIPTION = "short_description"  # unused
RJSK_ACF_DESCRIPTION_ID = "description"
RJSK_ACF_MAIN_IMAGE = "main_image"
RJSK_ACF_MAIN_IMAGE_URL = "url"
RJK_TITLE = "title"
RJSK_RENDERED = "rendered"
RJK_TRANSLATIONS = "translations"
RJK_TYPE = "type"
RJK_LANG = "lang"

RJK_HUVUDTAGGAR = "huvudtaggar"
RJK_SUBTAGGAR = "subtaggar"
RJK_TRANSAKTIONSFORM = "transaktionsform"
RJK_TAGGAR = "taggar"

RJK_ADDRESS_AND_COORDINATE = "address_and_coordinate"
RJSK_ADDRESS_AND_COORDINATE_ID = "id"  # -another field called "ID" is also available, which has the same value AFAIK
GLOBAL_R = "global"

def create_languages(code: str) -> website.models.Language:
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

def generateNewSlug(beginning:str, model) -> str:
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

def importInitiatives(region : str):
    data_type_full_name = f"{region}_{BUSINESS_DT}"
    initiativeData : Sequence[InitiativeJSON]= getAllDataOf(data_type_full_name)
    process_business_rows(initiativeData)

def annotateToHistory(initiativeBase: website.models.Initiative, message: str) -> None:
    initiativeBase.needs_attention = True
    prevHistory = initiativeBase.history
    initiativeBase.history = message + "\n" + prevHistory
    initiativeBase.save()

def process_business_rows(businessRows: List[InitiativeJSON]) -> None:
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

    def createOrGetInitiativeBase(thisTranslationSK3: InitiativeJSON) -> website.models.Initiative:
        def searchInDict(dict: dict[str, website.models.Initiative], key: str | None, fieldName: str, falsePositives:List[str]=[]) -> Union[website.models.Initiative, None]:
            data_type_full_name = thisTranslationSK3[RJK_TYPE]
            region_name = data_type_full_name.split("_")[0]
            # Linköping seems to be well-maintained or just everthing in only one language
            # sjuhäräd does not even have a language annotation!
            # Karlstad is completely in swedish
            if region_name in ['sjuharad', 'linkoping', 'karlstad']:
                return None
            if not key is None and key.strip() != '' and key in dict:
                title = thisTranslationSK3[RJK_TITLE][RJSK_RENDERED]
                initiativeBase = dict[key]
                for falsePositive in falsePositives:
                    if falsePositive in title.lower():
                        annotateToHistory(initiativeBase, f"Not connecting {title} to this initiatives. Both have equal {fieldName} {key}. But it's a hardcoded false positive.")
                        return None
                annotateToHistory(initiativeBase, f"Connecting {title} with this initiative based on equal {fieldName} {key}.")
                return initiativeBase
            return None

        thisTranslationSK3Id = thisTranslationSK3[RJK_ID]
        if thisTranslationSK3Id in initiativeBasesOfTranslations:
            return initiativeBasesOfTranslations[thisTranslationSK3Id]
        try:
            return website.models.InitiativeTranslation.objects.get(sk3_id=thisTranslationSK3Id).initiative
        except:
            pass
        if RJK_TRANSLATIONS in thisTranslationSK3:
            translations_dict = thisTranslationSK3[RJK_TRANSLATIONS]
            for translationId in translations_dict.values():
                try:
                    return website.models.InitiativeTranslation.objects.get(sk3_id=translationId).initiative
                except:
                    pass
        r = searchInDict(initiativeBasesByMainImage, getImageUrl(thisTranslationSK3), 'image url',
            ['fixoteket', 'plaskdammar',
            'bomhus library',
            'city library gävle',
            'sätra library',
            'valbo library',
            'forsbacka library',
            'hedesunda bibliotek',
            'alelyckan',
            ])
        if not r is None:
            return r
        r = searchInDict(initiativeBasesByInstagram, getInstagram(thisTranslationSK3), 'instagram',
            ['allmänna',
            'solidarity fridge @ kulturhuset cyklopen',
            'cultivating with länsmuseet gävleborg',
            'dospace drottningen',
            'biståndsgruppen second hand gävle city',
            'reningsborg',
            'beyond retro',
            'stadsmissionen',
            'hos oss',
            'frihet linn',
            'alelyckan',
            'mamas retro',
            ])
        if not r is None:
            return r
        r = searchInDict(initiativeBasesByFB, getFB(thisTranslationSK3), 'facebook',
            ['allmänna',
            'the red cross solidarity cabinet',
            'dospace drottningen',
            'reningsborg',
            'beyond retro',
            'stadsmissionen',
            'alelyckan',
            'hos oss',
            ])
        if not r is None:
            return r
        r = searchInDict(initiativeBasesByHomepage, getHomepage(thisTranslationSK3), 'homepage',
            ['allmänna', 'fixoteket', 'historic clothes',
            'lom', 'lappis', 'stockholm outdoor gyms',
            'red cross city centre',
            'the red cross solidarity cabinet',
            'biståndsgruppen second hand gävle city',
            'stadsmissionen',
            'lindra second hand',
            'alelyckan',
            'hos oss',
            ])
        if not r is None:
            return r
        initiativeBase = addNewBaseInitiative(thisTranslationSK3)
        registerInitiativeBase(initiativeBase, thisTranslationSK3)
        importLocations(thisTranslationSK3, initiativeBase)
        return initiativeBase

    def registerInitiativeBase(initiativeBase: website.models.Initiative, row: InitiativeJSON) -> None:
        if RJK_TRANSLATIONS in row:
            translations_dict = row[RJK_TRANSLATIONS]
            for translationId in translations_dict.values():
                initiativeBasesOfTranslations[translationId] = initiativeBase
        initiativeBasesByMainImage[getImageUrl(row)] = initiativeBase
        initiativeBasesByInstagram[getInstagram(row)] = initiativeBase
        initiativeBasesByFB[getFB(row)] = initiativeBase
        initiativeBasesByHomepage[getHomepage(row)] = initiativeBase

    def addNewBaseInitiative(row: InitiativeJSON) -> website.models.Initiative:
        title = row[RJK_TITLE][RJSK_RENDERED]
        slug = generateNewSlug(title, website.models.Initiative) # TODO: Ideally, we want to have the english version

        def getPhone() -> Union[str, None]:
            if 'phone_number' in row['acf']:
                phone_number = row['acf']['phone_number']
                if 'phone' in row['acf'] and row['acf']['phone'] != '':
                    phone = row['acf']['phone']
                    if (phone != phone_number):
                        logging.warn(f"Found inequal 'phone' {phone} and 'phone_number' {phone_number} entries for {title}.")
                return phone_number
            if 'phone' in row['acf']:
                return row['acf']['phone']
            return None

        def getImage() -> Union[Path, None]:
            TMP_IMAGE_FOLDER = TMP_FOLDER + "/images"
            os.makedirs(TMP_IMAGE_FOLDER, exist_ok=True)
            main_image_url = getImageUrl(row)
            if main_image_url == "":
                return None
            image_parts = main_image_url.split(".")
            file_extension = image_parts[-1]
            file_name = f"{slug}.{file_extension}"
            file_path = os.path.join(TMP_IMAGE_FOLDER, file_name)
            if not os.path.exists(file_path):
                subprocess.run(["curl", main_image_url, "-o", file_path], check=True)
            return Path(file_path)

        data_type_full_name = row[RJK_TYPE]
        region_name = data_type_full_name.split("_")[0]
        assert region_name in REGION_DATA_DICT.keys()

        region_obj = website.models.Region.objects.get(slug=region_name)
        phone = getPhone()
        mail = row['acf']['email']
        area = row['acf']['area']
        if area is None:
            area = ''
        if len(area)>64:
            logging.warn(f"Area for {title} is very long ({len(area)}>64 characters): {area}")
        online_only = row['acf']['online_only']
        if online_only is None:
            logging.critical(f"Online-only for {title} is undefined. Defaulting to not online only.")
            online_only = False
        if not mail is None:
            if len(mail)>127:
                logging.warn(f"Mail for {title} seems unreasonably long: '{mail}'")
        facebook = getFB(row)
        if not facebook is None:
            if len(facebook)>255:
                logging.warn(f"Facebook for {title} seems unreasonably long: '{facebook}' with length {len(facebook)}")
            if len(facebook)>1023:
                logging.critical(f"Facebook for {title} is too long: '{facebook}' with length {len(facebook)}")
        website_url = getHomepage(row)
        if not website_url is None:
            if len(website_url)>511:
                print(f"Homepage-URL for {title} seems unreasonably long: '{website_url}'")
        instagram = getInstagram(row)
        if not instagram is None:
            if len(instagram)>127:
                print(f"Instagram for {title} seems unreasonably long: '{instagram}'")
        if random.random() < 0.95:
            promote=False
        else:
            promote=True
        image_path = getImage()
        if image_path is not None:
            f = File(image_path.open(mode="rb"), name=image_path.name)
        else:
            f = None
        new_initiative_obj = website.models.Initiative(
            region=region_obj,
            main_image = f,
            slug=slug,
            mail=mail,
            phone=phone,
            homepage=website_url,
            instagram=instagram,
            facebook=facebook,
            state='p',
            needs_attention=False,
            promote=promote,
            online_only=online_only,
            area=area,
        )
        new_initiative_obj.save()

        missingSvTranslation.add(new_initiative_obj.slug)
        missingEnTranslation.add(new_initiative_obj.slug)
        return new_initiative_obj

    def addTranslationToInitiativeBase(row:InitiativeJSON, initiativeBase:website.models.Initiative) -> None:
        wp_post_id = row[RJK_ID]
        if RJK_LANG in row:
            lang_code = row[RJK_LANG]
        else:
            #for sjuhäräd
            lang_code = 'sv'
        lang_obj = create_languages(lang_code)
        title = row[RJK_TITLE][RJSK_RENDERED]
        afc = row[RJK_ACF]
        description = afc[RJSK_ACF_DESCRIPTION_ID]
        if description is None:
            annotateToHistory(initiativeBase, f"Description for {title} is None. Fixing it for now.")
            description = ''
        short_description = afc['short_description']
        if short_description is None:
            annotateToHistory(initiativeBase, f"Short description for {title} is None. Fixing it for now.")
            short_description = ''
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
            try:
                otherTitle = website.models.InitiativeTranslation.objects.get(sk3_id=wp_post_id)
                logging.info(f"Exakt translation for initiative {title} {wp_post_id} in lang {lang_code} was already present")
            except:
                otherTitle = website.models.InitiativeTranslation.objects.get(initiative=initiativeBase, language=lang_obj)
                logging.critical(f"Translation for initiative {title} {wp_post_id} in lang {lang_code} was already present. Bound to initiative {otherTitle.title} {otherTitle.sk3_id}")
        if lang_code == 'sv':
            missingSvTranslation.discard(initiativeBase.slug)
        elif lang_code == 'en':
            missingEnTranslation.discard(initiativeBase.slug)
        else:
            logging.critical(f"Unknown language code {lang_code}")
    logging.debug("============= entered function process_business_rows")
    initiativeBasesOfTranslations : Dict[str, website.models.Initiative] = {} # : {sk3TranslationId : sk4InitiativeBaseObj}
    initiativeBasesByMainImage : Dict[str, website.models.Initiative] = {}
    initiativeBasesByInstagram : Dict[str, website.models.Initiative] = {}
    initiativeBasesByFB : Dict[str, website.models.Initiative] = {}
    initiativeBasesByHomepage : Dict[str, website.models.Initiative] = {}

    missingEnTranslation : Set[str] = set([])
    missingSvTranslation : Set[str] = set([])

    for row in businessRows:
        checkRow(row)

        initiativeBase = createOrGetInitiativeBase(row)
        if RJK_LANG in row:
            lang_code = row[RJK_LANG]
            if lang_code == 'sv': # only take swedish tags for now
                linkTags(row, initiativeBase)
        else:
            linkTags(row, initiativeBase)
            annotateToHistory(initiativeBase, "[Critical Import] language annotation missing")
            
        addTranslationToInitiativeBase(row, initiativeBase)
    logging.warn(f"En translations missing for {missingEnTranslation}")
    logging.warn(f"Sv translations missing for {missingSvTranslation}")

def getImageUrl(row: InitiativeJSON):
    if RJSK_ACF_MAIN_IMAGE in row[RJK_ACF]:
        acfmi = row[RJK_ACF][RJSK_ACF_MAIN_IMAGE]
        if acfmi:
            return acfmi[RJSK_ACF_MAIN_IMAGE_URL]
    return ""

def getInstagram(row: InitiativeJSON):
    return row['acf']['instagram_username']

def checkRow(row: InitiativeJSON) -> None:
    resp_row_afc = row[RJK_ACF]
    description = resp_row_afc[RJSK_ACF_DESCRIPTION_ID]
    title = row[RJK_TITLE][RJSK_RENDERED]
    if not RJK_TRANSLATIONS in row:
        logging.warn(f"No translations for {title}?")

    if not description:
        logging.warning(f"WARNING: Description for {title} is empty")
        description = "-"
    if len(description) > 12000:
        logging.info(f"INFO: Description for {title} is very long: {len(description)} characters")

def getHomepage(row: InitiativeJSON):
    return row['acf']['website_url']

def getFB(row: InitiativeJSON):
    return row['acf']['facebook_url']

def importLocations(row:InitiativeJSON, initiativeObj: website.models.Initiative) -> None:
    data_type_full_name = row[RJK_TYPE]
    if RJK_ADDRESS_AND_COORDINATE in row:
        address_and_coordinate_list_or_bool = row[RJK_ADDRESS_AND_COORDINATE]
        if address_and_coordinate_list_or_bool:
            for aac_dict in address_and_coordinate_list_or_bool:
                latitude: str = aac_dict['latitude']
                if latitude[-1] == ',':
                    latitude = latitude[:-1]
                latitude = latitude.replace(',', '.')

                longitude: str = aac_dict['longitude']
                if longitude[-1] == '.' or latitude[-1] == '.':
                    longitude = longitude[:-1]
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
            logging.warning(f"WARNING: No location available for non-global initiative: {initiativeObj}")

def linkTags(row: InitiativeJSON, initiativeObj: website.models.Initiative) -> List[str]:
    all_tags_list: List[str] = []
    tags_list_or_bool: Literal[False] | List[str] = row[RJK_HUVUDTAGGAR]
    if tags_list_or_bool:  # ensures that this is not False or []
        all_tags_list.extend(tags_list_or_bool)
    tags_list_or_bool: Literal[False] | List[str] = row[RJK_TAGGAR]
    if tags_list_or_bool:  # ensures that this is not False or []
        all_tags_list.extend(tags_list_or_bool)
    tags_list_or_bool: Literal[False] | List[str] = row[RJK_SUBTAGGAR]
    if tags_list_or_bool:  # ensures that this is not False or []
        all_tags_list.extend(tags_list_or_bool)
    tags_list_or_bool: Literal[False] | List[str] = row[RJK_TRANSAKTIONSFORM]
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
