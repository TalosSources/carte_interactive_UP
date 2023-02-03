import django.contrib.gis.geos
import django.db.utils
import django.urls
import rest_framework.test
from django.test import TestCase

from . import models

"""
A test database is automatically used, instead of the real database

https://docs.djangoproject.com/en/4.1/intro/tutorial05/

"""


class IdCounter:
    id_ = 0

    @classmethod
    def get_id(cls):
        cls.id_ += 1
        return cls.id_


def create_region():
    new_region = models.Region.objects.create(slug="region_slug_name", welcome_message_html="Welcome!")
    return new_region


def create_initiative(i_title: str = "some title"):
    region_ = create_region()
    new_initiative = models.Initiative.objects.create(id=IdCounter.get_id(), region=region_)
    models.InitiativeTitleText.objects.create(language_code="en", initiative=new_initiative, text=i_title)
    return new_initiative


def create_location():
    new_initiative = create_initiative()
    coord_point = django.contrib.gis.geos.Point(15, 15)
    new_location = models.Location.objects.create(
        id=IdCounter.get_id(), title="an address", coordinates=coord_point, initiative=new_initiative)
    return new_location


class ModelTest(TestCase):
    def test_create_initiative(self):
        # `.objects.create` is not used in the Django tutorial https://docs.djangoproject.com/en/4.1/intro/tutorial05/
        new_initiative = create_initiative()

    def test_create_initiative_with_long_name(self):
        long_text = "abc" * 1000
        try:
            new_initiative = create_initiative(i_title=long_text)
        except django.db.utils.DataError:
            pass
        else:
            self.fail()
        # Alternatively we can use: self.assertRaises(django.db.utils.DataError, ....)


class ApiTest(rest_framework.test.APITestCase):
    """
    APITestCase documentation: https://www.django-rest-framework.org/api-guide/testing/
    """

    def test_location_list(self):
        # "location" is from the `basename` parameter given when creating the router. Important: A suffix has to be
        # added to get an url: "-list" or "-detail". See this SO answer: https://stackoverflow.com/a/60013997/2525237
        url = django.urls.reverse("location-list")
        http_response = self.client.get(url)
        self.assertEqual(http_response.status_code, 200)

        new_location = create_location()
        http_response = self.client.get(url)
        self.assertContains(http_response, new_location.title)
        self.assertNotContains(http_response, "asdf")

    def test_location_detail_not_existing(self):
        # When using the -detail suffix we also need to provide the key (pk) that identifies the specific item/row
        url = django.urls.reverse("location-detail", kwargs={'pk': 1})
        http_response = self.client.get(url)
        self.assertEqual(http_response.status_code, 404)

    def test_location_detail_existing(self):
        new_location = create_location()
        url = django.urls.reverse("location-detail", kwargs={'pk': new_location.id})
        http_response = self.client.get(url)
        self.assertEqual(http_response.status_code, 200)
