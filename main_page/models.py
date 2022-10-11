# from django.db import models
from django.contrib.gis.db import models


class Initiative(models.Model):
    name = models.CharField(max_length=127)
    description = models.CharField(max_length=4095)
    online_only = models.BooleanField()

    # TODO: Opening days and hours
    # TODO: Region (ex city)
    # TODO: Transaction form --- set of booleans

    def __str__(self):
        return self.name


class Location(models.Model):
    address = models.CharField(max_length=127)
    coordinates = models.PointField()
    initiative = models.ForeignKey(Initiative, on_delete=models.CASCADE)

    def __str__(self):
        return self.address


class Category(models.Model):
    name = models.CharField(max_length=31)


class Tag(models.Model):
    name = models.CharField(max_length=63)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
