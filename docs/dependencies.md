
This document has two sections:

* External Documentation for Dependencies
* Help using dependencies

# External Documentation for Dependencies

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

GIS:
* https://en.wikipedia.org/wiki/Geographic_information_system

### REST API

REST:
* Wikipedia: https://en.wikipedia.org/wiki/Representational_state_transfer
* https://restfulapi.net/
* https://www.redhat.com/en/topics/api/what-is-a-rest-api

GeoJSON:
* Official: https://geojson.org/
* For experimenting with a map: https://geojson.io/
* Wikipedia: https://en.wikipedia.org/wiki/GeoJSON (see examples and below them [geometries](https://en.wikipedia.org/wiki/GeoJSON#Geometries))

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


### Overarching/combinations

Maps with Django, etc:
* https://www.paulox.net/2021/07/19/maps-with-django-part-2-geodjango-postgis-and-leaflet/ *Recommended*

React+Django:
* Tutorial: https://blog.logrocket.com/using-react-django-create-app-tutorial/
* Tutorial: https://www.digitalocean.com/community/tutorials/build-a-to-do-application-using-django-and-react
* SO q+a: https://stackoverflow.com/questions/41867055/how-to-get-django-and-reactjs-to-work-together




# Help using dependencies

Some helpful notes on how to use various dependencies

### docker

Running a command inside a docker container:
1. Find the name of the container
2. `docker exec [container-id-or-name] [command]` (names can be found under "Names" (furthest right) when running `docker ps` (it's not the same as the "Image" name)

Running an interactive shell inside a docker container:
1. Find the name of the container
2. `docker exec -it [container-id-or-name] bash`
3. `exit`
More info here: https://www.digitalocean.com/community/tutorials/how-to-use-docker-exec-to-run-commands-in-a-docker-container

### docker-compose

Building image and starting the containers: `docker-compose up --build -d`
* `-d` - run in "detached" (background) mode
* `--build` - before starting the container we build the image
* `up` - starting the container

Viewing the logs: `docker-compose logs`

Starting the server: `docker-compose exec web python manage.py runserver 8000` (done automatically via `command:` in [`docker-compose.yml`](https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/blob/main/docker-compose.yml)

Problem: "Cannot start service db: network [id] not found"

Solution: `docker-compose up --force-recreate`

### PostgreSQL

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

### Django

#### Updating (migrating) the database to match the Django model

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

### Coordinates in Latitude and Longitude

Latitude
* y-axis
* Positive coordinates are above the equator
* Range: -90 (south pole) to +90 (North pole)

Longitude
* x-axis
* Positive coordinates are to the east
* Range: -180 to +180 (where 0 goes through London - These meet at the other side of the globe, from the perspective of an English person)

Example coordinates:
* Gothenburg: 57.7, 12.0
* London: 51.5, 0.0

Important: When storing data in GeoDjango data structures (like for example a [Point](https://docs.djangoproject.com/en/4.1/ref/contrib/gis/geos/#django.contrib.gis.geos.Point)) the reverse order is used!
