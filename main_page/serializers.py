import rest_framework.serializers
import rest_framework_gis.serializers

from . import models


class LocationSerializer(rest_framework_gis.serializers.GeoFeatureModelSerializer):
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
        geo_field = "coordinates"  # -must match the PointField variable in models.py
        # -https://github.com/openwisp/django-rest-framework-gis#using-geometryserializermethodfield-as-geo_field
        model = models.Location


class InitiativeSerializer(rest_framework.serializers.HyperlinkedModelSerializer):
    user_url = rest_framework.serializers.HyperlinkedIdentityField(view_name='detail', format='html')
    # location_id = rest_framework.serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    # Field name must match `related_name` in model
    # DRF docs: https://www.django-rest-framework.org/api-guide/relations/#reverse-relations
    locations = LocationSerializer(many=True, read_only=True)

    class Meta:
        model = models.Initiative
        fields = ['url', 'id', 'name', 'user_url', 'locations']
