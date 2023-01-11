
curl --header "Authorization: Bearer LbjFbvboclZd7bcjhNMkMJLl0SIv1Pe7" "https://sk-wp.azurewebsites.net/index.php/wp-json/wp/v2/region/?per_page=100"


There seems to be two `slug` for each region. Sometimes they have the same name. Sometimes they end with -eng or -2.
The reason there are two seems to be because we want both English and Swedish

* There are two `"slug": "gavle"`
* There is `"slug": "goteborg"` and `"slug": "gothenburg"`

