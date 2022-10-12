from django.shortcuts import render
from django.http import HttpResponse
import django.views.generic


class MainPageView(django.views.generic.TemplateView):
    template_name = "main_page/index.html"


"""
def index(request):
    return HttpResponse("Hello world")
"""
