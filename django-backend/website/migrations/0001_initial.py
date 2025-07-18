# Generated by Django 4.1.6 on 2023-02-15 14:12

import django.contrib.gis.db.models.fields
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Initiative',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sk3_id', models.IntegerField(blank=True, null=True, unique=True)),
                ('main_image_url', models.URLField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Region',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sk3_id', models.IntegerField(blank=True, null=True, unique=True)),
                ('title', models.CharField(max_length=127, unique=True)),
                ('slug', models.SlugField(max_length=127, unique=True)),
                ('welcome_message_html', models.CharField(max_length=32767)),
            ],
        ),
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('slug', models.SlugField(max_length=127, unique=True)),
                ('title', models.CharField(max_length=127, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Location',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sk3_id', models.IntegerField(blank=True, null=True, unique=True)),
                ('title', models.CharField(max_length=127)),
                ('coordinates', django.contrib.gis.db.models.fields.PointField(srid=4326)),
                ('initiative', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='locations', to='website.initiative')),
            ],
        ),
        migrations.CreateModel(
            name='InitiativeTitleText',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sk3_id', models.IntegerField(blank=True, null=True, unique=True)),
                ('language_code', models.CharField(max_length=2)),
                ('text', models.CharField(max_length=127)),
                ('initiative', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='initiative_title_texts', to='website.initiative')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='InitiativeDescriptionText',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sk3_id', models.IntegerField(blank=True, null=True, unique=True)),
                ('language_code', models.CharField(max_length=2)),
                ('text', models.TextField(max_length=32767)),
                ('initiative', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='initiative_description_texts', to='website.initiative')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.AddField(
            model_name='initiative',
            name='region',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='initiatives', to='website.region'),
        ),
        migrations.AddField(
            model_name='initiative',
            name='tags',
            field=models.ManyToManyField(related_name='initiatives', to='website.tag'),
        ),
    ]
