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


class RegionViewSet(rest_framework.viewsets.ReadOnlyModelViewSet):
    queryset = models.Region.objects.all()
    serializer_class = serializers.RegionSerializer
