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
        fields = ("id", "address")
        geo_field = "coordinates"  # this string value must match the PointField field name in models.py
        model = models.Location
        # TODO: bbox
        # Two alternatives:
        # https://github.com/openwisp/django-rest-framework-gis#bounding-box-auto_bbox-and-bbox_geo_field
        # Also see this: https://www.paulox.net/2021/07/19/maps-with-django-part-2-geodjango-postgis-and-leaflet/


class InitiativeSerializer(serializers.HyperlinkedModelSerializer):
    user_url = serializers.HyperlinkedIdentityField(view_name='detail', format='html')
    # Field name must match `related_name` in model. DRF docs:
    # https://www.django-rest-framework.org/api-guide/relations/#reverse-relations
    locations = LocationSerializer(many=True, read_only=True)

    class Meta:
        model = models.Initiative
        fields = ['url', 'id', 'name', 'user_url', 'locations']
