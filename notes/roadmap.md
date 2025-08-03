# Features
* website, perhaps adress (or descriptive place name, like a neighborhood or street or smtg)? perhaps we should ditch lat/long and replace them with addresses, and use some API to fetch the leaflet pos? or maybe leaflet does it?
* structured tags. this could go very far, with type theory stuff. But as a beginning, there can be categories (which are predefined, and adding a new one is a developer's decision), and tags which are multiple. Then categories are selected separately from tags. They could be food, objects, third places, ... also another idea, allow an option "OR" / "AND" (way to combine multiple selected tags)
* store the filter info somewhere. it could be in local storage. It could also be in the url, which would have the additional advantage of being shareable (can share a link with all thriftstores in lausanne!). also, perhaps there's an UI thing here where people don't understand that clicking on a card will lead to another page. Perhaps having that clicking on the card highlights it, and opens the corresponding popup, while a button "more information" leads to the place page. Need feedback for that, but it would at least make more sense to me, even if it doesn't lead to more efficient interaction. indeed the current hover-highlight-popup-interaction solution is a bit unsatisfying, as highlightling is lost for below cards as the mouse must go over higher cards, triggering their highlighting instead.
* accessibility (need to look up how to do that properly)
* better mobile support
* nice place-holder for missing items, especially image. perhaps a "image-like" css element with the name or initials or smtg else?


* filter by tag -> DONE
* english / french (see https://medium.com/@nohanabil/building-a-multilingual-static-website-a-step-by-step-guide-7af238cc8505) DONE
* short/long descriptions (markdown?) DONE
* for the links: a simple way to allow any number of links, structured in any way is to allow them to be in the description, simply. DONE
* only places visible on the map appear on cards! question: should search bar search only visible places or all? should it then dezoom automatically to make them all visible? possible solution: the map is always linked to the visible cards, and vice-versa. changing one must affect the other. DONE
* map on the place.html page DONE
* center on lausanne (or cool trick: position the map as to bound neatly all existing places) DONE
* detail: also search through long descriptions. DONE

## quality of life
* system for people to input places in a more intuitive format (csv/excel? something else), which is then automatically converted to json. perhaps a github pipeline can help with doing that automatically
* perhaps: pop up box on markers has more info (image?<>)
* dark mode? with a toggle? not urgent

* search up to accents (écologie==ecologie) (not urgent) DONE
* clickable pop-ups? see how smartakartan did it, but basically the user should never be annoyed trying to do something impossible DONE
* hover on cards shows the corresponding marker on the map DONE
* clickable tags: selects only this tag in filters. (or, select it on top of already selected ones). also clickable in the place.html page DONE
* other "reactive" elements, everything should be connected (mainly tags<->markers<-popups>) DONE
* option to select none (all?) of tags DONE


# Deco
* unipoly branding
* link to form to submit places (that we'd add by hand), with an explanation on criteria for the places. also include a form for improvement suggestions? and/or github pull requests? say we're very open to them, we want it to be a participative project, we welcome propositions from anywhere
* perhaps a small explanation of the project, what's the aim, say it's based on smartakartan
* make it more beautiful (including but not limited to: change the marker icon, leaflet map theme/appareance (copy smartakartan)).
* careful about the order: maybe strange to have unipoly first? alphabetic instead?
* logo on the tab

* different color for each tag? obtained by hashing it or something for reproducibility DONE

## Footer
Information I want to include (either there if very short, or as link to other page):
* about: what's this map about, who made it (unipoly), but based on smartakartan
* contribute: perhaps a single contribute page with all ways: add places, feedback on the site, development (pull requests) and github
* licensing? copyright? I don't know anything about this, see the main unipoly.ch site.
* cookies??? is local-storage actually cookies? if yes, I guess we remove them

# Bugs / Problems
* places.html doesn't load, error because of 'lat'? happens for "soupe populaire"

# other
* link to other cool initiatives in lausanne that didn't fit on the card? for example, a site compiling water fountains? or if we want to compile them, perhaps they should be hidden by default
* (ambitious?) have a different icon for each category if we have categories

# Data
* add many more places
* be careful about the images. copyright? use good ones
* should we contact the people we mapped?
* add english to descriptions and tags
* add websites, etc.

# Misc from smartakartan
* several places per "initiative" (they mapped microwaves on KTH campus)
* their tag/category thing seems complex: they allow filter for "transaction form", but then also seem to have tags, which when clicked, reveal something like nested tags?
* different ranking options from card (random, last added/updated, alphabetically)
* management for many places, such as a "load more" button. We'll look into it when we have many places.

# TODO Now
* ensure places are added quickly and correctly
* write about and contribute
* website etc.
* worry licensing, copyright, etc.
* worry about having a chart: what's accepted as places? what are our core values, rules?
* a few new features (url data, structured tags, accessibility)