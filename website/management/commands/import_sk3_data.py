# import json
import logging
import sys

import django.contrib.gis.geos
import django.core.management.base
import django.db
# import django.core.management
import requests

import website.models

logging.basicConfig(level=logging.DEBUG)

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

DATA_TYPE_LIST = [
    "faq", ADDRESS_DT, PAGE_DT, BUSINESS_DT, REGION_DT, OVERSATTNING_DT, "page_type", "tagg_grupp", TAGG_DT]
REGION_LIST = ["gavle", GLOBAL_R, GOTEBORG_R, "karlstad", "malmo", "sjuharad", "stockholm", "umea"]
REGION_NAMES = {
    "gavle": "Gävle",
    "goteborg": "Göteborg",
    "karlstad": "Karlstad",
    "malmo": "Malmö",
    "sjuharad": "Sjuhärad",
    "stockholm": "Stockholm",
    "umea": "Umeå",
    "global": "Hela Sverige"
}

# Contains sub-lists on this format: [sk3_id_en, sk3_id_sv], where the order of langs is undetermined
# business_lang_combos_list = []

business_resp_row_list = []
tagg_resp_row_list = []


def import_sk3_data(i_args: [str]):
    # göteborg, karlstad, etc
    # Please note: address for Göteborg uses gbg instead
    data_type_full_name_list = []
    for data_type in DATA_TYPE_LIST:
        if data_type == ADDRESS_DT:
            for region in REGION_LIST:
                if region == GOTEBORG_R:
                    region = "gbg"
                data_type_full_name = f"{data_type}_{region}"
                data_type_full_name_list.append(data_type_full_name)
        elif data_type in (PAGE_DT, BUSINESS_DT):
            for region in REGION_LIST:
                data_type_full_name = f"{region}_{data_type}"
                data_type_full_name_list.append(data_type_full_name)
        else:
            if data_type == OVERSATTNING_DT:
                data_type = "translations_comparison"  # -specified in the WP Pods field "REST Base (if any)"
            data_type_full_name_list.append(data_type)
    data_type_full_name_list.append("non-existing")  # -for testing/verification purposes

    assert REGION_DT in data_type_full_name_list
    data_type_full_name_list.remove(REGION_DT)
    data_type_full_name_list.insert(0, REGION_DT)

    bearer_token = "LbjFbvboclZd7bcjhNMkMJLl0SIv1Pe7"
    header_dict = {"Authorization": f"Bearer {bearer_token}"}

    nr_added = 0
    nr_skipped = 0

    for data_type_full_name in data_type_full_name_list:
        # ################ FILTERING ################
        if data_type_full_name not in ("goteborg_business", "address_gbg", REGION_DT, TAGG_DT,):
            # "goteborg_business", "address_gbg", REGION_DT, TAGG_DT,
            continue
        """
        if ADDRESS_DT not in data_type_full_name and BUSINESS_DT not in data_type_full_name:
            continue
        DATA_TYPE_FILTER: list = []
        if DATA_TYPE_FILTER and data_type_full_name not in DATA_TYPE_FILTER:
            continue
        if BUSINESS_DT not in data_type_full_name:
            continue
        if ADDRESS_DT not in data_type_full_name and BUSINESS_DT not in data_type_full_name:
            continue
        if data_type_full_name not in ("goteborg_business", "address_gbg",):
            continue
        """
        logging.info(f"=== {data_type_full_name=} ===")

        page_nr = 1
        while True:
            logging.debug(f"Page nr: {page_nr}")
            api_url = f"https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/{data_type_full_name}/"
            if FIELDS:
                api_url += f"&_fields={','.join(FIELDS)}"
                # -documentation: https://developer.wordpress.org/rest-api/using-the-rest-api/global-parameters/#_fields
            if PER_PAGE:
                api_url += f"&per_page={PER_PAGE}&page={page_nr}"
                # -documentation: https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/
            api_url = api_url.replace('&', '?', 1)
            logging.debug(f"{api_url=}")

            response = requests.get(api_url, headers=header_dict)
            response_json = response.json()  # -can be a list or a dict
            if type(response_json) is dict and response_json.get("code", "") == "rest_post_invalid_page_number":
                logging.info(f"No more data found for {page_nr=} Exiting while loop")
                break

            if response.status_code != 200:
                logging.warning(f"WARNING response code was not 200 --- {response.status_code=}")
                break

            if FIELDS and RJK_ACF not in FIELDS:
                logging.info(f"{response_json=}")
            logging.debug(f"Number of rows: {len(response_json)}")

            lowest_nr_of_cols = sys.maxsize
            highest_nr_of_cols = 0
            nr_of_cols = -1
            if response_json:
                for row in response_json:
                    nr_of_cols = len(row)
                    lowest_nr_of_cols = min(lowest_nr_of_cols, nr_of_cols)
                    highest_nr_of_cols = max(highest_nr_of_cols, nr_of_cols)
                if lowest_nr_of_cols != highest_nr_of_cols:
                    logging.warning(
                        "WARNING: The lowest_nr_of_cols per row and highest_nr_of_cols per row do not match")
                    logging.info(f"{lowest_nr_of_cols=}")
                    logging.info(f"{highest_nr_of_cols=}")
                else:
                    pass
                    logging.debug(f"{nr_of_cols=}")
            else:
                logging.warning("WARNING: No rows in response")
                break

            for resp_row in response_json:
                wp_post_id = resp_row[RJK_ID]
                title = resp_row[RJK_TITLE][RJSK_RENDERED]
                status = resp_row[RJK_STATUS]
                # TODO: move all except wp_post_id down to the places where they are used

                try:
                    existing_obj = website.models.Region.objects.get(sk3_id=wp_post_id)
                    nr_skipped += 1
                    continue
                except website.models.Region.DoesNotExist:
                    existing_obj = None

                if status != STATUS_PUBLISH:
                    logging.info(f"INFO: {status=}")
                    continue

                if REGION_DT in data_type_full_name:
                    lang_code = resp_row[RJK_LANGUAGE_CODE]
                    if lang_code != "sv":
                        # -this is not because we want Swedish, but because we want the minimal slug
                        # -TODO: In the future we want this translated (so not skipping)
                        continue
                    new_obj = website.models.Region(
                        sk3_id=wp_post_id,
                        slug=resp_row[RJK_SLUG],
                        welcome_message_html=resp_row[RJK_WELCOME_MESSAGE],
                        title=REGION_NAMES[resp_row[RJK_SLUG]]
                    )
                    if existing_obj is not None:
                        nr_skipped += 1
                    else:
                        new_obj.save()
                        nr_added += 1

                elif ADDRESS_DT in data_type_full_name:
                    latitude: str = resp_row[RJK_LATITUDE]
                    latitude = latitude.replace(',', '.')
                    longitude: str = resp_row[RJK_LONGITUDE]
                    longitude = longitude.replace(',', '.')
                    geo_point = django.contrib.gis.geos.Point(float(longitude), float(latitude))
                    # -please note order of lat and lng
                    new_obj = website.models.Location(
                        sk3_id=wp_post_id,
                        title=title,
                        coordinates=geo_point
                    )
                    new_obj.save()
                    nr_added += 1
                    # logging.debug(f"{title=}")
                elif BUSINESS_DT in data_type_full_name:
                    business_resp_row_list.append(resp_row)
                elif TAGG_DT == data_type_full_name:
                    tagg_resp_row_list.append(resp_row)
                else:
                    logging.info(f"INFO: Case (data type) not covered: {data_type_full_name=}. Continuing")
                    continue
            page_nr += 1
    process_tagg_rows()
    process_business_rows()
    clear_unused_tags_from_db()
    # logging.info(f"{nr_added=}")
    # logging.info(f"{nr_skipped=}")
    logging.debug(f"Total number of datatypes: {len(data_type_full_name_list)}")


LANG_CODE_EN = "en"
LANG_CODE_SV = "sv"


def clear_unused_tags_from_db():
    for tag_obj in website.models.Tag.objects.all():
        count = 0
        tag_obj: website.models.Tag
        logging.info(f"{tag_obj.title=}")
        for initiative_obj in website.models.Initiative.objects.all():
            if tag_obj in initiative_obj.tags.all():
                count += 1
        logging.info(f"{count=}")
        if count == 0:
            tag_obj.delete()


def process_business_rows():
    """
    "translations": {
      "en": 11636,
      "sv": 11629
    },

    This function relies on the fact that:
    the resp_row for en always has a higher sk3id than for sv
    """
    logging.debug("============= entered function process_business_rows")
    nr_added = 0
    # business_resp_row_list_copy = business_resp_row_list.copy()
    translations_for_added_posts_dict_list = []

    business_resp_row_list_reversed = list(reversed(business_resp_row_list))  # -so sv comes first
    logging.debug(f"{len(business_resp_row_list_reversed)=}")
    """
    for resp_row in business_resp_row_list_reversed:
        translations_dict = resp_row[RJK_TRANSLATIONS]
        translations_dict_list.append(translations_dict)  # -will contain duplicates
    """
    for resp_row in business_resp_row_list_reversed:
        wp_post_id = resp_row[RJK_ID]
        lang_code = resp_row[RJK_LANG]
        logging.debug(f"{wp_post_id=}, {lang_code=}")
        title = resp_row[RJK_TITLE][RJSK_RENDERED]
        status = resp_row[RJK_STATUS]
        data_type_full_name = resp_row[RJK_TYPE]

        description = resp_row[RJK_ACF][RJSK_ACF_DESCRIPTION_ID]

        translations_dict = resp_row[RJK_TRANSLATIONS]

        # if sk3id in translations_dict[others]
        # wp_post_id

        if LANG_CODE_SV not in translations_dict:
            logging.warning(f"Missing Swedish translation for {wp_post_id=}")
        if LANG_CODE_EN not in translations_dict:
            logging.warning(f"Missing English translation for {wp_post_id=}")

        first_translation_has_been_added = False
        first_translation_wp_post_id = -1
        for translation_for_added_post_dict in translations_for_added_posts_dict_list:
            translation_for_added_post_dict: dict
            for lng_code_, sk3_id_ in translation_for_added_post_dict.items():
                if sk3_id_ == wp_post_id:
                    logging.debug(f"{translation_for_added_post_dict=}")
                    first_translation_has_been_added = True
                else:
                    first_translation_wp_post_id = sk3_id_
            if first_translation_has_been_added:
                break
        if first_translation_has_been_added:
            assert first_translation_wp_post_id != -1
            old_obj = website.models.Initiative.objects.get(sk3_id=first_translation_wp_post_id)
            new_title_obj = website.models.InitiativeTitleText(
                sk3_id=wp_post_id,
                language_code=lang_code,
                text=title,
                initiative=old_obj
            )
            new_title_obj.save()
            new_description_obj = website.models.InitiativeDescriptionText(
                sk3_id=wp_post_id,
                language_code=lang_code,
                text=description,
                initiative=old_obj
            )
            new_description_obj.save()

            continue

        if not description:
            logging.warning(f"WARNING: Description for {title} is empty")
            description = "-"
        if len(description) > 12000:
            logging.info(f"INFO: Description for {title} is very long: {len(description)} characters")
        region_name = data_type_full_name.split("_")[0]
        assert region_name in REGION_LIST

        region_obj = website.models.Region.objects.get(slug=region_name)
        new_initiative_obj = website.models.Initiative(
            sk3_id=wp_post_id,
            region=region_obj
        )
        logging.debug(f"Saving Initiative object for {wp_post_id=}")
        new_initiative_obj.save()
        translations_for_added_posts_dict_list.append(translations_dict)
        nr_added += 1
        # logging.debug(f"Added initiative with {initiative.id=}")

        new_title_obj = website.models.InitiativeTitleText(
            sk3_id=wp_post_id,
            language_code=lang_code,
            text=title,
            initiative=new_initiative_obj
        )
        new_title_obj.save()
        new_description_obj = website.models.InitiativeDescriptionText(
            sk3_id=wp_post_id,
            language_code=lang_code,
            text=description,
            initiative=new_initiative_obj
        )
        new_description_obj.save()

        if RJK_ADDRESS_AND_COORDINATE in resp_row:
            address_and_coordinate_list_or_bool = resp_row[RJK_ADDRESS_AND_COORDINATE]
            # print(f"{type(address_and_coordinate_list)=}")
            if type(address_and_coordinate_list_or_bool) is bool and not address_and_coordinate_list_or_bool:
                # This means that the initiative has no locations
                continue
            for aac_dict in address_and_coordinate_list_or_bool:
                # Address comes first, so we can connect here (and don't have to save until later)
                location_id = aac_dict[RJSK_ADDRESS_AND_COORDINATE_ID]
                try:
                    location = website.models.Location.objects.get(sk3_id=location_id)
                    # -only works when added to db, so will not work during testing
                except website.models.Location.DoesNotExist:
                    logging.error(f"Location doesn't exist for sk3_id '{location_id}'")
                    sys.exit()
                location.initiative = new_initiative_obj
                location.save()
        else:
            if GLOBAL_R not in data_type_full_name:
                logging.warning(f"WARNING: No location available for initiative: {new_initiative_obj}")

        all_tags_list = []
        for rjk in [RJK_HUVUDTAGGAR, RJK_TAGGAR, RJK_SUBTAGGAR, RJK_TRANSAKTIONSFORM]:
            tags_list_or_bool = resp_row[rjk]
            if tags_list_or_bool:  # ensures that this is not False or []
                all_tags_list.extend(tags_list_or_bool)
        logging.debug(f"{len(all_tags_list)=}")
        for tag_title in all_tags_list:
            tag_title: str
            tag = website.models.Tag.objects.get(title=tag_title)
            new_initiative_obj.tags.add(tag)

    # return nr_added
    logging.info(f"{nr_added=}")


tagg_dict = {}
"""
tagg_dict uses this format:
{
title: slug
}
"""


def process_tagg_rows():
    logging.debug("============= entered function process_tagg_rows")
    nr_of_duplicates = 0
    logging.debug(f"{len(tagg_resp_row_list)=}")
    for resp_row in tagg_resp_row_list:
        title = resp_row[RJK_TITLE][RJSK_RENDERED]
        slug = resp_row[RJK_SLUG]
        wp_post_id = resp_row[RJK_ID]

        if title in tagg_dict.keys():
            nr_of_duplicates += 1
            if len(slug) < len(tagg_dict[title]):
                tagg_dict[title] = slug
            continue
        else:
            tagg_dict[title] = slug

    logging.debug(f"{nr_of_duplicates=}")
    logging.debug(f"{len(tagg_dict)=}")

    for tag_title in tagg_dict.keys():
        new_obj = website.models.Tag(
            slug=tagg_dict[tag_title],
            title=tag_title
        )
        new_obj.save()


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
            result_text = input("Are you sure you want to delete the whole database? (y/n)")
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
