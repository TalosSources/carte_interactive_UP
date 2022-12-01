# Smarta Kartan 4.0

This is the repo for version 4.0 of Smarta Kartan, a future version.

The code for the current version (at the time of writing) is available here: https://github.com/GoteborgsStad/smartakartan3.0

## Tech

* Django (Python)
  * GeoDjango
  * DjangoAdmin
  * Django REST framework
  * ...
* Postgresql
  * PostGIS
* Leaflet (Javascript)
* REST
* GDAL
* ...

## Development setup - with docker
(Ubuntu 22.04 LTS used)

### Installing docker and docker compose

https://docs.docker.com/get-docker/

### Building image and starting the containers

`docker-compose up --build -d`

Explanation:
* `-d` - run in "detached" (background) mode
* `--build` - before starting the container we build the image
* `up` - starting the container

### Connecting to PostgreSQL and creating a new database

We need to create the database manually (but only the first time), otherwise we will get `database "smarta_kartan_db" does not exist`
1. Find container id using `docker ps`
1. Connect to the postgres: `docker exec -it [container id] psql -U postgres`
1. Create the database: `postgres=# CREATE DATABASE smarta_kartan_db;`
1. Verify that the database has been created: `postgres=# \l`

### Migrating

`docker-compose exec web python manage.py migrate`
(Verify that tables have been created:
`docker exec -it [container id] psql -U postgres`
`\dt`
)

### Starting the server

`docker-compose exec web python manage.py runserver 8000`



Typical process:
* `docker-compose up -d --build`
* `docker-compose logs`
* `docker-compose exec web python manage.py runserver 8000`
* `Testing the website`
* `docker-compose down`

Migrating the database:
* TODO


## Setup - without docker - on Ubuntu/Debian
Tested on Ubuntu 22.04 LTS

*Please note*: To run this you need to set the environment variable `NO_DOCKER` to 1. This will change
the host IP to 127.0.0.1

### Installation of dependencies

OS:
* `sudo apt install gdal-bin`
* `sudo apt install postgresql postgresql-contrib`
* `sudo apt install libpq5`
* `sudo apt install postgis`

PIP: `pip3 install -r requirements.txt` (will install the various dependencies from [`requirements.txt`](requirements.txt))

(`INSTALLED_APPS` in [`settings.py`](smartakartan4/settings.py) uses some of the above)

### Setup of PostgreSQL database

In a terminal:
1. Enter PostgreSQL shell: `sudo -u postgres psql`
1. Change password for the `postgres` user: `\password postgres`
1. Create db: `CREATE DATABASE smarta_kartan_db;`
1. Connect to db: `\connect smarta_kartan_db`
1. Exit to OS shell: `exit`
1. Verify that the db is running in the OS: `ss -nlt |grep 5432`
  * You should see a line like this: `LISTEN 0  244  127.0.0.1:5432  0.0.0.0:*`
  * You can compare these values to the values found in the `DATABASES` dict inside `settings.py`

### Starting the server

1. Update `python3 manage.py migrate`
1. Start the server: `python3 manage.py runserver 8009`

### Trying out the website

1. Create an admin user: `python3 manage.py createsuperuser`
1. Try the admin interface by going to http://127.0.0.1:8009/admin/
1. Try the normal/standard/user website by going to http://127.0.0.1:8009/


## Documentation

Requirements spec can be found [here](https://gitlab.com/kollaborativ-ekonomi/docs/-/blob/main/smarta-kartan-req-spec.md)

### Setting up a local dev environment

(This is in addition to the setup section above)

Install NodeJS: `sudo snap install node --classic`


## Documentation for Dependencies

### Hardware and OS

Server:
* _
* 

Ubuntu:
* _

### Docker

Postgis image: https://registry.hub.docker.com/r/postgis/postgis/
Postgres image: https://hub.docker.com/_/postgres

Docker-compose docs: https://docs.docker.com/compose/

Tutorials:
* https://docs.docker.com/get-started/ - *Recommended*
* https://learndjango.com/tutorials/django-docker-and-postgresql-tutorial - *Recommended*
* https://github.com/docker/awesome-compose/tree/master/official-documentation-samples/django

### Backend

PostgreSQL:
* Setup on Ubuntu (unofficial): https://www.cherryservers.com/blog/how-to-install-and-setup-postgresql-server-on-ubuntu-20-04
* Top-level docs page: https://postgis.net/documentation/

PostGIS:
* https://postgis.net/documentation/

Psycopg:
* https://www.psycopg.org/
* https://www.psycopg.org/docs/
* https://pypi.org/project/psycopg2/

Python:
* Reference: https://docs.python.org/3/

Django:
* Tutorial in 7 parts: https://docs.djangoproject.com/en/4.1/intro/tutorial01/
* Top-level docs page: https://docs.djangoproject.com/en/4.1/

GeoDjango:
* Tutorial: https://docs.djangoproject.com/en/4.1/ref/contrib/gis/tutorial/
* Top-level docs page: https://docs.djangoproject.com/en/4.1/ref/contrib/gis/
* Uses this namespace: `django.contrib.gis`
* https://gis.stackexchange.com/questions/tagged/geodjango?tab=Votes

Django REST framework:
* Quickstart tutorial: https://www.django-rest-framework.org/tutorial/quickstart/
* Tutorial in 6 parts: https://www.django-rest-framework.org/tutorial/1-serialization/

django-rest-framework-gis:
* General documentation: https://github.com/openwisp/django-rest-framework-gis#django-rest-framework-gis

### Frontend

Javascript:
* Tutorial: https://developer.mozilla.org/en-US/docs/Learn/JavaScript
* Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference
* Book: https://www.oreilly.com/library/view/javascript-the-definitive/9781491952016/

Leaflet:
* Tutorials: https://leafletjs.com/examples.html
  * Quickstart: https://leafletjs.com/examples/quick-start/
  * Leaflet on Mobile: https://leafletjs.com/examples/mobile/ --- Fullscreen on mobile, and finding user location
  * Using GeoJSON with Leaflet: https://leafletjs.com/examples/geojson/
  * Markers With Custom Icons: https://leafletjs.com/examples/custom-icons/
  * Accessible maps: https://leafletjs.com/examples/accessibility/
* API reference: https://leafletjs.com/reference.html

React:
* Tutorial: https://reactjs.org/tutorial/tutorial.html
* Tool: React Developer Tools (browser plugin)

React Router:
* Tutorial (official): https://github.com/remix-run/react-router/blob/main/docs/start/tutorial.md
* Tutorial: https://www.w3schools.com/react/react_router.asp (v6)
* Tutorial: https://www.geeksforgeeks.org/reactjs-router (v6)
* https://blog.webdevsimplified.com/2022-07/react-router/ (v6)

Bootstrap:
* _

### Standards and other concepts

GeoJSON:
* Official: https://geojson.org/
* For experimenting with a map: https://geojson.io/
* Wikipedia: https://en.wikipedia.org/wiki/GeoJSON (see examples and below them [geometries](https://en.wikipedia.org/wiki/GeoJSON#Geometries))

GIS:
* https://en.wikipedia.org/wiki/Geographic_information_system

### Overarching/combinations

Maps with Django, etc:
* https://www.paulox.net/2021/07/19/maps-with-django-part-2-geodjango-postgis-and-leaflet/ *Recommended*

React+Django:
* Tutorial: https://blog.logrocket.com/using-react-django-create-app-tutorial/
* Tutorial: https://www.digitalocean.com/community/tutorials/build-a-to-do-application-using-django-and-react
* SO q+a: https://stackoverflow.com/questions/41867055/how-to-get-django-and-reactjs-to-work-together



## Appendix: PostgreSQL guidance

The PostgreSQL database runs as a service in the background (see also `DATABASES` in [`settings.py`](smartakartan4/settings.py) for connection details)

`sudo -u postgres psql` brings up the PostgreSQL terminal. `postgres` is a special user in the OS, and works as the admin user for PostgreSQL. Here are some useful commands:
* Checking the connection: `\conninfo`
* Listing all databases: `\l` or `\list`
* Listing all users: `\du`
* Changing the password: `\password [user name]` --- this must be done when logged in as the admin user `postgres`, even if changing the password for another user)
* Connecting to a database: `\c [db name]` or `\connect [db name]`
* Listing all tables in a database: `\dt`
* Executing a database command: `[db command];` --- Please note the `;` at the end
* Exit to shell: `ctrl+d`, `\q` or `exit`

More here: https://www.geeksforgeeks.org/postgresql-psql-commands/

Please note:
* The default username and the default database name are the same: `postgres`
* Each time you _______

## Appendix: Updating (migrating) the database to match the Django model

If we haven't done the migration we will get an error message when trying to access the relevant part of the admin interface

1. Update `model.py`
2. `python manage.py makemigrations`
3. `python manage.py migrate`

This will update the database.  We can see the results like this:
```
arbetstraning@sunyata-HP-Laptop:~$ sudo -u postgres psql
[...]
postgres=# \c smarta_kartan_db
[...]
smarta_kartan_db=# \dt
                   List of relations
 Schema |            Name            | Type  |  Owner   
--------+----------------------------+-------+----------
 public | [table_name]               | table | postgres
[...]
 public | [table_name]               | table | postgres
```

***

# Problems and solutions

## No installed app with label 'website/'.

`python manage.py makemigrations website/`

Solution: Remove the slash at the end `python manage.py makemigrations website` or simply run `python manage.py makemigrations`

## "No changes detected" after running `python manage.py makemigrations`

Unclear what the solution is, but try to create a migrations file. `python manage.py makemigrations` should work for
this purpose, if not you may want to try `python manage.py startapp [app-name]` and try again (despite getting an
error message)

***

