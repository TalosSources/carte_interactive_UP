import rest_framework.serializers
import rest_framework_gis.serializers

from . import models


class LocationSerializer(rest_framework_gis.serializers.GeoFeatureModelSerializer):
    """
    https://github.com/openwisp/django-rest-framework-gis#geofeaturemodelserializer
    """

    class Meta:
        fields = ("id", "address")
        geo_field = "coordinates"  # -must match the PointField variable in models.py
        # -https://github.com/openwisp/django-rest-framework-gis#using-geometryserializermethodfield-as-geo_field
        model = models.Location


class InitiativeSerializer(rest_framework.serializers.HyperlinkedModelSerializer):
    user_url = rest_framework.serializers.HyperlinkedIdentityField(view_name='detail', format='html')

    class Meta:
        model = models.Initiative
        fields = ['url', 'id', 'name', 'user_url']
