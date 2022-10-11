from django.contrib.gis import admin as gisadmin
from . import models


@gisadmin.register(models.Location)
class LocationAdmin(gisadmin.OSMGeoAdmin):
    list_display = ("address", "coordinates")


@gisadmin.register(models.Initiative)
class InitiativeAdmin(gisadmin.ModelAdmin):
    pass

# gisadmin.register(Address, AddressAdmin)
# gisadmin.register(Initiative)
