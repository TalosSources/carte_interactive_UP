from django.contrib.gis.db import models as gis_models
from django.db import models


class Initiative(models.Model):
    name = models.CharField(max_length=127)
    description = models.CharField(max_length=4095)
    online_only = models.BooleanField()

    # TODO: Opening days and hours, Region (ex city), Transaction form (set of booleans?), etc

    def __str__(self):
        return self.name


class Location(gis_models.Model):
    address = gis_models.CharField(max_length=127)
    coordinates = gis_models.PointField()
    # Please note the `related_name` kw parameter (used in the serializer)
    initiative = gis_models.ForeignKey(Initiative, related_name='locations', on_delete=models.CASCADE)

    def __str__(self):
        return self.address


# not used yet
class Category(models.Model):
    name = models.CharField(max_length=31)


# not used yet
class Tag(models.Model):
    name = models.CharField(max_length=63)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
