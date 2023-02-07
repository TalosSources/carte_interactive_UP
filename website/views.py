import rest_framework.response
import rest_framework.viewsets

from . import models
from . import serializers


class LocationViewSet(rest_framework.viewsets.ReadOnlyModelViewSet):
    queryset = models.Location.objects.all()
    serializer_class = serializers.LocationSerializer
    # TODO: Filter and bbox


class InitiativeViewSet(rest_framework.viewsets.ReadOnlyModelViewSet):
    queryset = models.Initiative.objects.all()
    serializer_class = serializers.InitiativeSerializer


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
