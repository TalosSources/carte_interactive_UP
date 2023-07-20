from django.contrib.gis import geos
from django.contrib.gis.db import models as gis_models
from django.db import models
from django_ckeditor_5.fields import CKEditor5Field


class Region(gis_models.Model):
    sk3_id = models.IntegerField(null=True, blank=True, unique=True)

    title = models.CharField(max_length=127, unique=True)  # including "alla områden"
    slug = models.SlugField(max_length=127, unique=True)
    # https://docs.djangoproject.com/en/4.1/ref/models/fields/#slugfield

    # header_html = models.CharField(max_length=32767)
    welcome_message_html = models.CharField(max_length=32767)  # called welcome_message in sk3

    area = gis_models.PolygonField(default=geos.Polygon(
        geos.LinearRing(((12, 58), (12.1, 58.1), (12.1, 58.2), (12, 58)))
    ))

    # footer_html = models.CharField(max_length=32767)

    def __str__(self):
        return self.slug  # change to title if/when available


class Tag(models.Model):
    slug = models.SlugField(max_length=127, unique=True)
    title = gis_models.CharField(max_length=127, unique=True)

    def __str__(self):
        return self.title


class Language(models.Model):
    englishName = models.CharField(max_length=20, unique=True)
    nativeName = models.CharField(max_length=20, unique=True)
    flag = models.CharField(max_length=2, unique=True)
    code = models.SlugField(max_length=2, unique=True)
    default = models.CharField(max_length=1, choices=[("d", "default")], unique=True, null=True)

    def __str__(self):
        return self.englishName

class Initiative(models.Model):
    # Multiple values can be NULL and not violate uniqueness. See: https://stackoverflow.com/a/1400046/2525237
    # This means that we can use NULL/None for all new rows/items that we add
    region = models.ForeignKey(Region, related_name='initiatives', on_delete=models.CASCADE)
    tags = models.ManyToManyField(Tag, related_name='initiatives')
    main_image_url = models.URLField(null=True, blank=True)
    slug = models.SlugField(max_length=127, unique=True)

    instagram = models.CharField(max_length=127, null=True, blank=True)
    facebook = models.CharField(max_length=1023, null=True, blank=True)
    homepage = models.CharField(max_length=1023, null=True, blank=True)
    mail = models.CharField(max_length=127, null=True, blank=True)
    phone = models.CharField(max_length=127, null=True, blank=True)
    promote = models.BooleanField(default=False)
    area = models.CharField(max_length=255, blank=True)
    online_only = models.BooleanField()
    needs_attention = models.BooleanField()
    state = models.CharField(max_length=1, choices=[("h", "hidden"), ("r", "only via permalink"), ("p", "published")])
    short_comment = models.CharField(max_length=100, blank=True)
    history = models.TextField(max_length=10000, blank=True)

    def __str__(self):
        return self.slug

    def get_absolute_url(self):
        # https://docs.djangoproject.com/en/4.1/ref/models/instances/#django.db.models.Model.get_absolute_url
        # Better to use reverse?
        # Example: http://localhost/details/2
        # Having defined this method enables "view on site" in the admin interface
        return f"/details/{self.slug}"

class InitiativeImage(models.Model):
    initiative = models.ForeignKey(Initiative, related_name='initiative_images', on_delete=models.CASCADE)
    url = models.URLField()
    width = models.IntegerField()
    height = models.IntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['initiative', 'width', 'height'], name='max one image per size and initiative')
        ]

class RegionPage(models.Model):
    region = models.ForeignKey(Region, related_name='rp_region', on_delete=models.CASCADE)
    slug = models.SlugField(max_length=127)
    order = models.IntegerField()
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['region', 'order'], name='order for region clear'),
            models.UniqueConstraint(fields=['region', 'slug'], name='slug for region unique'),
        ]

class RegionPageTranslation(models.Model):
    language = models.ForeignKey(Language, related_name='rp_language', on_delete=models.PROTECT)
    title = models.CharField(max_length=127)
    description = CKEditor5Field(max_length=32767, config_name='defaultWithoutImages')
    region_page = models.ForeignKey(RegionPage, on_delete=models.CASCADE, related_name="rp_translations")
    sk3_id = models.IntegerField(unique=True)
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['language', 'region_page'], name='only one translation per page'),
        ]

class InitiativeTranslation(models.Model):
    sk3_id = models.IntegerField(null=True, blank=True, unique=True)
    language = models.ForeignKey(Language, related_name='it_language', on_delete=models.PROTECT)
    title = models.CharField(max_length=127)
    initiative = models.ForeignKey(Initiative, related_name='initiative_translations', on_delete=models.CASCADE)
    description = CKEditor5Field(max_length=32767, config_name='defaultWithoutImages')
    short_description = models.TextField(max_length=1000)

    def __str__(self):
        return self.title

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['initiative', 'language'], name='max one translation per languageKey and initiative')
        ]

class Location(gis_models.Model):
    sk3_id = models.IntegerField(null=True, blank=True, unique=True)
    title = gis_models.CharField(max_length=127)
    coordinates = gis_models.PointField()
    # Please note the `related_name` kw parameter (used in the serializer)
    # For explanation of blank and null, please see this answer+comments: https://stackoverflow.com/a/6620137/2525237
    initiative = gis_models.ForeignKey(Initiative, related_name='locations', on_delete=models.CASCADE)

    def __str__(self):
        return self.title
