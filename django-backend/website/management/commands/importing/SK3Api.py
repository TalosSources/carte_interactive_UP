import os
import json

from typing import Any, List, Dict, NotRequired, TypedDict, Literal

import requests
import logging

# -max is 100: https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/
PER_PAGE = 100
#STATUS_PUBLISH = "publish"
#RJK_STATUS = "status"

FIELDS : List[str] = []

PublishableT = TypedDict('PublishableT', {
    'status': str,
})
TitleType = TypedDict('TitleType', {'rendered': str})

TagRow = TypedDict('TagRow', {
    'slug': str,
    'title': TitleType,
})

MainImageType = TypedDict('MainImageType', {'url': str})
AcfType = TypedDict('AcfType', {'phone': str,
                             'email': str | None,
                             'area': str | None,
                             'phone_number': str,
                             'online_only': bool | None,
                             'description': str | None,
                             'short_description': str | None,
                             'main_image': NotRequired[Literal[False] | MainImageType],
                             'instagram_username': str | None,
                             'website_url': str | None,
                             'facebook_url': str | None,
                   })
AddressAndCoordinateType=TypedDict('AddressAndCoordinateType', {'latitude': str, 'longitude':str,'post_title':str})
InitiativeJSON = TypedDict('InitiativeJSON', {
        'status': str,
        'type': str,
        'title': TitleType,
        'id': str,
        'translations': NotRequired[dict[str, str]],
        'acf': AcfType,
        'address_and_coordinate': NotRequired[Literal[False] | List[AddressAndCoordinateType]],
        'huvudtaggar': List[str] | Literal[False],
        'taggar': List[str] | Literal[False],
        'subtaggar': List[str] | Literal[False],
        'transaktionsform': List[str] | Literal[False],
        'lang': NotRequired[Literal['sv'] | Literal['en']],
    })

class InitiativeJSON(InitiativeJSON, PublishableT):
    pass

class TagRow(TagRow, PublishableT):
    pass

TMP_FOLDER = "./cache"
def requestSK3API(data_type_full_name:str, per_page:int|None=None, fields:List[str]|None=None, page_nr:int|None=None) -> Any:
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
    if type(response_json) is dict and response_json.get("code", "") == "rest_post_invalid_page_number": # type: ignore
        logging.debug(f"No more data found for {page_nr=} Exiting while loop")
        return None

    if response.status_code != 200:
        logging.critical(f"WARNING response code was not 200 --- {response.status_code=}")
        return None
    os.makedirs(os.path.dirname(CACHE_FILE_PATH), exist_ok=True)
    with open(CACHE_FILE_PATH, 'w') as f:
        json.dump(response_json, f)
    return response_json # type: ignore

def getAllDataOf(dataTypeFullName:str) -> List[Any]:
    CACHE_FILE_NAME = f"{dataTypeFullName}"
    CACHE_FILE_PATH = os.path.join(TMP_FOLDER, CACHE_FILE_NAME)
    if os.path.isfile(CACHE_FILE_PATH):
        with open(CACHE_FILE_PATH, 'r') as f:
            return json.load(f)
    page_nr = 1
    responses : List[Dict[str, object]]= []
    while True:
        logging.debug(f"Page nr: {page_nr}")
        response_json = requestSK3API(dataTypeFullName, PER_PAGE, FIELDS, page_nr)  # -can be a list or a dict
        if response_json is None:
            break
        if len(response_json) == 0:
            break

        logging.debug(f"Number of rows: {len(response_json)}")

        responses += response_json
        page_nr += 1
    os.makedirs(os.path.dirname(CACHE_FILE_PATH), exist_ok=True)
    with open(CACHE_FILE_PATH, 'w') as f:
        json.dump(responses, f)
    return responses
    
def isPublished(json_row: PublishableT) -> bool:
    status: str = json_row["status"]
    return(status == "publish")

#RJK_ACF = "acf"  # -advanced custom fields (WP)
#RJSK_ACF_SHORT_DESCRIPTION = "short_description"  # unused
#RJSK_ACF_DESCRIPTION_ID = "description"
#RJSK_ACF_MAIN_IMAGE = "main_image"
#RJSK_ACF_MAIN_IMAGE_URL = "url"

def getImageUrl(row: InitiativeJSON):
    if 'main_image' in row['acf']:
        acfmi = row['acf']['main_image']
        if acfmi:
            return acfmi['url']
    return ""

def getInstagram(row: InitiativeJSON):
    return row['acf']['instagram_username']

def getHomepage(row: InitiativeJSON):
    return row['acf']['website_url']

def getFB(row: InitiativeJSON):
    return row['acf']['facebook_url']

def getRegion(translation: InitiativeJSON):
    data_type_full_name = translation["type"]
    return data_type_full_name.split("_")[0]

def getLangCode(row: InitiativeJSON):
    if "lang" in row:
        return row["lang"]
    else:
        #for Sjuhärad
        return 'sv'