"""
The ViewSets are used by the API which can be seen here: http://localhost/api/

Overview:
models.py -> serializers.py -> views.py
"""
import rest_framework.response
import rest_framework.viewsets

from . import models
from . import serializers


class LocationViewSet(rest_framework.viewsets.ReadOnlyModelViewSet):
    queryset = models.Location.objects.all()
    serializer_class = serializers.LocationSerializer
    """
    If we want to have bounding boxes for limiting the query results from the API we can add these lines:

    bbox_filter_field = "coordinates"
    filter_backends = (rest_framework_gis.filters.InBBOXFilter,)

    This enables us to do API calls like this:
    curl http://localhost/api/locations/?in_bbox=-90,-180,90,57.6
    Please note the order: longitude, latitude
    (This specific example will give part of the locations in Gothenburg

    References:
    * https://github.com/openwisp/django-rest-framework-gis#inbboxfilter
    * https://www.paulox.net/2021/07/19/maps-with-django-part-2-geodjango-postgis-and-leaflet/
    """

class InitiativeDetailsViewSet(rest_framework.viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.InitiativeSerializer
    def get_queryset(self):
        slug = self.request.query_params.get('slug')
        if slug is not None:
            review_initiatives = models.Initiative.objects.filter(state="r", slug=slug)
            published_initiatives = models.Initiative.objects.filter(state="p", slug=slug)
        else:
            review_initiatives = models.Initiative.objects.filter(state="r")
            published_initiatives = models.Initiative.objects.filter(state="p")
        queryset = review_initiatives.union(published_initiatives)
        return queryset


class InitiativeViewSet(rest_framework.viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.InitiativeSerializer
    def get_queryset(self):
        queryset = models.Initiative.objects.filter(state="p")
        slug = self.request.query_params.get('slug')
        if slug is not None:
            queryset = queryset.filter(slug=slug)
        return queryset


class TagViewSet(rest_framework.viewsets.ReadOnlyModelViewSet):
    queryset = models.Tag.objects.all()
    serializer_class = serializers.TagSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = serializers.TagDetailSerializer(instance)
        data = serializer.data
        return rest_framework.response.Response(data)


class RegionViewSet(rest_framework.viewsets.ReadOnlyModelViewSet):
    queryset = models.Region.objects.all()
    serializer_class = serializers.RegionSerializer

class LanguageViewSet(rest_framework.viewsets.ReadOnlyModelViewSet):
    queryset = models.Language.objects.all()
    serializer_class = serializers.LanguageSerializer