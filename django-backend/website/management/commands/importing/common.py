import logging
from typing import NotRequired, Type, TypedDict
from slugify import slugify

from django.db.models import Model

import website.models
from website.management.commands.importing.SK3Api import InitiativeJSON

TranslationsT = TypedDict('TranslationsT', {
    'en': NotRequired[InitiativeJSON],
    'sv': NotRequired[InitiativeJSON],
})
TranslationGroup = TypedDict('TranslationGroup', {
    'translations': TranslationsT,
    'history': str,
})

def create_languages(code: str) -> website.models.Language:
    Languages = {
        'en' : {
            'english' : 'english',
            'native' : 'english',
            'flag' : '🇬🇧',
        },
        'sv' : {
            'english' : 'swedish',
            'native' : 'svenska',
            'flag' : '🇸🇪',
        },
        'de' : {
            'english' : 'german',
            'native' : 'deutsch',
            'flag' : '🇩🇪',
        },
    }
    Default_Lang = 'en'
    langs = website.models.Language
    try:
        return langs.objects.get(code=code)
    except langs.DoesNotExist:
        language = langs.objects.create(
            code=code,
            englishName=Languages[code]['english'],
            nativeName=Languages[code]['native'],
            flag=Languages[code]['flag'],
            )
        if code == Default_Lang:
            language.default = 'd'
        language.save()
        return language

def generateNewSlug(beginning:str, model: Type[Model]) -> str:
    slugified_beginning = slugify(beginning)
    possible_slug = slugified_beginning
    n = 0
    while True:
        try:
            model.objects.get(slug=possible_slug)
            n += 1
            possible_slug = slugified_beginning + str(n)
        except model.DoesNotExist:
            return possible_slug

def _annotateToHistoryInI(initiativeBase: website.models.Initiative, message: str) -> None:
    if message == "":
        return
    initiativeBase.needs_attention = True
    prevHistory = initiativeBase.history
    initiativeBase.history = message + "\n" + prevHistory
    initiativeBase.save()

def _annotateToHistoryInTG(initiativeBase: TranslationGroup, message: str) -> None:
    prevHistory = initiativeBase['history']
    initiativeBase['history'] = message + "\n" + prevHistory #TODO Add timestamp


class ImportLogger:
    context: TranslationGroup | website.models.Initiative | None = None

    def logToCurator(self, msg: str):
        if isinstance(self.context, website.models.Initiative):
            _annotateToHistoryInI(self.context, msg)
        elif self.context is None:
            logging.critical(f"This message should have reached some curator, but context was None.\n"+msg)
        else:
            _annotateToHistoryInTG(self.context, msg)

    def infoToDeveloper(self, msg: str):
        logging.info(msg)
    def warnToDeveloper(self, msg: str):
        logging.warn(msg)
    def criticalToDeveloper(self, msg: str):
        logging.critical(msg)
    
    def setContext(self, c: TranslationGroup | website.models.Initiative):
        if self.context == c:
            return
        if self.context is not None:
            raise Exception("Log context should have been None.")
        self.context = c

    def removeContext(self):
        self.context = None