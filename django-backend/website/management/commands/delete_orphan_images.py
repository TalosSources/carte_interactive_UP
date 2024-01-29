import pathlib
import logging
import django.core.files.storage
from bs4 import BeautifulSoup

from urllib.parse import urlparse

import website.models
from smartakartan4.settings import HOST, MEDIA_URL

from typing import Set

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

def get_physical_storage_location():
    default_storage: django.core.files.storage.DefaultStorage = django.core.files.storage.default_storage
    if not isinstance(default_storage, django.core.files.storage.FileSystemStorage):
        logging.error("Default storage is not of type FileSystemStorage")
        raise NotImplementedError
    return default_storage.location

def get_image_files_on_disk() -> Set[str]:
    return set(f.name for f in pathlib.Path(get_physical_storage_location()).iterdir() if f.is_file())

def get_linked_images_in(html_text: str) -> Set[str]:
    def image_is_relevant(img):
        if 'src' not in img.attrs:
            return False
        o = urlparse(img['src'])
        host = o.hostname
        if host is None:
            return True
        if host == HOST:
            return True
        return False

    soup = BeautifulSoup(html_text, 'html.parser')
    images_on_our_server: Set[str] = set(img['src'] for img in soup.find_all('img') if image_is_relevant(img))
    images_to_take_care_of: Set[str] = set()

    for img in images_on_our_server:
        if not img.startswith(MEDIA_URL):
            logging.critical(f"Image {img} is supposed to be on our server, but does not reside in the media dir!")
        else:
            images_to_take_care_of.add(img.removeprefix(MEDIA_URL))
    return images_to_take_care_of


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
    dir = get_physical_storage_location()
    for img in files:
        path = pathlib.Path(dir, img)
        logging.debug(f"Removing file {path}.")
        path.unlink()

class Command(django.core.management.base.BaseCommand):
    help = "Handle orpan images"

    def add_arguments(self, parser: django.core.management.base.CommandParser):
        parser.add_argument("--delete", action="store_true")
        parser.add_argument("--dryrun", action="store_true")

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

        if options["dryrun"] or options['delete']:
            orphan_images = image_files_on_disk - images_linked_in_db
            logging.debug("Images to be deleted:")
            logging.debug(orphan_images)

            if options["delete"]:
                delete(orphan_images)
