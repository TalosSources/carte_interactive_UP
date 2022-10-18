import django.views.generic
import rest_framework.viewsets

from . import models
from . import serializers


class LocationViewSet(rest_framework.viewsets.ReadOnlyModelViewSet):
    queryset = models.Location.objects.all()
    serializer_class = serializers.LocationSerializer
    # TODO: Filter and bbox?


class InitiativeViewSet(rest_framework.viewsets.ReadOnlyModelViewSet):
    queryset = models.Initiative.objects.all()
    serializer_class = serializers.InitiativeSerializer


class MainPageView(django.views.generic.TemplateView):
    template_name = "main_page/index.html"
