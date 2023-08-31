"""
> GeoFeatureModelSerializer is a subclass of rest_framework.ModelSerializer which will output data in a format that
> is GeoJSON compatible.

> GeoFeatureModelSerializer requires you to define a geo_field to be serialized as the "geometry".

https://github.com/openwisp/django-rest-framework-gis#geofeaturemodelserializer


ModelSerializer gives an array like this example below
```
[
    {
        "url": "http://localhost/api/initiatives/77/",
        "id": 77,
        "region": "http://localhost/api/regions/16/",
        [etc]
    },
```

GeoFeatureModelSerializer gives an object like this example below
Please note:
* any properties added by us are under obj->features->obj->properties
* id is located directly under obj->features
* the top-level object only contains "type" and "features"
```
{
    "type": "FeatureCollection",
    "features": [
        {
            "id": 323,
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    11.925602211999262,
                    57.69513792779139
                ]
            },
            "properties": {
                "url": "http://localhost/api/locations/323/",
                "title": "Såggatan 19",
                "initiative": null
            }
        },
        [etc]
    ]
}
```

References:
* https://geojson.org/
* https://github.com/openwisp/django-rest-framework-gis
* https://www.django-rest-framework.org/

"""

from rest_framework import serializers
from rest_framework_gis import serializers as gis_serializers

from . import models


class FastSerializer():
    def __init__(self, data=[], context=None, many=False):
        if many:
            self.data = [self.serialize(item) for item in data]
        else:
            self.data = self.serialize(data)


class LocationSerializer(FastSerializer):
    def serialize(self, loc):
        return {
                'properties':{'title':        loc.title},
                'geometry':{'coordinates':  loc.coordinates.coords},
            }

class SlowLocationSerializer(gis_serializers.GeoFeatureModelSerializer):
    class Meta:
        fields = ("title",)  # -shown under "Properties" in the API JSON
        geo_field = "coordinates"  # this string value must match the PointField field name in models.py
        model = models.Location

class InitiativeTranslationSerializer(serializers.ModelSerializer):
    language = serializers.SlugRelatedField(read_only=True, slug_field='code')
    class Meta:
        model = models.InitiativeTranslation
        fields = ['language', 'title', 'short_description', 'description']

class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Language
        fields = ['code', 'flag', 'englishName', 'nativeName']

class InitiativeImagesSerializer(FastSerializer):
    def serialize(self, image):
        return {
            'width': image.width,
            'height': image.height,
            'url': image.url,
        }

class RegionPageSerializer(serializers.ModelSerializer):
    rp_translations = serializers.SerializerMethodField()
    def get_rp_translations(self, obj):
        translations = models.RegionPageTranslation.objects.filter(region_page=obj)
        return RegionPageTranslationSerializer(translations, many=True).data
    class Meta:
        model = models.RegionPage
        fields = ['rp_translations']

class RegionPageTitleSerializer(serializers.ModelSerializer):
    rp_translations = serializers.SerializerMethodField()
    def get_rp_translations(self, obj):
        translations = models.RegionPageTranslation.objects.filter(region_page=obj)
        return RegionPageTranslationTitleSerializer(translations, many=True).data
    class Meta:
        model = models.RegionPage
        fields = ['slug', 'rp_translations', 'order']

class RegionPageTranslationTitleSerializer(serializers.ModelSerializer):
    language = serializers.SlugRelatedField(read_only=True, slug_field='code')
    class Meta:
        model = models.RegionPageTranslation
        fields = ['title', 'language']

class RegionPageTranslationSerializer(serializers.ModelSerializer):
    language = serializers.SlugRelatedField(read_only=True, slug_field='code')
    class Meta:
        model = models.RegionPageTranslation
        fields = ['title', 'language', 'description']

class RegionSerializer(gis_serializers.GeoFeatureModelSerializer):
    def get_rp_region(self, obj):
        pages = models.RegionPage.objects.filter(region=obj)
        return RegionPageTitleSerializer(pages, many=True).data
    rp_region = serializers.SerializerMethodField()
    class Meta:
        fields = ('slug', 'welcome_message_html', 'title', 'rp_region')
        geo_field = 'area'
        model = models.Region


class TagSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.Tag
        fields = ['title', 'slug']

class OptimizedTagSerializer(FastSerializer):
    def serialize(self, tag):
        return tag.slug

class InitiativeSerializer(serializers.ModelSerializer):
    # Object name (and below field name) "locations" must match `related_name` in model. DRF docs:
    # https://www.django-rest-framework.org/api-guide/relations/#reverse-relations
    locations = SlowLocationSerializer(many=True)
    tags = serializers.SlugRelatedField(slug_field='slug', many=True, read_only=True)
    region = serializers.SlugRelatedField(slug_field='slug', read_only=True)
    initiative_translations = InitiativeTranslationSerializer(many=True, read_only=True)
    initiative_images = InitiativeImagesSerializer(many=True)

    class Meta:
        model = models.Initiative
        fields = [
            'slug', 'id',
            'locations',
            'initiative_translations',
            'tags',
            'region',
            'initiative_images',
            'main_image_url',
            'facebook', 'instagram', 'phone', 'homepage', 'mail',
            'state', 'promote',
            'online_only', 'area',
        ]

class OptimizedInitiativeSerializer():
    # TODO
    # Annotate each fields contribution
    # only the objects                       22.8ms ±  8.5ms
    # without any related tables +  3.1ms =  25.9ms ±  4.7ms
    # tags                       + 18.8ms =  44.7ms ±  9.0ms
    # translations               + 29.6ms =  74.3ms ± 11.6ms
    # region                     +  9.4ms =  83.7ms ± 11.5ms
    # images                     + 39.2ms = 122.9ms ± 16.9ms
    # locations                  + 53.8ms = 176.7ms ± 16.7ms
    def __init__(self, i, context=None, many=False):
        tags_view = models.Tag.objects.all()
        tag_slugs = {}
        for tag in tags_view:
            tag_slugs[tag.id] = tag.slug

        region_view = models.Region.objects.all()
        region_slugs = {}
        for region in region_view:
            region_slugs[region.id] = region.slug

        language_view = models.Language.objects.all()
        language_slugs = {}
        for language in language_view:
            language_slugs[language.id] = language.code

        initiative_tags_view = models.Initiative.tags.through.objects.values()
        it = {}
        for itv in initiative_tags_view:
            iid = itv['initiative_id']
            if iid not in it:
                it[iid] = []
            it[iid].append(tag_slugs[itv['tag_id']])

        # takes 120ms. at least 60ms Geo-Related by Point.__init__
        all_locations_view = models.Location.objects.all() # 90ms
        initiative_locations = {}
        for location in all_locations_view:
            iid = location.initiative_id
            if iid not in initiative_locations:
                initiative_locations[iid] = []
            initiative_locations[iid].append(LocationSerializer(location).data)

        all_images = models.InitiativeImage.objects.all()
        initiative_images = {}
        for image in all_images:
            iid = image.initiative_id
            if iid not in initiative_images:
                initiative_images[iid] = []
            initiative_images[iid].append(InitiativeImagesSerializer(image).data)

        all_translations = models.InitiativeTranslation.objects.all()
        initiative_translations = {}
        for translation in all_translations:
            iid = translation.initiative_id
            if iid not in initiative_translations:
                initiative_translations[iid] = []
            initiative_translations[iid].append({
                'language': language_slugs[translation.language_id],
                'title': translation.title,
                'short_description': translation.short_description,
                'description': translation.description,
            })

        self.data = [{
            'locations': {'features': initiative_locations.get(ini.id, [])},
            'id': ini.id,
            'slug' : ini.slug,
            'region' : region_slugs[ini.region_id],
            'main_image_url' : ini.main_image_url,
            'facebook' : ini.facebook,
            'instagram' : ini.instagram,
            'phone' : ini.phone,
            'initiative_images': initiative_images.get(ini.id, []),
            'initiative_translations': initiative_translations.get(ini.id, []),
            'homepage' : ini.homepage,
            'mail' : ini.mail,
            'area' : ini.area,
            'online_only': ini.online_only,
            'promote': ini.promote,
            'state': ini.state,
            'tags' : it.get(ini.id, [])
        } for ini in i]


class TagDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Tag
        fields = ['title', 'slug']
