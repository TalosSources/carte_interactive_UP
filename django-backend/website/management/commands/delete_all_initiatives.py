import logging
import django.core.files.storage

import website.models

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

class Command(django.core.management.base.BaseCommand):
    help = "Handle orpan images"

    def handle(self, *args: None, **options: dict[str, bool]):
        logging.debug(f"{args=}")
        logging.debug(f"{options=}")

    website.models.Initiative.objects.all().exclude(initiative_translations__sk3_id__isnull=True).delete()