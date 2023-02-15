from rest_framework import serializers
from rest_framework_gis import serializers as gis_serializers

from . import models


class LocationSerializer(gis_serializers.GeoFeatureModelSerializer):
    """
    > GeoFeatureModelSerializer is a subclass of rest_framework.ModelSerializer which will output data in a format that
    > is GeoJSON compatible.

    > GeoFeatureModelSerializer requires you to define a geo_field to be serialized as the "geometry".

    > The primary key of the model (usually the "id" attribute) is automatically used as the id field of each GeoJSON
    > Feature Object.

    https://github.com/openwisp/django-rest-framework-gis#geofeaturemodelserializer
    """

    class Meta:
        fields = ('url', "id", "title", "initiative")  # -shown under "Properties" in the API JSON
        geo_field = "coordinates"  # this string value must match the PointField field name in models.py
        model = models.Location
        # TODO: bbox
        # Two alternatives:
        # https://github.com/openwisp/django-rest-framework-gis#bounding-box-auto_bbox-and-bbox_geo_field
        # Also see this: https://www.paulox.net/2021/07/19/maps-with-django-part-2-geodjango-postgis-and-leaflet/


class InitiativeTitleTextSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.InitiativeTitleText
        fields = ['language_code', 'text']


class InitiativeDescriptionTextSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.InitiativeDescriptionText
        fields = ['language_code', 'text']


class RegionSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        fields = ('url', 'id', 'slug', 'welcome_message_html', 'title')
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
