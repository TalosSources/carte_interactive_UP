from django.contrib import admin
from django.contrib.gis import admin as gis_admin
from django.contrib.gis.forms.widgets import OSMWidget 
from django.utils.html import format_html
from django.contrib.gis.db import models as gis_models

from . import models

# copied from django.contrig.gis.admin.options because it is not exported :\
class GeoModelAdminMixin:
    gis_widget = OSMWidget
    gis_widget_kwargs = {'attrs':{
        'default_lon' : 12,
        'default_lat' : 60,
        'default_zoom' : 5,
    }}

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        if isinstance(db_field, gis_models.GeometryField) and (
            db_field.dim < 3 or self.gis_widget.supports_3d
        ):
            kwargs["widget"] = self.gis_widget(**self.gis_widget_kwargs)
            return db_field.formfield(**kwargs)
        else:
            return super().formfield_for_dbfield(db_field, request, **kwargs)

"""
inheritances:
              /-> GeoModelAdminMixin() -> Object()
GISModelAdmin -> ModelAdmin(model, admin_site) -> BaseModelAdmin()
StackedInline -> InlineModelAdmin(model, admin_site) -> BaseModelAdmin ()
"""
class LocationInline(GeoModelAdminMixin, admin.StackedInline):
    model = models.Location
    readonly_fields = ("sk3_id",)
    extra = 1

class InitiativeDescriptionTextInline(admin.StackedInline):
    # show_change_link = True
    model = models.InitiativeTranslation
    fields = ("language", "title", "short_description", "description")
    extra = 0  # -adds an extra row that is always visible
    min_num = 1

@admin.register(models.Initiative)
class InitiativeAdmin(admin.ModelAdmin):
    @admin.display(description="Title in all languages")
    def title_func(self, initiative_obj):
        initiative_title_list = models.InitiativeTranslation.objects.filter(initiative_id=initiative_obj.id)
        representation = ""
        for initiative_title in initiative_title_list:
            representation += " --- " + initiative_title.title
        representation += " --- "
        return representation

    filter_horizontal = ("tags",)
    list_display = ["title_func", "slug", "short_comment"]
    list_filter = ["region", "promote", "state", "needs_attention"]
    search_fields = ["slug"]
    # TODO: Adding title_func for details view
    readonly_fields = ["slug"]
    #list_max_show_all = 1000
    inlines = [InitiativeDescriptionTextInline, LocationInline]


@gis_admin.register(models.Region)
class RegionAdmin(gis_admin.GISModelAdmin):
    list_display = ("slug", "title")
    readonly_fields = ("sk3_id",)

class RegionPageTranslationInline(admin.StackedInline):
    # show_change_link = True
    model = models.RegionPageTranslation
    fields = ("language", "title", "description")
    extra = 0  # -adds an extra row that is always visible
    min_num = 1

@gis_admin.register(models.RegionPage)
class RegionPageAdmin(admin.ModelAdmin):
    list_display = ("slug", "region", "order")
    inlines = [RegionPageTranslationInline,]

@gis_admin.register(models.Language)
class LanguageAdmin(admin.ModelAdmin):
    @admin.display(description="English name")
    def title_func(self, lang):
        return lang.englishName
    list_display = ["title_func"]


@admin.register(models.Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("title", "slug")
