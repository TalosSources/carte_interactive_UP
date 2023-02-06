from django.contrib import admin
from django.contrib.gis import admin as gis_admin

from . import models


@gis_admin.register(models.Location)
class LocationAdmin(gis_admin.OSMGeoAdmin):
    list_display = ("id", "sk3_id", "title", "coordinates", "initiative")
    readonly_fields = ("sk3_id",)
    list_max_show_all = 1000


class InitiativeTitleTextInline(admin.TabularInline):
    # show_change_link = True
    model = models.InitiativeTitleText
    readonly_fields = ("sk3_id",)
    extra = 1  # -adds an extra row that is always visible
    min_num = 1


class InitiativeDescriptionTextInline(admin.StackedInline):
    # show_change_link = True
    model = models.InitiativeDescriptionText
    readonly_fields = ("sk3_id",)
    extra = 0
    min_num = 1


@admin.register(models.Initiative)
class InitiativeAdmin(admin.ModelAdmin):
    @admin.display(description="Title in all languages")
    def title_func(self, initiative_obj):
        # obj: models.Initiative
        # initiative_id = self..id.id
        initiative_title_list = models.InitiativeTitleText.objects.filter(initiative_id=initiative_obj.id)
        representation = ""
        for initiative_title in initiative_title_list:
            representation += " --- " + initiative_title.text
        representation += " --- "
        return representation

    list_display = ("id", "sk3_id", "title_func")
    # TODO: Adding title_func for details view
    readonly_fields = ("sk3_id",)
    list_max_show_all = 1000
    inlines = [InitiativeTitleTextInline, InitiativeDescriptionTextInline]


"""
# , "title"

ERRORS:
<class 'website.admin.InitiativeAdmin'>: (admin.E108) The value of 'list_display[2]' refers to 'title', which is not a
callable, an attribute of 'InitiativeAdmin', or an attribute or method on 'website.Initiative'.
root@27a6ea382e00:/code# 

"""


@admin.register(models.Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ("id", "sk3_id", "slug")
    readonly_fields = ("sk3_id",)


@admin.register(models.Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("title", "id", "slug")
    list_filter = ("title",)
