from django.contrib.gis import admin as gis_admin

from . import models


@gis_admin.register(models.Location)
class LocationAdmin(gis_admin.OSMGeoAdmin):
    list_display = ("id", "sk3_id", "title", "coordinates", "initiative")
    readonly_fields = ("sk3_id",)


@gis_admin.register(models.Initiative)
class InitiativeAdmin(gis_admin.ModelAdmin):
    list_display = ("id", "sk3_id", "title")
    readonly_fields = ("sk3_id",)
