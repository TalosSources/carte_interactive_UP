# import json
import sys

import requests

import website.models

# os.environ.setdefault("NO_DOCKER", "1")
"""
##########################
To start this script:
1. export NO_DOCKER=1
2. ./manage.py shell < migrate_from_sk3.py
##########################

REST and Python: Consuming APIs
https://realpython.com/api-integration-in-python/#rest-and-python-consuming-apis


curl --header "Authorization: Bearer LbjFbvboclZd7bcjhNMkMJLl0SIv1Pe7" https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/oversattning/

"""

# RJK: Response JSON (sub) Key
RJK_TITLE = "title"
RJSK_RENDERED = "rendered"
RJK_ACF = "acf"  # -advanced custom fields (WP)
RJSK_SHORT_DESCRIPTION = "short_description"

# FIELDS = ["id", "date", "slug"]
FIELDS = []
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
    if data_type_full_name not in ("goteborg_business",):
        # "address_gbg",
        continue

    print(f"=== {data_type_full_name=} ===")
    api_url = f"https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/{data_type_full_name}/"
    if FIELDS:
        api_url += f"?_fields={','.join(FIELDS)}"
    print(f"{api_url=}")

    response = requests.get(api_url, headers=header_dict)
    response_json = response.json()

    if response.status_code != 200:
        print(f"WARNING response code was not 200 --- {response.status_code=}")
        continue

    print(f"{response_json=}")
    print(f"Number of rows: {len(response_json)}")

    lowest_nr_of_cols = sys.maxsize
    highest_nr_of_cols = 0
    nr_of_cols = -1
    # {"code":"rest_no_route","message":"No route was found matching the URL and request method.","data":{"status":404}}
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
        description = resp_row[RJK_ACF][RJSK_SHORT_DESCRIPTION]
        print(f"{title=}")
        print(f"{description=}")
        initiative = website.models.Initiative.objects.create(
            name=title,
            description=description,
            online_only=False
        )
        # -TODO: We may want to auto-generate the model in the future

print("===")
print(f"Total number of datatypes: {len(data_type_full_name_list)}")
