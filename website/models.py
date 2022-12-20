from django.contrib.gis.db import models as gis_models
from django.db import models


class Initiative(models.Model):
    sk3_id = models.IntegerField(null=True, blank=True, unique=True)
    # -multiple values can be NULL and not violate uniqueness. See: https://stackoverflow.com/a/1400046/2525237
    title = models.CharField(max_length=127)
    description = models.CharField(max_length=32767)

    def __str__(self):
        return self.title


class Location(gis_models.Model):
    sk3_id = models.IntegerField(null=True, unique=True)
    title = gis_models.CharField(max_length=127)
    coordinates = gis_models.PointField()
    # Please note the `related_name` kw parameter (used in the serializer)
    # For explanation of bland and null, please see this answer+comments: https://stackoverflow.com/a/6620137/2525237
    initiative = gis_models.ForeignKey(Initiative, related_name='locations', on_delete=models.CASCADE, blank=True,
        null=True)

    def __str__(self):
        return self.title
