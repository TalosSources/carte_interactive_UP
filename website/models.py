from django.contrib.gis.db import models as gis_models
from django.db import models


class Initiative(models.Model):
    id = models.IntegerField(primary_key=True, unique=True)
    title = models.CharField(max_length=127)
    description = models.CharField(max_length=32768)

    def __str__(self):
        return self.title


class Location(gis_models.Model):
    id = models.IntegerField(primary_key=True, unique=True)
    title = gis_models.CharField(max_length=127)
    coordinates = gis_models.PointField()
    # Please note the `related_name` kw parameter (used in the serializer)
    # For explanation of bland and null, please see this answer+comments: https://stackoverflow.com/a/6620137/2525237
    initiative = gis_models.ForeignKey(Initiative, related_name='locations', on_delete=models.CASCADE, blank=True,
        null=True)

    def __str__(self):
        return self.title
