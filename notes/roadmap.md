# Features
* filter by tag -> DONE
* only places visible on the map appear on cards!
* english / french (see https://medium.com/@nohanabil/building-a-multilingual-static-website-a-step-by-step-guide-7af238cc8505)
* short/long descriptions (markdown?)
* opening hours? website, perhaps adress? or other contact info, see smartakartan
* map on the place.html page
* center on lausanne (or cool trick: position the map as to bound neatly all existing places)
* structured tags. this could go very far, with type theory stuff. But as a beginning, there can be categories (which are predefined, and adding a new one is a developer's decision), and tags which are multiple. Then categories are selected separately from tags. They could be food, objects, third places, ...

## quality of life
* clickable tags: selects only this tag in filters. (or, select it on top of already selected ones)
* option to select none (all?) of tags
* hover on cards shows the corresponding marker on the map
* perhaps: pop up box on markers has more info (image?<>)
* system for people to input places in a more intuitive format (csv/excel? something else), which is then automatically converted to json. perhaps a github pipeline can help with doing that automatically
* other "reactive" elements, everything should be connected (mainly tags<->markers<-popups>)


# Deco
* unipoly branding
* link to form to submit places (that we'd add by hand), with an explanation on criteria for the places.
* perhaps a small explanation of the project, what's the aim, say it's based on smartakartan
* make it more beautiful (including but not limited to: change the marker icon, leaflet map theme/appareance (copy smartakartan)).
* different color for each tag? obtained by hashing it or something for reproducibility