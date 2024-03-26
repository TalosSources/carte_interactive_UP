import logging
import random
import os
import subprocess
from pathlib import Path
from typing import Iterable, Union, List

from django.core.files import File
import django.contrib.gis.geos

import website.models
from website.management.commands.importing.SK3Api import InitiativeJSON, getAllDataOf, getFB, getHomepage, getImageUrl, getInstagram, getLangCode, getRegion
from website.management.commands.importing.RegionData import REGION_DATA_DICT
from website.management.commands.importing.SK3Api import TMP_FOLDER
from website.management.commands.importing.common import annotateToHistory, create_languages, generateNewSlug
from website.management.commands.importing.InitiativeTranslationMatching import InitiativeTranslationMatching


#BUSINESS_DT = "business"
#RJK_ID = "id"  # -the WP post id
#RJK_TITLE = "title"
#RJSK_RENDERED = "rendered"
#RJK_TRANSLATIONS = "translations"
#RJK_TYPE = "type"
#RJK_LANG = "lang"

#RJK_HUVUDTAGGAR = "huvudtaggar"
#RJK_SUBTAGGAR = "subtaggar"
#RJK_TRANSAKTIONSFORM = "transaktionsform"
#RJK_TAGGAR = "taggar"

#RJK_ADDRESS_AND_COORDINATE = "address_and_coordinate"
#RJSK_ADDRESS_AND_COORDINATE_ID = "id"  # -another field called "ID" is also available, which has the same value AFAIK
#GLOBAL_R = "global"

def createOrGetInitiativeBase(thisTranslationSK3: InitiativeJSON, initiativeTranslationMatching: InitiativeTranslationMatching) -> website.models.Initiative:
    initiativeBase = initiativeTranslationMatching.findInitiativeBaseFor(thisTranslationSK3)
    if initiativeBase is None:
        initiativeBase = addNewBaseInitiative(thisTranslationSK3)
        importLocations(thisTranslationSK3, initiativeBase)
        initiativeTranslationMatching.registerInitiativeBase(initiativeBase, thisTranslationSK3)
    return initiativeBase

def importInitiatives(region : str):
    data_type_full_name = f"{region}_business"
    initiativeData : Iterable[InitiativeJSON]= getAllDataOf(data_type_full_name)
    process_business_rows(initiativeData)

def addNewBaseInitiative(row: InitiativeJSON) -> website.models.Initiative:
    title = row["title"]["rendered"]
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

    region_name = getRegion(row)
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
    return new_initiative_obj

def addTranslationToInitiativeBase(row:InitiativeJSON, initiativeBase:website.models.Initiative) -> None:
    wp_post_id = row["id"]
    lang_code = getLangCode(row)
    lang_obj = create_languages(lang_code)
    title = row["title"]["rendered"]
    afc = row["acf"]
    description = afc["description"]
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

def process_business_rows(businessRows: Iterable[InitiativeJSON]) -> None:
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
    logging.debug("============= entered function process_business_rows")
    initiativeTranslationMatching = InitiativeTranslationMatching()

    for row in businessRows:
        checkRow(row)

        initiativeBase = createOrGetInitiativeBase(row, initiativeTranslationMatching)
        if "lang" in row:
            lang_code = row["lang"]
            if lang_code == 'sv': # only take swedish tags for now
                linkTags(row, initiativeBase)
        else:
            linkTags(row, initiativeBase)
            annotateToHistory(initiativeBase, "[Critical Import] language annotation missing")
        initiativeTranslationMatching.foundTranslation(initiativeBase, row)    
        addTranslationToInitiativeBase(row, initiativeBase)
    logging.warn(f"En translations missing for {initiativeTranslationMatching.missingTranslations['en']}")
    logging.warn(f"Sv translations missing for {initiativeTranslationMatching.missingTranslations['sv']}")

def checkRow(row: InitiativeJSON) -> None:
    resp_row_afc = row["acf"]
    description = resp_row_afc["description"]
    title = row["title"]["rendered"]
    if not "translations" in row:
        logging.warn(f"No translations for {title}?")

    if not description:
        logging.warning(f"WARNING: Description for {title} is empty")
        description = "-"
    if len(description) > 12000:
        logging.info(f"INFO: Description for {title} is very long: {len(description)} characters")

def importLocations(row:InitiativeJSON, initiativeObj: website.models.Initiative) -> None:
    if "address_and_coordinate" in row:
        address_and_coordinate_list_or_bool = row["address_and_coordinate"]
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
        if getRegion(row) != "global":
            logging.warning(f"WARNING: No location available for non-global initiative: {initiativeObj}")

def linkTags(row: InitiativeJSON, initiativeObj: website.models.Initiative) -> List[str]:
    all_tags_list: List[str] = []
    tags_list_or_bool = row["huvudtaggar"]
    if tags_list_or_bool:  # ensures that this is not False or []
        all_tags_list.extend(tags_list_or_bool)
    tags_list_or_bool = row["taggar"]
    if tags_list_or_bool:  # ensures that this is not False or []
        all_tags_list.extend(tags_list_or_bool)
    tags_list_or_bool = row["subtaggar"]
    if tags_list_or_bool:  # ensures that this is not False or []
        all_tags_list.extend(tags_list_or_bool)
    tags_list_or_bool = row["transaktionsform"]
    if tags_list_or_bool:  # ensures that this is not False or []
        all_tags_list.extend(tags_list_or_bool)
    logging.debug(f"{len(all_tags_list)=}")
    for tag_title in all_tags_list:
        try:
            tag = website.models.Tag.objects.get(title=tag_title)
            initiativeObj.tags.add(tag) # type: ignore
        except:
            logging.critical(f"Failure when loading tag {tag_title}")
    return all_tags_list
