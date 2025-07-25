# Generated by Django 4.2.1 on 2023-05-17 19:35

from django.db import migrations, models
import django.db.models.deletion
import django_ckeditor_5.fields


class Migration(migrations.Migration):

    dependencies = [
        ('website', '0011_regionpage_initiative_promote_initiative_published_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='initiative',
            name='area',
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.AddField(
            model_name='initiative',
            name='online_only',
            field=models.BooleanField(default=False),
            preserve_default=False,
        ),
    ]
