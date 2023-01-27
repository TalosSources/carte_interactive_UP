from django.contrib.gis.db import models as gis_models
from django.db import models


class Region(models.Model):
    sk3_id = models.IntegerField(null=True, blank=True, unique=True)

    # title = models.CharField(max_length=127, unique=True)  # including "alla områden"
    slug = models.SlugField(max_length=127, unique=True)
    # https://docs.djangoproject.com/en/4.1/ref/models/fields/#slugfield

    # header_html = models.CharField(max_length=32767)
    welcome_message_html = models.CharField(max_length=32767)  # called welcome_message in sk3

    # footer_html = models.CharField(max_length=32767)

    def __str__(self):
        return self.slug  # change to title if/when available


"""
class Language(models.Model):
    code = models.CharField(max_length=255)

    # ex: sv, en
    # https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes

    def __str__(self):
        return self.code


class TextItem(models.Model):
    pass

    def __str__(self):
        return "TextItem---"

class LanguageText(models.Model):
    language = Language()
    text_item = models.ForeignKey(TextItem, related_name='text_items', on_delete=models.CASCADE)
    text = models.CharField(max_length=32767)

    def __str__(self):
        return "LanguageText---"


class Initiative(models.Model):
    title = TextItem()
    description = TextItem()


# title = models.CharField(max_length=127)
# description = models.CharField(max_length=32767)


"""


class Initiative(models.Model):
    # Multiple values can be NULL and not violate uniqueness. See: https://stackoverflow.com/a/1400046/2525237
    # This means that we can use NULL/None for all new rows/items that we add
    sk3_id = models.IntegerField(null=True, blank=True, unique=True)
    region = models.ForeignKey(Region, related_name='regions', on_delete=models.CASCADE)
    description = models.CharField(max_length=32767, default="TODO: Change to dynamic language")

    def __str__(self):
        return f"ID: {self.id}"

    def get_absolute_url(self):
        # https://docs.djangoproject.com/en/4.1/ref/models/instances/#django.db.models.Model.get_absolute_url
        # Better to use reverse?
        # Example: http://localhost/details/2
        # Having defined this method enables "view on site" in the admin interface
        return f"/details/{self.id}"


# sub-classing?
class InitiativeTitleText(models.Model):
    sk3_initiative_id = models.IntegerField(unique=True)
    language_code = models.CharField(max_length=2)
    initiative = models.ForeignKey(Initiative, related_name='initiatives', on_delete=models.CASCADE)
    text = models.CharField(max_length=32767)

    def __str__(self):
        return self.text


class Location(gis_models.Model):
    sk3_id = models.IntegerField(null=True, blank=True, unique=True)
    title = gis_models.CharField(max_length=127)
    coordinates = gis_models.PointField()
    # Please note the `related_name` kw parameter (used in the serializer)
    # For explanation of blank and null, please see this answer+comments: https://stackoverflow.com/a/6620137/2525237
    initiative = gis_models.ForeignKey(Initiative, related_name='locations', on_delete=models.CASCADE, blank=True,
        null=True)

    def __str__(self):
        return self.title


"""
class Page(models.Model):
    title = models.CharField(max_length=127)
    slug = models.SlugField(max_length=127)
    html_ = models.CharField()
    region = gis_models.ForeignKey(Region, on_delete=models.CASCADE)

    def __str__(self):
        return self.title
"""
