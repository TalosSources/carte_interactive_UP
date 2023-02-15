



# Taggar

curl --header "Authorization: Bearer LbjFbvboclZd7bcjhNMkMJLl0SIv1Pe7" "https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/tagg/?per_page=100" > docs/sk3_api_responses/tagg.json

Capped at 100 entries

`taggar` doesn't have translation links between SV and EN (unlike `Business`es)


Same tag name but different paths because of sv/en:
* https://sk-wp.azurewebsites.net/wp-admin/post.php?post=7290&action=edit
  * Permalink: `https://sk-wp.azurewebsites.net/index.php/tagg/art-studio/`
* https://sk-wp.azurewebsites.net/wp-admin/post.php?post=7291&action=edit
  * Permalink: `https://sk-wp.azurewebsites.net/index.php/en/tagg/art-studio/`


# Other

## Tags

`tags` have just 17 rows/entries

curl --header "Authorization: Bearer LbjFbvboclZd7bcjhNMkMJLl0SIv1Pe7" "https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/tags/?per_page=100" > docs/sk3_api_responses/tags.json

Internal?

## tagg_grupp

`tagg_grupp` have just 3 entries:
* `subtaggar`
* `huvudtaggar`
* `transaktionsform`

curl --header "Authorization: Bearer LbjFbvboclZd7bcjhNMkMJLl0SIv1Pe7" "https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/tagg_grupp/?per_page=100" > docs/sk3_api_responses/tagg_grupp.json


