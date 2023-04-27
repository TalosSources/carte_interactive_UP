from django.contrib import admin
from django.contrib.gis import admin as gis_admin
from django.utils.html import format_html

from . import models


@gis_admin.register(models.Location)
class LocationAdmin(gis_admin.GISModelAdmin):
    # Docs: https://docs.djangoproject.com/en/4.1/ref/contrib/gis/admin/#gismodeladmin
    list_display = ("id", "sk3_id", "title", "coordinates", "initiative")
    readonly_fields = ("sk3_id",)
    list_max_show_all = 1000


class InitiativeDescriptionTextInline(admin.StackedInline):
    # show_change_link = True
    model = models.InitiativeTranslation
    fields = ("language_code", "title", "short_description", "description", "sk3_id")
    readonly_fields = ("sk3_id",)
    extra = 0  # -adds an extra row that is always visible
    min_num = 1

class InitiativeImagesInline(admin.TabularInline):
    model = models.InitiativeImage
    extra = 0  # -adds an extra row that is always visible


class TagInitiativeInline(admin.TabularInline):
    model = models.Initiative.tags.through


@admin.register(models.Initiative)
class InitiativeAdmin(admin.ModelAdmin):
    @admin.display(description="Title in all languages")
    def title_func(self, initiative_obj):
        # obj: models.Initiative
        # initiative_id = self..id.id
        initiative_title_list = models.InitiativeTranslation.objects.filter(initiative_id=initiative_obj.id)
        representation = ""
        for initiative_title in initiative_title_list:
            representation += " --- " + initiative_title.title
        representation += " --- "
        return representation

    @admin.display
    def location_list(self, obj: models.Initiative):
        """
        This is used to display a list of locations. Normally it would be better to use an Inline but unfortunately
        in this case the map that should be displayed is not rendered (unknown why).
        """
        location_list = obj.locations.all()
        locations_html = "<ul>"
        for location in location_list:
            locations_html += f'<li><a href="/admin/website/location/{location.id}">{location.title}</a></li>'
        locations_html += "</ul>"
        locations_html += f'<a href="/admin/website/location/add">Add new (use id {obj.id} for location)</a>'
        return format_html(locations_html)

    filter_horizontal = ("tags",)
    list_display = ("id", "title_func")
    # TODO: Adding title_func for details view
    readonly_fields = ["location_list"]
    list_max_show_all = 1000
    inlines = [InitiativeImagesInline, InitiativeDescriptionTextInline]



@gis_admin.register(models.Region)
class RegionAdmin(gis_admin.GISModelAdmin):
    list_display = ("id", "sk3_id", "slug")
    readonly_fields = ("sk3_id",)


@admin.register(models.Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("title", "id", "slug")
    list_filter = ("title",)
    inlines = [TagInitiativeInline, ]
