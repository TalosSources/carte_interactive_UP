from django.contrib.gis import admin as gisadmin
from .models import Address, Initiative


@gisadmin.register(Address)
class AddressAdmin(gisadmin.OSMGeoAdmin):
    list_display = ("name", "location")


@gisadmin.register(Initiative)
class InitiativeAdmin(gisadmin.ModelAdmin):
    pass

# gisadmin.register(Address, AddressAdmin)
# gisadmin.register(Initiative)
