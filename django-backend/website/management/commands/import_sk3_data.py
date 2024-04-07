import logging

#from typing import Dict, List

import django.core.management.base
from django.core.management.base import CommandParser
import django.db

import website.models
#from website.management.commands.importing.SK3Api import getAllDataOf
from website.management.commands.importing.ImportInitiatives import importInitiatives
from website.management.commands.importing.RegionImport import importRegions
from website.management.commands.importing.ImportTags import importTags
from website.management.commands.importing.common import create_languages

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
logging.basicConfig(level=logging.INFO)

"""
How to use this script: See CONTRIBUTING.md

WP documentation: Using the REST API
https://developer.wordpress.org/rest-api/using-the-rest-api/

REST and Python: Consuming APIs
https://realpython.com/api-integration-in-python/#rest-and-python-consuming-apis

Example API request:
https://reqbin.com/yoftqza4

"Manage Pods" page in WordPress:
https://sk-wp.azurewebsites.net/wp-admin/admin.php?page=pods
(Only available with WP login)
"""

# RJK: Response JSON (Sub) Key
#RJK_DATE = "date"
#RJK_TITLE = "title"
#RJSK_RENDERED = "rendered"
#RJK_LATITUDE = "latitude"
#RJK_LONGITUDE = "longitude"

#ADDRESS_DT = "address"
#GOTEBORG_R = "goteborg"
#OVERSATTNING_DT = "oversattning"


def import_sk3_data(*_args: None) -> None:
    # TODO regions_to_be_imported = REGION_DATA_DICT.keys()
    regions_to_be_imported = ["goteborg", "malmo", "stockholm", "sverige", "sjuharad", "gavle", "linkoping", 'umea', 'karlstad']

    importRegions(regions_to_be_imported)

    importTags()

    for region in regions_to_be_imported:
        importInitiatives(region)

class Command(django.core.management.base.BaseCommand):
    help = "Migrate data from sk3"

    def add_arguments(self, parser: CommandParser):
        parser.add_argument("--clear-before-import", action="store_true")

    def handle(self, *args: None, **options: None):
        if "clear-before-import" in options:
            result_text = input("Are you sure you want to delete the whole database? (y/n) ")

            if result_text == "y":
                website.models.Region.objects.all().delete()
                website.models.Tag.objects.all().delete()
                website.models.InitiativeTitleText.objects.all().delete() # type: ignore
                website.models.InitiativeDescriptionText.objects.all().delete() # type: ignore
                website.models.Location.objects.all().delete()
                website.models.Initiative.objects.all().delete()

        import_sk3_data(*args)

        create_languages('de')