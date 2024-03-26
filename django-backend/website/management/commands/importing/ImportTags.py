import logging
from typing import Iterable, List, Dict

from website.management.commands.importing.SK3Api import TagRow, isPublished, getAllDataOf
import website.models

def findShortestSlugsByTitle(tag_rows: Iterable[TagRow]) -> Dict[str, str]:
    tagg_dict : Dict[str, str] = {}
    logging.debug("============= entered function process_tagg_rows")
    for resp_row in tag_rows:
        title = resp_row['title']['rendered']
        slug: str = resp_row['slug']
        if title in tagg_dict.keys():
            logging.warn(f"Found duplicate tag {title}. Slugs: '{slug}' vs. '{tagg_dict[title]}'")
            if len(slug) < len(tagg_dict[title]):
                tagg_dict[title] = slug
        else:
            tagg_dict[title] = slug
    return tagg_dict

def importTags():
    sk3_tag_rows: List[TagRow] = getAllDataOf('tagg')
    publihed_tag_rows = filter(isPublished, sk3_tag_rows)

    tagg_dict = findShortestSlugsByTitle(publihed_tag_rows)
    for title, slug in tagg_dict.items():
        new_obj = website.models.Tag(slug=slug, title=title)
        try:
            new_obj.save()
        except:
            logging.info(f"Tag with slug {slug} was already present")