"""
Django settings for smartakartan4 project.

Generated by 'django-admin startproject' using Django 4.1.1.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.1/ref/settings/
"""
import os
import sys
from pathlib import Path

DATA_UPLOAD_MAX_NUMBER_FIELDS = 2000  # -so we can handle tags in the admin interface

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-bpxf1_ptsh&l9ee#veu9plmu4h+dlt%ddd&i)95ewv)aj7!(bv'  # <- TODO

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# HOST = os.environ["HOST"] if os.environ["HOST"] else "localhost"
HOST = "localhost"
if "HOST" in os.environ:
    HOST = os.environ["HOST"]
# PUBLIC_URL = (os.environ["SCHEME"] if os.environ["SCHEME"] else 'http') + "://" + HOST
PUBLIC_URL = 'http'
if "SCHEME" in os.environ:
    PUBLIC_URL = os.environ["SCHEME"]
PUBLIC_URL += "://" + HOST

ALLOWED_HOSTS = [HOST,
 "beta.smartakartan.se",
 "www.beta.smartakartan.se",
 ]

# Application definition

INSTALLED_APPS = [
    'website',
    'corsheaders',
    'rest_framework_gis',
    'rest_framework',
    'django.contrib.gis',  # GeoDjango <-
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_ckeditor_5',
]

MIDDLEWARE = [
    'django.middleware.gzip.GZipMiddleware',
    'csp.middleware.CSPMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # <-
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'smartakartan4.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates']
        ,
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'smartakartan4.wsgi.application'

# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',  # <- postgis is a special version of postgresql
        'HOST': 'db',  # <- the docker network name alias. (Previously 127.0.0.1)
        'PORT': 5432,
        'NAME': 'smarta_kartan_db',
        'PASSWORD': 'nwKnN7kgftitCpc',  # <- TODO
        'USER': 'postgres',
    }
}
NO_DOCKER = "NO_DOCKER"
if NO_DOCKER in os.environ and os.environ[NO_DOCKER]:
    DATABASES['default']['HOST'] = '127.0.0.1'

# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = 'en-us'  # <- TODO

TIME_ZONE = 'Europe/Stockholm'  # <- TODO

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL = 'django_static/'

# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ORIGIN_WHITELIST = [PUBLIC_URL, "https://smartakartan.entrop.mywire.org"]
CORS_ALLOWED_ORIGINS = [PUBLIC_URL, "https://smartakartan.entrop.mywire.org", "http://localhost", "https://smartakartan.se", "https://beta.smartakartan.se", "https://www.beta.smartakartan.se"]
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS
CSP_SCRIPT_SRC = [
    "https://unpkg.com",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net",
    "'unsafe-inline'",
] + ALLOWED_HOSTS
CSP_DEFAULT_SRC = [
    "https://unpkg.com",
    "https://cdn.jsdelivr.net",
    "'unsafe-inline'",
    "'self'",
    "http://a.tile.openstreetmap.org",
    "http://b.tile.openstreetmap.org",
    "http://c.tile.openstreetmap.org",
    "https://tile.openstreetmap.org",
    "https://cdnjs.cloudflare.com",
]

MEDIA_URL = '/media/'
MEDIA_ROOT = '/media'

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

customColorPalette = [
    {
        'color': 'hsl(4, 90%, 58%)',
        'label': 'Red'
    },
    {
        'color': 'hsl(340, 82%, 52%)',
        'label': 'Pink'
    },
    {
        'color': 'hsl(291, 64%, 42%)',
        'label': 'Purple'
    },
    {
        'color': 'hsl(262, 52%, 47%)',
        'label': 'Deep Purple'
    },
    {
        'color': 'hsl(231, 48%, 48%)',
        'label': 'Indigo'
    },
    {
        'color': 'hsl(207, 90%, 54%)',
        'label': 'Blue'
    },
]

#CKEDITOR_5_CUSTOM_CSS = 'path_to.css' # optional
#CKEDITOR_5_FILE_STORAGE = "path_to_storage.CustomStorage" # optional
CKEDITOR_5_CONFIGS = {
'defaultWithoutImages': {
    'toolbar': ['heading', '|', 'bold', 'italic', 'link',
                'bulletedList', 'numberedList', 'blockQuote', ],

},
'default': {
    'toolbar': ['heading', '|', 'bold', 'italic', 'link',
                'bulletedList', 'numberedList', 'blockQuote', 'imageUpload', 'fontSize', 'fontFamily', 'fontColor','mediaEmbed', 'sourceEditing', ],

},
'extends': {
    'blockToolbar': [
        'paragraph', 'heading1', 'heading2', 'heading3',
        '|',
        'bulletedList', 'numberedList',
        '|',
        'blockQuote',
    ],
    'toolbar': ['heading', '|', 'outdent', 'indent', '|', 'bold', 'italic', 'link', 'underline', 'strikethrough',
    'code','subscript', 'superscript', 'highlight', '|', 'codeBlock', 'sourceEditing', 'insertImage',
                'bulletedList', 'numberedList', 'todoList', '|',  'blockQuote', 'imageUpload', '|',
                'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', 'mediaEmbed', 'removeFormat',
                'insertTable',],
    'image': {
        'toolbar': ['imageTextAlternative', '|', 'imageStyle:alignLeft',
                    'imageStyle:alignRight', 'imageStyle:alignCenter', 'imageStyle:side',  '|'],
        'styles': [
            'full',
            'side',
            'alignLeft',
            'alignRight',
            'alignCenter',
        ]

    },
    'table': {
        'contentToolbar': [ 'tableColumn', 'tableRow', 'mergeTableCells',
        'tableProperties', 'tableCellProperties' ],
        'tableProperties': {
            'borderColors': customColorPalette,
            'backgroundColors': customColorPalette
        },
        'tableCellProperties': {
            'borderColors': customColorPalette,
            'backgroundColors': customColorPalette
        }
    },
    'heading' : {
        'options': [
            { 'model': 'paragraph', 'title': 'Paragraph', 'class': 'ck-heading_paragraph' },
            { 'model': 'heading1', 'view': 'h1', 'title': 'Heading 1', 'class': 'ck-heading_heading1' },
            { 'model': 'heading2', 'view': 'h2', 'title': 'Heading 2', 'class': 'ck-heading_heading2' },
            { 'model': 'heading3', 'view': 'h3', 'title': 'Heading 3', 'class': 'ck-heading_heading3' }
        ]
    },
    'htmlSupport': {
        'allow': [
            {
            'name': 'iframe',
            'attributes': True,
            'classes': True,
            'styles': True
            }
        ]
    },
},
'list': {
    'properties': {
        'styles': 'true',
        'startIndex': 'true',
        'reversed': 'true',
    }
}
}