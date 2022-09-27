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
* `sudo apt install gdal-bin`
* `sudo apt install postgresql postgresql-contrib`
* `sudo apt install libpq5`
* `sudo apt install postgis`

PIP: `pip3 install -r requirements.txt` (will install the various dependencies from [`requirements.txt`](requirements.txt))

(`INSTALLED_APPS` in [`settings.py`](smartakartan4/settings.py) uses some of the above)

## Getting started

Useful tutorials:
* https://www.paulox.net/2021/07/19/maps-with-django-part-2-geodjango-postgis-and-leaflet/
* https://docs.djangoproject.com/en/4.1/ref/contrib/gis/tutorial/
* https://leafletjs.com/examples/quick-start/
* https://docs.djangoproject.com/en/4.1/intro/tutorial01/ (first of 7 parts)
* https://www.cherryservers.com/blog/how-to-install-and-setup-postgresql-server-on-ubuntu-20-04

## Appendix A: PostgreSQL

The PostgreSQL database runs as a service in the background (see also `DATABASES` in [`settings.py`](smartakartan4/settings.py) for connection details)

`sudo -u postgres psql` brings up the PostgreSQL terminal. `postgres` is a special user in the OS, and works as the admin user for PostgreSQL. Here are some useful commands:
* Checking the connection: `\conninfo`
* Listing all databases: `\l` or `\list`
* Listing all users: `\du`
* Changing the password: `\password [user name]` --- this must be done when logged in as the admin user `postgres`, even if changing the password for another user)
* Connecting to a database: `\c [db name]` or `\connect [db name]`
* Executing a database command: `[db command];` --- Please note the `;` at the end
* Exit to shell: `ctrl+d`, `\q` or `exit`

Please note:
* the default user and the default database name are the same: `postgres`
* Each time you 

`CREATE DATABASE smarta_kartan_db;`
\c smarta_kartan_db

```
postgres=# \c smarta_kartan_db
You are now connected to database "smarta_kartan_db" as user "postgres".
smarta_kartan_db=#
```

`ss -nlt|grep 5432`

```
arbetstraning@sunyata-HP-Laptop:~$ ss -nlt|grep 5432
LISTEN 0      244             127.0.0.1:5432       0.0.0.0:*          
arbetstraning@sunyata-HP-Laptop:~$ 
```

Comparing these values to the values found in `settings.py`


```
/home/arbetstraning/PycharmProjects/smartakartan4/venv/bin/python /home/arbetstraning/PycharmProjects/smartakartan4/manage.py runserver 8000 
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).

You have 18 unapplied migration(s). Your project may not work properly until you apply the migrations for app(s): admin, auth, contenttypes, sessions.
Run 'python manage.py migrate' to apply them.
September 27, 2022 - 07:23:13
Django version 4.1.1, using settings 'smartakartan4.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```
