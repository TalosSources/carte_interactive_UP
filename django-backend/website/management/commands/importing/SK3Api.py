import os
import json

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
        if len(response_json) == 0:
            break

        logging.debug(f"Number of rows: {len(response_json)}")

        responses += response_json
        page_nr += 1
    os.makedirs(os.path.dirname(CACHE_FILE_PATH), exist_ok=True)
    with open(CACHE_FILE_PATH, 'w') as f:
        json.dump(responses, f)
    return responses
    