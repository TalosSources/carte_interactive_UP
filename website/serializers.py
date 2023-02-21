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
        fields = ('url', "id", "title", "initiative")  # -shown under "Properties" in the API JSON
        geo_field = "coordinates"  # this string value must match the PointField field name in models.py
        model = models.Location


class InitiativeTitleTextSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.InitiativeTitleText
        fields = ['language_code', 'text']


class InitiativeDescriptionTextSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.InitiativeDescriptionText
        fields = ['language_code', 'text']


class RegionSerializer(gis_serializers.GeoFeatureModelSerializer):
    class Meta:
        fields = ('url', 'id', 'slug', 'welcome_message_html', 'title')
        geo_field = 'area'
        model = models.Region


class TagSerializer(serializers.HyperlinkedModelSerializer):
    # initiatives = InitiativeSerializer(many=True, read_only=True)
    # 'initiatives'
    class Meta:
        model = models.Tag
        fields = ['url', 'id', 'title', 'slug', 'initiatives']


class InitiativeSerializer(serializers.HyperlinkedModelSerializer):
    """
    Object name (and below field name) "locations" must match `related_name` in model. DRF docs:
    https://www.django-rest-framework.org/api-guide/relations/#reverse-relations
    """
    locations = LocationSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    initiative_title_texts = InitiativeTitleTextSerializer(many=True, read_only=True)
    initiative_description_texts = InitiativeDescriptionTextSerializer(many=True, read_only=True)

    class Meta:
        model = models.Initiative
        fields = [
            'url', 'id', 'region', 'main_image_url',
            'locations', 'initiative_title_texts', 'initiative_description_texts', 'tags'
        ]


class TagDetailInitiativeSerializer(serializers.ModelSerializer):
    initiative_title_texts = InitiativeTitleTextSerializer(many=True, read_only=True)

    class Meta:
        model = models.Initiative
        fields = ['id', 'initiative_title_texts']


class TagDetailSerializer(serializers.ModelSerializer):
    initiatives = TagDetailInitiativeSerializer(many=True, read_only=True)

    # 'initiatives'
    class Meta:
        model = models.Tag
        fields = ['id', 'title', 'slug', 'initiatives']
