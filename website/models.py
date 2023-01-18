from django.contrib.gis.db import models as gis_models
from django.db import models


class Region(models.Model):
    sk3_id = models.IntegerField(null=True, blank=True, unique=True)

    # title = models.CharField(max_length=127, unique=True)  # including "alla områden"
    slug = models.CharField(max_length=127, unique=True)

    # header_html = models.CharField(max_length=32767)
    welcome_message_html = models.CharField(max_length=32767)  # called welcome_message in sk3

    # footer_html = models.CharField(max_length=32767)

    def __str__(self):
        return self.slug  # change to title if/when available


"""
class Page(models.Model):
    title = models.CharField(max_length=127)
    slug = models.CharField(max_length=127)
    html_ = models.CharField()
    region = gis_models.ForeignKey(Region, on_delete=models.CASCADE)

    def __str__(self):
        return self.title
"""


class Initiative(models.Model):
    # Multiple values can be NULL and not violate uniqueness. See: https://stackoverflow.com/a/1400046/2525237
    # This means that we can use NULL/None for all new rows/items that we add
    sk3_id = models.IntegerField(null=True, blank=True, unique=True)
    title = models.CharField(max_length=127)
    description = models.CharField(max_length=32767)
    region = gis_models.ForeignKey(Region, related_name='regions', on_delete=models.CASCADE)

    def __str__(self):
        return self.title


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
