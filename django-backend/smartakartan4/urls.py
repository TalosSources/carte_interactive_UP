"""smartakartan4 URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import rest_framework.routers
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from website import views
from website.admin import admin_site

router = rest_framework.routers.DefaultRouter()
router.register(r"initiatives", views.InitiativeViewSet, basename="initiative")
router.register(r"initiativeDetails", views.InitiativeDetailsViewSet, basename="initiativeDetails")
router.register(r"regions", views.RegionViewSet, basename="region")
router.register(r"regionPage", views.RegionPageViewSet, basename="regionPage")
router.register(r"tags", views.TagViewSet, basename="tag")
router.register(r"languages", views.LanguageViewSet, basename="language")

urlpatterns = [
    path('', include('website.urls')),  # standard website interface
    path('api/', include(router.urls)),  # API interface
    path('admin/', admin_site.urls),  # Admin interface
]
urlpatterns += [
    path("ckeditor5/", include('django_ckeditor_5.urls'), name="ck_editor_5_upload_file"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
