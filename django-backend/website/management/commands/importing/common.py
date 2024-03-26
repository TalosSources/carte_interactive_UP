from typing import Type
from slugify import slugify

from django.db.models import Model

import website.models

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

def annotateToHistory(initiativeBase: website.models.Initiative, message: str) -> None:
    initiativeBase.needs_attention = True
    prevHistory = initiativeBase.history
    initiativeBase.history = message + "\n" + prevHistory
    initiativeBase.save()
