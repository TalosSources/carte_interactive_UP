# Generated by Django 4.2.3 on 2023-07-19 10:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('website', '0020_regionpagetranslation_sk3_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='regionpage',
            name='order',
            field=models.IntegerField(),
        ),
    ]
