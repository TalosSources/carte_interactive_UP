from django.contrib.gis import admin as gis_admin

from . import models


@gis_admin.register(models.Location)
class LocationAdmin(gis_admin.OSMGeoAdmin):
    list_display = ("address", "coordinates")


@gis_admin.register(models.Initiative)
class InitiativeAdmin(gis_admin.ModelAdmin):
    pass
