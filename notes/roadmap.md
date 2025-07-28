# Features
* structured tags. this could go very far, with type theory stuff. But as a beginning, there can be categories (which are predefined, and adding a new one is a developer's decision), and tags which are multiple. Then categories are selected separately from tags. They could be food, objects, third places, ...
* website, perhaps adress (or descriptive place name, like a neighborhood or street or smtg)? perhaps we should ditch lat/long and replace them with addresses, and use some API to fetch the leaflet pos? or maybe leaflet does it?

* filter by tag -> DONE
* english / french (see https://medium.com/@nohanabil/building-a-multilingual-static-website-a-step-by-step-guide-7af238cc8505) DONE
* short/long descriptions (markdown?) DONE
* for the links: a simple way to allow any number of links, structured in any way is to allow them to be in the description, simply. DONE
* only places visible on the map appear on cards! question: should search bar search only visible places or all? should it then dezoom automatically to make them all visible? possible solution: the map is always linked to the visible cards, and vice-versa. changing one must affect the other. DONE
* map on the place.html page DONE
* center on lausanne (or cool trick: position the map as to bound neatly all existing places) DONE
* detail: also search through long descriptions. DONE

## quality of life
* clickable tags: selects only this tag in filters. (or, select it on top of already selected ones). also clickable in the place.html page
* clickable pop-ups? see how smartakartan did it, but basically the user should never be annoyed trying to do something impossible
* hover on cards shows the corresponding marker on the map
* other "reactive" elements, everything should be connected (mainly tags<->markers<-popups>)
* option to select none (all?) of tags
* perhaps: pop up box on markers has more info (image?<>)
* system for people to input places in a more intuitive format (csv/excel? something else), which is then automatically converted to json. perhaps a github pipeline can help with doing that automatically
* dark mode? with a toggle? not urgent

* search up to accents (écologie==ecologie) (not urgent) DONE


# Deco
* unipoly branding
* link to form to submit places (that we'd add by hand), with an explanation on criteria for the places. also include a form for improvement suggestions? and/or github pull requests? say we're very open to them, we want it to be a participative project, we welcome propositions from anywhere
* perhaps a small explanation of the project, what's the aim, say it's based on smartakartan
* make it more beautiful (including but not limited to: change the marker icon, leaflet map theme/appareance (copy smartakartan)).
* different color for each tag? obtained by hashing it or something for reproducibility
* careful about the order: maybe strange to have unipoly first? alphabetic instead?

# Data
* add many more places
* be careful about the images. copyright? use good ones
* should we contact the people we mapped?
* add english to descriptions and tags
* add websites, etc.