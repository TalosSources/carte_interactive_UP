# import json
import sys

import django.contrib.gis.geos
import requests

import website.models

"""
##########################
To start this script:
1. export NO_DOCKER=1
2. ./manage.py shell < migrate_from_sk3.py
##########################

REST and Python: Consuming APIs
https://realpython.com/api-integration-in-python/#rest-and-python-consuming-apis

Example API request:
https://reqbin.com/yoftqza4

"Manage Pods" page in WordPress:
https://sk-wp.azurewebsites.net/wp-admin/admin.php?page=pods
(Only available with WP login)

curl --header "Authorization: Bearer LbjFbvboclZd7bcjhNMkMJLl0SIv1Pe7" https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/oversattning/

"""

# RJK: Response JSON (Sub) Key

RJK_ID = "id"
RJK_DATE = "date"
RJK_SLUG = "slug"
RJK_TITLE = "title"
RJSK_RENDERED = "rendered"
RJK_ACF = "acf"  # -advanced custom fields (WP)
RJSK_SHORT_DESCRIPTION = "short_description"  # TODO
RJSK_DESCRIPTION = "description"
RJK_LATITUDE = "latitude"
RJK_LONGITUDE = "longitude"

# PER_PAGE = 0
PER_PAGE = 3
# FIELDS = []
FIELDS = [RJK_ID, RJK_DATE, RJK_SLUG, RJK_TITLE, RJK_ACF, RJK_LATITUDE, RJK_LONGITUDE]
# data_type = "global_business"
# See https://sk-wp.azurewebsites.net/wp-admin/admin.php?page=pods
ADDRESS_DT = "address"
PAGE_DT = "page"
BUSINESS_DT = "business"
GOTEBORG_R = "goteborg"
OVERSATTNING = "oversattning"
data_type_list = ["faq", ADDRESS_DT, PAGE_DT, BUSINESS_DT, "region", OVERSATTNING, "page_type", "tagg_grupp", "tagg"]
region_list = ["gavle", "global", GOTEBORG_R, "karlstad", "malmo", "sjuharad", "stockholm", "umea"]
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
        if data_type == OVERSATTNING:
            data_type = "translations"  # -specified in the WP Pods field "REST Base (if any)"
        data_type_full_name_list.append(data_type)
data_type_full_name_list.append("nonexisting")  # -for testing/verification purposes

bearer_token = "LbjFbvboclZd7bcjhNMkMJLl0SIv1Pe7"
header_dict = {"Authorization": f"Bearer {bearer_token}"}

for data_type_full_name in data_type_full_name_list:
    if data_type_full_name not in ("goteborg_business", "address_gbg",):
        # "address_gbg",
        continue

    page_nr = 1

    print(f"=== {data_type_full_name=} ===")
    api_url = f"https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/{data_type_full_name}/"
    if FIELDS:
        api_url += f"&_fields={','.join(FIELDS)}"
        # -documentation: https://developer.wordpress.org/rest-api/using-the-rest-api/global-parameters/#_fields
    if PER_PAGE:
        api_url += f"&per_page={PER_PAGE}&page={page_nr}"
        # -documentation: https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/
    api_url = api_url.replace('&', '?', 1)
    print(f"{api_url=}")

    response = requests.get(api_url, headers=header_dict)
    response_json = response.json()

    if response.status_code != 200:
        print(f"WARNING response code was not 200 --- {response.status_code=}")
        continue

    if FIELDS and RJK_ACF not in FIELDS:
        print(f"{response_json=}")
    print(f"Number of rows: {len(response_json)}")

    lowest_nr_of_cols = sys.maxsize
    highest_nr_of_cols = 0
    nr_of_cols = -1
    if response_json:
        for row in response_json:
            nr_of_cols = len(row)
            lowest_nr_of_cols = min(lowest_nr_of_cols, nr_of_cols)
            highest_nr_of_cols = max(highest_nr_of_cols, nr_of_cols)
        if lowest_nr_of_cols != highest_nr_of_cols:
            print("WARNING: The lowest_nr_of_cols per row and highest_nr_of_cols per row do not match")
            print(f"{lowest_nr_of_cols=}")
            print(f"{highest_nr_of_cols=}")
        else:
            print(f"{nr_of_cols=}")
    else:
        print("WARNING: No rows in response")

    for resp_row in response_json:
        title = resp_row[RJK_TITLE][RJSK_RENDERED]
        print(f"{title=}")
        if data_type_full_name == "goteborg_business":
            # TODO: Ensure that initiatives are added before locations

            description = resp_row[RJK_ACF][RJSK_DESCRIPTION]
            print(f"{description=}")
            # TODO: Use .objects.create to actually add to the db
            initiative = website.models.Initiative(
                name=title,
                description=description,
                online_only=False
            )
            print(f"Added initiative with {initiative.id=}")
            # -TODO: We may want to auto-generate the model in the future
        elif data_type_full_name == "address_gbg":
            latitude = resp_row[RJK_LATITUDE]
            print(f"{latitude=}")
            longitude = resp_row[RJK_LONGITUDE]
            print(f"{longitude=}")
            point = django.contrib.gis.geos.Point(float(longitude), float(latitude))
            # -please note order of lat and lng
            ref_initiative_id = 1
            ref_initiative = website.models.Initiative.objects.get(pk=ref_initiative_id)
            # TODO: Use .objects.create to actually add to the db
            location = website.models.Location(
                address=title,
                coordinates=point,
                initiative=ref_initiative
            )
            print(f"Added location with {location.id=}")
            # -TODO: We may want to auto-generate the model in the future
        else:
            raise NotImplementedError

print("===")
print(f"Total number of datatypes: {len(data_type_full_name_list)}")
