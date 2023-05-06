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


class LocationSerializer(gis_serializers.GeoFeatureModelSerializer):
    class Meta:
        fields = ("title", "id")  # -shown under "Properties" in the API JSON
        geo_field = "coordinates"  # this string value must match the PointField field name in models.py
        model = models.Location


class InitiativeTranslationSerializer(serializers.ModelSerializer):
    language = serializers.SlugRelatedField(read_only=True, slug_field='code')
    class Meta:
        model = models.InitiativeTranslation
        fields = ['language', 'title', 'short_description']

class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Language
        fields = ['code', 'flag', 'englishName', 'nativeName']

class InitiativeImagesSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.InitiativeImage
        fields = ['width', 'height', 'url']


class RegionSerializer(gis_serializers.GeoFeatureModelSerializer):
    class Meta:
        fields = ('slug', 'welcome_message_html', 'title')
        geo_field = 'area'
        model = models.Region


class TagSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.Tag
        fields = ['title', 'slug']

class SlimTagSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.Tag
        fields = ['slug']


class InitiativeSerializer(serializers.HyperlinkedModelSerializer):
    """
    Object name (and below field name) "locations" must match `related_name` in model. DRF docs:
    https://www.django-rest-framework.org/api-guide/relations/#reverse-relations
    """
    locations = LocationSerializer(many=True, read_only=True)
    tags = SlimTagSerializer(many=True, read_only=True)
    initiative_translations = InitiativeTranslationSerializer(many=True, read_only=True)
    initiative_images = InitiativeImagesSerializer(many=True, read_only=True)

    class Meta:
        model = models.Initiative
        fields = [
            'slug', 'id',
            'locations', 'initiative_translations', 'tags',
            'initiative_images',
            'main_image_url',
            'facebook', 'instagram', 'phone', 'homepage', 'mail'
        ]


class TagDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Tag
        fields = ['title', 'slug']
