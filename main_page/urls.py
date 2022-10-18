from django.urls import path

from . import views

urlpatterns = [
    path('', views.MainPageView.as_view(), name='index'),
    path('<int:pk>', views.InitiativeDetailView.as_view(), name='detail'),
]
