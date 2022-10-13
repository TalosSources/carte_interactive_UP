from django.shortcuts import render
from django.http import HttpResponse
import django.views.generic
import rest_framework.viewsets
from . import models
from . import serializers


class MainPageViewSet(rest_framework.viewsets.ReadOnlyModelViewSet):
    queryset = models.Location.objects.all()
    serializer_class = serializers.LocationSerializer
    # TODO: Filter?


class MainPageView(django.views.generic.TemplateView):
    template_name = "main_page/index.html"
