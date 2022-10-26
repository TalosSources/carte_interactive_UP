import django.views.generic
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


class InitiativeDetailView(django.views.generic.DetailView):
    model = models.Initiative
    template_name = "detail.html"


class WebsiteView(django.views.generic.TemplateView):
    template_name = "index.html"
