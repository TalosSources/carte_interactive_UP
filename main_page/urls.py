from django.urls import path

from . import views

app_name = "main_page"  # -enables this syntax for referring to the path: main_page:index, main_page:detail
urlpatterns = [
    path('', views.MainPageView.as_view(), name='index'),
    path('initiatives/<int:pk>', views.InitiativeDetailView.as_view(), name='detail'),
]
