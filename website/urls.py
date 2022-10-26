from django.urls import path

from . import views

app_name = "website"  # enables the following syntax for referring to the path: website:index, website:detail
urlpatterns = [
    path('', views.WebsiteView.as_view(), name='index'),
    path('initiatives/<int:pk>', views.InitiativeDetailView.as_view(), name='detail'),
]
