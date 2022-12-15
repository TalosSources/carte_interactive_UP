import django.contrib.gis.geos
import django.db.utils
import django.urls
import rest_framework.test
from django.test import TestCase

from . import models

"""
A test database is automatically used, instead of the real database
"""


class ModelTest(TestCase):
    def test_create_initiative(self):
        # `.objects.create` is not used in the Django tutorial https://docs.djangoproject.com/en/4.1/intro/tutorial05/
        new_initiative = models.Initiative.objects.create(
            name="a name", description="a description", online_only=False)

    def test_create_initiative_with_long_name(self):
        long_text = "abc" * 100
        try:
            new_initiative = models.Initiative.objects.create(
                name=long_text, description="a description", online_only=False)
        except django.db.utils.DataError:
            pass
        else:
            self.fail()
        # Alternatively we can use: self.assertRaises(django.db.utils.DataError, ....)

    def test_create_with_missing_initiative(self):
        coord_point = django.contrib.gis.geos.Point(15, 15)
        try:
            new_location = models.Location.objects.create(
                address="an address", coordinates=coord_point)
        except django.db.utils.IntegrityError:
            # psycopg2.errors.NotNullViolation
            pass
        else:
            self.fail()


class ViewTest(TestCase):
    def test_website(self):
        url = django.urls.reverse("website:index")
        http_response = self.client.get(url)
        self.assertEqual(http_response.status_code, 200)
        self.assertContains(http_response, "Map")  # -looks inside http_response.content (i assume)
        self.assertContains(http_response, "Cards")
        self.assertNotContains(http_response, "asdf")
        # We don't use assertQuerysetEqual here since we fetch our data through our API (rather than Django templates)

    def test_initiative_detail_page(self):
        url = django.urls.reverse("website:detail", kwargs={'pk': 1})
        http_response = self.client.get(url)
        self.assertEqual(http_response.status_code, 404)

        new_initiative = models.Initiative.objects.create(
            name="a name", description="a description", online_only=False)
        # The id may not be 0 or 1, it may be higher, but that doesn't mean that other initiatives have been added. To
        # verify we can try `list(models.Initiative.objects.filter())`
        url = django.urls.reverse("website:detail", kwargs={'pk': new_initiative.id})
        http_response = self.client.get(url)
        self.assertEqual(http_response.status_code, 200)


def create_location():
    new_initiative = models.Initiative.objects.create(
        name="a name", description="a description", online_only=False)
    coord_point = django.contrib.gis.geos.Point(15, 15)
    new_location = models.Location.objects.create(
        address="an address", coordinates=coord_point, initiative=new_initiative)
    return new_location


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
