from typing import Dict, TypeVar, Union, List

from website.management.commands.importing.SK3Api import InitiativeJSON, getFB, getHomepage, getImageUrl, getInstagram, getRegion
from website.management.commands.importing.common import ImportLogger, TranslationGroup

"""
Encapsules best-effort matching during initiative import process.

In the old DB, translations of the same initiative can live indedendently. While
importing the old data, we guess which initiatives belong together based on
their images, url, social profiles etc.
"""
class InitiativeTranslationMatching:
    def __init__(self):
        self.explicitLink: Dict[str, TranslationGroup] = {} # : {sk3TranslationId : sk4InitiativeBaseObj}
        self.mainImage: Dict[str, TranslationGroup] = {}
        self.instagram: Dict[str, TranslationGroup] = {} 
        self.fb: Dict[str, TranslationGroup] = {}
        self.homepage: Dict[str, TranslationGroup] = {}
        #self.missingTranslations: MissingTranslationsT = {'en': set(), 'sv': set()}

    def _searchInDict(self, thisTranslationSK3: InitiativeJSON, dict: dict[str, TranslationGroup], key: str | None, fieldName: str, logger: ImportLogger, falsePositives:List[str]=[]) -> Union[TranslationGroup, None]:
        # Linköping seems to be well-maintained or just everthing in only one language
        # sjuhäräd does not even have a language annotation!
        # Karlstad is completely in swedish
        if getRegion(thisTranslationSK3) in ['sjuharad', 'linkoping', 'karlstad']:
            return None
        if not key is None and key.strip() != '' and key in dict:
            title = thisTranslationSK3["title"]["rendered"]
            initiativeBase = dict[key]
            logger.setContext(initiativeBase)
            for falsePositive in falsePositives:
                if falsePositive in title.lower():
                    logger.logToCurator(f"Not connecting {title} to this initiatives. Both have equal {fieldName} {key}. But it's a hardcoded false positive.")
                    logger.removeContext()
                    return None
            logger.logToCurator(f"Connecting {title} with this initiative based on equal {fieldName} {key}.")
            logger.removeContext()
            return initiativeBase
        return None

    K = TypeVar('K')
    V = TypeVar('V')
    def _putInDict(self, dict: Dict[K,V], key: K | None, value: V, logger: ImportLogger):
        if key:
            if key not in dict:
                dict[key] = value
            else:
                if dict[key] != value:
                    logger.logToCurator(f"[Import][TranslationMatcher] Two different initiatives are using {key}.\n Initiative1:\n{dict[key]}\n\nInitiative2:\n{value}.")
    
    def findInitiativeBaseFor(self, incomingTranslation: InitiativeJSON, importLogger: ImportLogger) -> TranslationGroup | None:
        thisTranslationSK3Id = incomingTranslation["id"]
        if thisTranslationSK3Id in self.explicitLink:
            return self.explicitLink[thisTranslationSK3Id]
        r = self._searchInDict(incomingTranslation, self.mainImage, getImageUrl(incomingTranslation), 'image url', importLogger,
            ['fixoteket', 'plaskdammar',
            'bomhus library',
            'city library gävle',
            'sätra library',
            'valbo library',
            'forsbacka library',
            'hedesunda bibliotek',
            'skivbörs',
            'röda korset',
            'alelyckan',
            ])
        if not r is None:
            return r
        r = self._searchInDict(incomingTranslation, self.instagram, getInstagram(incomingTranslation), 'instagram', importLogger,
            ['allmänna',
            'solidarity fridge @ kulturhuset cyklopen',
            'cultivating with länsmuseet gävleborg',
            'dospace drottningen',
            'biståndsgruppen second hand gävle city',
            'reningsborg',
            'beyond retro',
            'stadsmissionen',
            'hos oss',
            'röda korset',
            'skivbörs',
            'frihet linn',
            'alelyckan',
            'mamas retro',
            ])
        if not r is None:
            return r
        r = self._searchInDict(incomingTranslation, self.fb, getFB(incomingTranslation), 'facebook', importLogger,
            ['allmänna',
            'the red cross solidarity cabinet',
            'dospace drottningen',
            'reningsborg',
            'beyond retro',
            'röda korset',
            'skivbörs',
            'stadsmissionen',
            'alelyckan',
            'hos oss',
            ])
        if not r is None:
            return r
        r = self._searchInDict(incomingTranslation, self.homepage, getHomepage(incomingTranslation), 'homepage', importLogger,
            ['allmänna', 'fixoteket', 'historic clothes',
            'lom', 'lappis', 'stockholm outdoor gyms',
            'red cross city centre',
            'the red cross solidarity cabinet',
            'biståndsgruppen second hand gävle city',
            'röda korset',
            'skivbörs',
            'stadsmissionen',
            'lindra second hand',
            'alelyckan',
            'hos oss',
            ])
        if not r is None:
            return r

    def registerInitiativeBase(self, initiativeBase: TranslationGroup, row: InitiativeJSON, logger: ImportLogger) -> None:
        if "translations" in row:
            translations_dict = row["translations"]
            for translationId in translations_dict.values():
                self._putInDict(self.explicitLink, translationId, initiativeBase, logger)
        self._putInDict(self.mainImage, getImageUrl(row),initiativeBase, logger)
        self._putInDict(self.instagram, getInstagram(row), initiativeBase, logger)
        self._putInDict(self.fb, getFB(row), initiativeBase, logger)
        self._putInDict(self.homepage, getHomepage(row), initiativeBase, logger)
