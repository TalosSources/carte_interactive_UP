# from django.db import models
from django.contrib.gis.db import models


class Address(models.Model):
    name = models.CharField(max_length=80)
    location = models.PointField()

    def __str__(self):
        return self.name


class Initiative(models.Model):
    name = models.CharField(max_length=80)
    addresses = models.ForeignKey(Address, on_delete=models.CASCADE)

    def __str__(self):
        return self.name
