# import json
import logging
import sys

import django.contrib.gis.geos
import requests

import website.models

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

curl --header "Authorization: Bearer LbjFbvboclZd7bcjhNMkMJLl0SIv1Pe7" "https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/oversattning/"
(It's safest to always put the url within citation marks)

"""

# RJK: Response JSON (Sub) Key

RJK_ID = "id"  # -the WP post id
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
RJK_ADDRESS_AND_COORDINATE = "address_and_coordinate"
RJSK_ADDRESS_AND_COORDINATE_ID = "id"  # -another field called "ID" is also available, which has the same value AFAIK

STATUS_PUBLISH = "publish"

PER_PAGE = 100  # -max is 100: https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/
# FIELDS = []
FIELDS = [RJK_ID, RJK_STATUS, RJK_DATE, RJK_SLUG, RJK_TITLE, RJK_ACF, RJK_LATITUDE, RJK_LONGITUDE,
    RJK_ADDRESS_AND_COORDINATE]
# data_type = "global_business"
# See https://sk-wp.azurewebsites.net/wp-admin/admin.php?page=pods
ADDRESS_DT = "address"
PAGE_DT = "page"
BUSINESS_DT = "business"
GOTEBORG_R = "goteborg"
OVERSATTNING_DT = "oversattning"
GLOBAL_R = "global"
data_type_list = ["faq", ADDRESS_DT, PAGE_DT, BUSINESS_DT, "region", OVERSATTNING_DT, "page_type", "tagg_grupp", "tagg"]
region_list = ["gavle", GLOBAL_R, GOTEBORG_R, "karlstad", "malmo", "sjuharad", "stockholm", "umea"]
# göteborg, karlstad, etc
# Please note: address for Göteborg uses gbg instead
data_type_full_name_list = []
for data_type in data_type_list:
    if data_type == ADDRESS_DT:
        for region in region_list:
            if region == GOTEBORG_R:
                region = "gbg"
            data_type_full_name = f"{data_type}_{region}"
            data_type_full_name_list.append(data_type_full_name)
    elif data_type in (PAGE_DT, BUSINESS_DT):
        for region in region_list:
            data_type_full_name = f"{region}_{data_type}"
            data_type_full_name_list.append(data_type_full_name)
    else:
        if data_type == OVERSATTNING_DT:
            data_type = "translations"  # -specified in the WP Pods field "REST Base (if any)"
        data_type_full_name_list.append(data_type)
data_type_full_name_list.append("non-existing")  # -for testing/verification purposes

bearer_token = "LbjFbvboclZd7bcjhNMkMJLl0SIv1Pe7"
header_dict = {"Authorization": f"Bearer {bearer_token}"}

nr_added = 0
nr_skipped = 0

for data_type_full_name in data_type_full_name_list:
    if ADDRESS_DT not in data_type_full_name and BUSINESS_DT not in data_type_full_name:
        continue
    """
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
                logging.warning("WARNING: The lowest_nr_of_cols per row and highest_nr_of_cols per row do not match")
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
            if status != STATUS_PUBLISH:
                logging.info(f"INFO: {status=}")
                continue

            existing_obj = None

            if ADDRESS_DT in data_type_full_name:
                try:
                    existing_obj = website.models.Location.objects.get(sk3_id=wp_post_id)
                except website.models.Location.DoesNotExist:
                    pass

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

                if existing_obj is not None:
                    nr_skipped += 1
                else:
                    new_obj.save()
                    nr_added += 1

                logging.debug(f"{title=}")
            elif BUSINESS_DT in data_type_full_name:
                try:
                    existing_obj = website.models.Initiative.objects.get(sk3_id=wp_post_id)
                except website.models.Initiative.DoesNotExist:
                    pass

                description = resp_row[RJK_ACF][RJSK_ACF_DESCRIPTION_ID]
                logging.debug(f"{description=}")
                if not description:
                    logging.warning(f"WARNING: Description for {title} is empty")
                    description = "-"
                if len(description) > 12000:
                    logging.info(f"INFO: Description for {title} is very long: {len(description)} characters")
                new_obj = website.models.Initiative(
                    sk3_id=wp_post_id,
                    title=title,
                    description=description
                )

                if existing_obj is not None:
                    nr_skipped += 1
                else:
                    new_obj.save()
                    nr_added += 1

                # logging.debug(f"Added initiative with {initiative.id=}")
                logging.debug(f"{type(resp_row)=}")
                if RJK_ADDRESS_AND_COORDINATE in resp_row:
                    address_and_coordinate_list_or_bool = resp_row[RJK_ADDRESS_AND_COORDINATE]
                    # print(f"{type(address_and_coordinate_list)=}")
                    if type(address_and_coordinate_list_or_bool) is bool and not address_and_coordinate_list_or_bool:
                        # This means that the initiative has no locations
                        continue
                    for aac_dict in address_and_coordinate_list_or_bool:
                        # Address comes first, so we can connect here (and don't have to save until later)
                        location_id = aac_dict[RJSK_ADDRESS_AND_COORDINATE_ID]
                        location = website.models.Location.objects.get(sk3_id=location_id)
                        # -only works when added to db, so will not work during testing
                        location.initiative = new_obj
                        location.save()
                else:
                    if GLOBAL_R not in data_type_full_name:
                        logging.warning(f"WARNING: No location available for initiative: {new_obj.title}")
            else:
                logging.info(f"INFO: Case (data type) not covered: {data_type_full_name=}. Continuing")
                continue

        page_nr += 1

logging.info(f"{nr_added=}")
logging.info(f"{nr_skipped=}")
logging.debug(f"Total number of datatypes: {len(data_type_full_name_list)}")
