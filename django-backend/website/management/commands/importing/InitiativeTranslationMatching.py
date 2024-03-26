import logging
from typing import Dict, Set, TypeVar, TypedDict, Union, List

import website.models

from website.management.commands.importing.SK3Api import InitiativeJSON, getFB, getHomepage, getImageUrl, getInstagram, getLangCode, getRegion
from website.management.commands.importing.common import annotateToHistory

"""
Encapsules best-effort matching during initiative import process.

In the old DB, translations of the same initiative can live indedendently. While
importing the old data, we guess which initiatives belong together based on
their images, url, social profiles etc.
"""
MissingTranslationsT = TypedDict('MissingTranslationsT', {
                         'en': Set[str],
                         'sv': Set[str],
                        })

class InitiativeTranslationMatching:
    def __init__(self):
        self.explicitLink: Dict[str, website.models.Initiative] = {} # : {sk3TranslationId : sk4InitiativeBaseObj}
        self.mainImage: Dict[str, website.models.Initiative] = {}
        self.instagram: Dict[str, website.models.Initiative] = {} 
        self.fb: Dict[str, website.models.Initiative] = {}
        self.homepage: Dict[str, website.models.Initiative] = {}
        self.missingTranslations: MissingTranslationsT = {'en': set(), 'sv': set()}

    def _searchInDict(self, thisTranslationSK3: InitiativeJSON, dict: dict[str, website.models.Initiative], key: str | None, fieldName: str, falsePositives:List[str]=[]) -> Union[website.models.Initiative, None]:
        # Linköping seems to be well-maintained or just everthing in only one language
        # sjuhäräd does not even have a language annotation!
        # Karlstad is completely in swedish
        if getRegion(thisTranslationSK3) in ['sjuharad', 'linkoping', 'karlstad']:
            return None
        if not key is None and key.strip() != '' and key in dict:
            title = thisTranslationSK3["title"]["rendered"]
            initiativeBase = dict[key]
            for falsePositive in falsePositives:
                if falsePositive in title.lower():
                    annotateToHistory(initiativeBase, f"Not connecting {title} to this initiatives. Both have equal {fieldName} {key}. But it's a hardcoded false positive.")
                    return None
            annotateToHistory(initiativeBase, f"Connecting {title} with this initiative based on equal {fieldName} {key}.")
            return initiativeBase
        return None

    K = TypeVar('K')
    V = TypeVar('V')
    def _putInDict(self, dict: Dict[K,V], key: K | None, value: V):
        if key:
            dict[key] = value
    
    def findInitiativeBaseFor(self, incomingTranslation: InitiativeJSON) -> website.models.Initiative | None:
        thisTranslationSK3Id = incomingTranslation["id"]
        if thisTranslationSK3Id in self.explicitLink:
            return self.explicitLink[thisTranslationSK3Id]
        try:
            r = website.models.InitiativeTranslation.objects.get(sk3_id=thisTranslationSK3Id).initiative
            self.registerInitiativeBase(r, incomingTranslation)
            return r
        except:
            pass
        if "translations" in incomingTranslation:
            translations_dict = incomingTranslation["translations"]
            for translationId in translations_dict.values():
                try:
                    r = website.models.InitiativeTranslation.objects.get(sk3_id=translationId).initiative
                    self.registerInitiativeBase(r, incomingTranslation)
                    return r
                except:
                    pass
        r = self._searchInDict(incomingTranslation, self.mainImage, getImageUrl(incomingTranslation), 'image url',
            ['fixoteket', 'plaskdammar',
            'bomhus library',
            'city library gävle',
            'sätra library',
            'valbo library',
            'forsbacka library',
            'hedesunda bibliotek',
            'alelyckan',
            ])
        if not r is None:
            return r
        r = self._searchInDict(incomingTranslation, self.instagram, getInstagram(incomingTranslation), 'instagram',
            ['allmänna',
            'solidarity fridge @ kulturhuset cyklopen',
            'cultivating with länsmuseet gävleborg',
            'dospace drottningen',
            'biståndsgruppen second hand gävle city',
            'reningsborg',
            'beyond retro',
            'stadsmissionen',
            'hos oss',
            'frihet linn',
            'alelyckan',
            'mamas retro',
            ])
        if not r is None:
            return r
        r = self._searchInDict(incomingTranslation, self.fb, getFB(incomingTranslation), 'facebook',
            ['allmänna',
            'the red cross solidarity cabinet',
            'dospace drottningen',
            'reningsborg',
            'beyond retro',
            'stadsmissionen',
            'alelyckan',
            'hos oss',
            ])
        if not r is None:
            return r
        r = self._searchInDict(incomingTranslation, self.homepage, getHomepage(incomingTranslation), 'homepage',
            ['allmänna', 'fixoteket', 'historic clothes',
            'lom', 'lappis', 'stockholm outdoor gyms',
            'red cross city centre',
            'the red cross solidarity cabinet',
            'biståndsgruppen second hand gävle city',
            'stadsmissionen',
            'lindra second hand',
            'alelyckan',
            'hos oss',
            ])
        if not r is None:
            return r

    def registerInitiativeBase(self, initiativeBase: website.models.Initiative, row: InitiativeJSON) -> None:
        if "translations" in row:
            translations_dict = row["translations"]
            for translationId in translations_dict.values():
                self.explicitLink[translationId] = initiativeBase
        self._putInDict(self.mainImage, getImageUrl(row),initiativeBase)
        self._putInDict(self.instagram, getInstagram(row), initiativeBase)
        self._putInDict(self.fb, getFB(row), initiativeBase)
        self._putInDict(self.homepage, getHomepage(row), initiativeBase)

        for lang in self.missingTranslations.keys():
            self.missingTranslations[lang].add(initiativeBase.slug) # type: ignore

    def foundTranslation(self, initiativeBase: website.models.Initiative, incomingTranslation: InitiativeJSON):
        self.missingTranslations[getLangCode(incomingTranslation)].remove(initiativeBase.slug)