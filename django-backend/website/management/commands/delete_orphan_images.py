import dataclasses
import pathlib
import logging
import django.core.files.storage
from bs4 import BeautifulSoup
import sys
from pathlib import Path
import subprocess
import random
import os
from datetime import datetime
from slugify import slugify

import json
import django.contrib.gis.geos
import django.core.management.base
import django.db
from django.core.files import File
import requests

import website.models

from typing import Dict, List, Optional, Set

"""
Loglevel:
- Debug
- Info: something that may be interesting to know, but is expectable
  - if initiatives, tags, … was already in the DB
- Warning: something that we observed that is unexpected
  - if the data if found to be strange
- Error: ?
- Critical: something that may render the process useless
  - if tags or locations to be linked cannot be found
- Fatal: something that make the process fail
  - nothing so far
"""
logging.basicConfig(level=logging.DEBUG)

def get_image_files_on_disk() -> Set[str]:
    default_storage: django.core.files.storage.DefaultStorage = django.core.files.storage.default_storage
    if not isinstance(default_storage, django.core.files.storage.FileSystemStorage):
        logging.error("Default storage is not of type FileSystemStorage")
        raise NotImplementedError
    return set(f.name for f in pathlib.Path(default_storage.location).iterdir() if f.is_file())

def get_linked_images_in(html_text: str) -> Set[str]:
    soup = BeautifulSoup(html_text, 'html.parser')
    # TODO filter for our page
    for img in soup.find_all('img'):
        if 'src' in img.attrs:
            print(f"Img src: {img['src']}")
        else:
            pass
    return set(img['src'] for img in soup.find_all('img') if 'src' in img.attrs)

def get_linked_images() -> Set[str]:
    linked_images: Set[str] = set()
    for initiative_translation in website.models.InitiativeTranslation.objects.all():
        linked_images = linked_images.union(get_linked_images_in(initiative_translation.description))

    for initiative in website.models.Initiative.objects.all():
        if initiative.main_image:
            linked_images.add(initiative.main_image.name)
    return linked_images

def warn_about_broked_link(files_on_disk: Set[str], files_in_db: Set[str]):
    broken_links = files_in_db - files_on_disk
    for broken_link in broken_links:
        logging.critical(f"Link to image {broken_link} found in db. No such file found on disk.")

def delete(files: Set[str]):
    raise NotImplementedError

class Command(django.core.management.base.BaseCommand):
    help = "Handle orpan images"

    def add_arguments(self, parser: django.core.management.base.CommandParser):
        parser.add_argument("--delete", action="store_true")

    def handle(self, *args: None, **options: dict[str, bool]):
        logging.debug(f"{args=}")
        logging.debug(f"{options=}")

        image_files_on_disk = get_image_files_on_disk()
        images_linked_in_db = get_linked_images()

        logging.debug("Files on disk:")
        logging.debug(image_files_on_disk)
        logging.debug("Files in db:")
        logging.debug(images_linked_in_db)

        warn_about_broked_link( image_files_on_disk, images_linked_in_db)

        if options["delete"]:
            orphan_images = image_files_on_disk - images_linked_in_db
            delete(orphan_images)
