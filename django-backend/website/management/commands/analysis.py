# import json
import collections
import logging

import django.core.management.base
import django.db

import website.models

# import django.core.management

logging.basicConfig(level=logging.DEBUG)


def tag_stats_from_db():
    """
    Example output, with formatting:
    INFO:root:tag_stats_defaultdict=defaultdict(<class 'int'>, {
    0: 1433,
    1: 145, 2: 23, 3: 18, 4: 6, 5: 7, 6: 1, 7: 2, 8: 2, 9: 2, 10: 2,
    11: 3, 12: 1, 13: 2, 15: 1, 16: 2
    21: 1, 24: 1, 28: 1
    })
    #

    """
    tag_stats_defaultdict = collections.defaultdict(int)
    # -default is zero (from "int")
    # -key: nr of initiatives that a tag has
    # -value: nr of tags for x (key) initiatives
    # -docs: https://docs.python.org/3/library/collections.html#collections.defaultdict
    for tag_obj in website.models.Tag.objects.all():
        count = 0
        tag_obj: website.models.Tag
        logging.info(f"{tag_obj.title=}")
        for initiative_obj in website.models.Initiative.objects.all():
            if tag_obj in initiative_obj.tags.all():
                count += 1
        logging.info(f"{count=}")
        """
        nr_of_tags_without_any_initiative = 0
        if count == 0:
            nr_of_tags_without_any_initiative += 1
        logging.info(f"{nr_of_tags_without_any_initiative=}")
        """
        tag_stats_defaultdict[count] += 1
    sorted(tag_stats_defaultdict, key=lambda item: int(item))
    logging.info(f"{tag_stats_defaultdict=}")


class Command(django.core.management.base.BaseCommand):
    help = "Migrate data from sk3"

    def add_arguments(self, parser):
        parser.add_argument("--tag_stats", action="store_true")  # -available under "options" in help

    def handle(self, *args, **options):
        logging.debug(f"{args=}")
        logging.debug(f"{options=}")
        if options["tag_stats"]:
            tag_stats_from_db()
