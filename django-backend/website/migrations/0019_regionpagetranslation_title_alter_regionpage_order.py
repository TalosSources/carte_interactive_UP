# Generated by Django 4.2.3 on 2023-07-18 14:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('website', '0018_remove_initiative_published_alter_initiative_history'),
    ]

    operations = [
        migrations.AddField(
            model_name='regionpagetranslation',
            name='title',
            field=models.CharField(default='', max_length=127),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='regionpage',
            name='order',
            field=models.IntegerField(unique=True),
        ),
    ]
