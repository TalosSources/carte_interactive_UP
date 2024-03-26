import logging
import random
import os
import subprocess
from pathlib import Path
from typing import Iterable, Union, List

from django.core.files import File
import django.contrib.gis.geos

import website.models
from website.management.commands.importing.SK3Api import InitiativeJSON, getAllDataOf, getFB, getHomepage, getImageUrl, getInstagram, getLangCode, getRegion, getTitle
from website.management.commands.importing.RegionData import REGION_DATA_DICT
from website.management.commands.importing.SK3Api import TMP_FOLDER
from website.management.commands.importing.common import ImportLogger, create_languages, generateNewSlug
from website.management.commands.importing.InitiativeTranslationMatching import InitiativeTranslationMatching, TranslationGroup

def groupTranslations(translations: Iterable[InitiativeJSON], logger: ImportLogger) -> List[TranslationGroup]:
    grouped_translations: List[TranslationGroup] = []
    initiativeTranslationMatching = InitiativeTranslationMatching()

    for translation in translations:
        translationGroup = initiativeTranslationMatching.findInitiativeBaseFor(translation, logger)
        if translationGroup is None:
            translationGroup: TranslationGroup | None= {'history': "", 'translations': {}}
            logger.setContext(translationGroup)
            grouped_translations.append(translationGroup)
            initiativeTranslationMatching.registerInitiativeBase(translationGroup, translation, logger)
        logger.setContext(translationGroup)
        langCode = getLangCode(translation)
        if langCode in translationGroup['translations']:
            logger.criticalToDeveloper(f"Found second translation of language {langCode} for initiative {getTitle(translation)}. This hints for a false positive in the matching.")
            logger.criticalToDeveloper(f"Already there:\n{translationGroup['translations'][langCode]}")
            logger.criticalToDeveloper(f"Incoming:\n{translation}")
        else:
            translationGroup['translations'][langCode] = translation
        logger.removeContext()
    return grouped_translations

def tryFindInitiativeBase(translationGroup : TranslationGroup) -> website.models.Initiative | None:
    initiativeBase = None
    for langCode in translationGroup['translations']:
        try:
            translation = translationGroup['translations'][langCode]
            r = website.models.InitiativeTranslation.objects.get(sk3_id=translation['id']).initiative
            if initiativeBase is None:
                initiativeBase = r
            else:
                if r != initiativeBase:
                    logging.critical(f"While looking for an already existing initiativeBase in the DB, we found more than one for {getTitle(translation)}")
        except:
            pass
    return initiativeBase

def checkForMissingTranslations(initiative: TranslationGroup, logger: ImportLogger):
    if 'en' not in initiative['translations']:
        logger.logToCurator('[Import] No english translation found.')
    if 'sv' not in initiative['translations']:
        logger.logToCurator('[Import] No swedish translation found.')

def getReferenceTranslation(initiative: TranslationGroup) -> InitiativeJSON:
    if 'en' in initiative['translations']:
        return initiative['translations']['en']
    elif 'sv' in initiative['translations']:
        return initiative['translations']['sv']
    raise Exception("TranslationGroup without translation found.")

def importInitiatives(region : str):
    logger = ImportLogger()
    # 1. Downloading data
    data_type_full_name = f"{region}_business"
    businessRows : Iterable[InitiativeJSON]= getAllDataOf(data_type_full_name)

    # 2. Grouping initiatives
    groupedTranslations = groupTranslations(businessRows, logger)

    # 3. For each initiative
    # - find or create base
    # - create locations
    # - link tags
    # - find or create translations
    # - report missing translations
    # - take over history

    for initiative in groupedTranslations:
        logger.setContext(initiative)
        referenceTranslation = getReferenceTranslation(initiative)
        initiativeBase = tryFindInitiativeBase(initiative)
        if initiativeBase is None:
            initiativeBase = addNewBaseInitiative(referenceTranslation, logger)
            importLocations(referenceTranslation, initiativeBase, logger)
            linkTags(referenceTranslation, initiativeBase)
            if "lang" not in referenceTranslation:
                logger.logToCurator("[Import] Language guessed as language annotation was missing.")
        for langCode in initiative['translations']:
            translation = initiative['translations'][langCode]
            checkRow(translation, logger)
            addTranslationToInitiativeBase(translation, initiativeBase, logger)
        logger.removeContext()
        logger.setContext(initiativeBase)
        logger.logToCurator(initiative['history'])
        checkForMissingTranslations(initiative, logger)
        logger.removeContext()

def addNewBaseInitiative(row: InitiativeJSON, logger: ImportLogger) -> website.models.Initiative:
    title = row["title"]["rendered"]
    slug = generateNewSlug(title, website.models.Initiative) # TODO: Ideally, we want to have the english version

    def getPhone() -> Union[str, None]:
        if 'phone_number' in row['acf']:
            phone_number = row['acf']['phone_number']
            if 'phone' in row['acf'] and row['acf']['phone'] != '':
                phone = row['acf']['phone']
                if (phone != phone_number):
                    logger.logToCurator(f"Found inequal 'phone' {phone} and 'phone_number' {phone_number} entries for {title}.")
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
        logger.logToCurator(f"Area for {title} is very long ({len(area)}>64 characters): {area}")
    online_only = row['acf']['online_only']
    if online_only is None:
        logger.logToCurator(f"Online-only for {title} is undefined. Defaulting to not online only.")
        online_only = False
    if not mail is None:
        if len(mail)>127:
            logger.logToCurator(f"Mail for {title} seems unreasonably long: '{mail}'")
    facebook = getFB(row)
    if not facebook is None:
        if len(facebook)>255:
            logger.logToCurator(f"Facebook for {title} seems unreasonably long: '{facebook}' with length {len(facebook)}")
        if len(facebook)>1023:
            logger.logToCurator(f"Facebook for {title} is too long: '{facebook}' with length {len(facebook)}")
    website_url = getHomepage(row)
    if not website_url is None:
        if len(website_url)>511:
            logger.logToCurator(f"Homepage-URL for {title} seems unreasonably long: '{website_url}'")
    instagram = getInstagram(row)
    if not instagram is None:
        if len(instagram)>127:
            logger.logToCurator(f"Instagram for {title} seems unreasonably long: '{instagram}'")
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

def addTranslationToInitiativeBase(row:InitiativeJSON, initiativeBase:website.models.Initiative, logger: ImportLogger) -> None:
    wp_post_id = row["id"]
    lang_code = getLangCode(row)
    lang_obj = create_languages(lang_code)
    title = getTitle(row)
    afc = row["acf"]
    description = afc["description"]
    if description is None:
        logger.logToCurator(f"Description for {title} is None. Fixing it for now.")
        description = ''
    short_description = afc['short_description']
    if short_description is None:
        logger.logToCurator(f"Short description for {title} is None. Fixing it for now.")
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
            #logging.info(f"Exakt translation for initiative {title} {wp_post_id} in lang {lang_code} was already present")
        except:
            otherTitle = website.models.InitiativeTranslation.objects.get(initiative=initiativeBase, language=lang_obj)
            logging.critical(f"Translation for initiative {title} {wp_post_id} in lang {lang_code} was already present. Bound to initiative {otherTitle.title} {otherTitle.sk3_id}")


def checkRow(row: InitiativeJSON, logger: ImportLogger) -> None:
    resp_row_afc = row["acf"]
    title = row["title"]["rendered"]
    description = resp_row_afc["description"]
    if not description:
        logger.logToCurator(f"WARNING: Description for {title} is empty")
        description = "-"
    if len(description) > 12000:
        logger.logToCurator(f"INFO: Description for {title} is very long: {len(description)} characters")

def importLocations(row:InitiativeJSON, initiativeObj: website.models.Initiative, logger: ImportLogger) -> None:
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
            logger.logToCurator(f"WARNING: No location available for non-global initiative: {initiativeObj}")

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
    for tag_title in all_tags_list:
        try:
            tag = website.models.Tag.objects.get(title=tag_title)
            initiativeObj.tags.add(tag) # type: ignore
        except:
            pass
            #logging.critical(f"Failure when loading tag {tag_title}")
    return all_tags_list
