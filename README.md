# Smarta Kartan 4.0

This is the repo for version 4.0 of Smarta Kartan, a future version.

The code for the current version at the time of writing is available here: https://github.com/GoteborgsStad/smartakartan3.0

The website itself is available here: https://www.smartakartan.se/

## Tech

* Django
  * GeoDjango
  * DjangoAdmin
  * ...
* Postgresql
  * PostGIS
* Leaflet
* REST
* GDAL
* ...

## Setup on Ubuntu/Debian

This has been tested on Ubuntu 22.04

OS:
* `sudo apt install gdal-bin` (GDAL)
* `sudo apt install libpq5` (PostgreSQL)
* `sudo apt install postgis` (PostgreSQL)

PIP: `pip install -r requirements.txt` (will install the various dependencies from [`requirements.txt`](requirements.txt))

(`INSTALLED_APPS` in [`settings.py`](smartakartan4/settings.py) uses some of the above)

The PostgreSQL database runs as a service in the background (see also `DATABASES` in [`settings.py`](smartakartan4/settings.py) for connection details)
