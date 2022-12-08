
# Getting started for developers

## Development setup - with docker
(Ubuntu 22.04 LTS used but this shouldn't be very important)

1. Installing docker and docker compose, see: https://docs.docker.com/get-docker/
1. Building image and starting the containers: `docker-compose up --build -d`
1. Starting the server: `docker-compose exec web python manage.py runserver 8000`

Typical process:
* `docker-compose up --build -d`
* `docker-compose logs`
* `docker-compose exec web python manage.py runserver 8000`
* Testing the website
* `docker-compose down`

## How to

### Creating a new database

We need to create the database manually (but only the first time), otherwise we will get `database "smarta_kartan_db" does not exist`
1. Find the container id using `docker ps`
1. Connect to the postgres: `docker exec -it [container id] psql -U postgres`
1. Create the database: `postgres=# CREATE DATABASE smarta_kartan_db;`
1. Verify that the database has been created: `postgres=# \l`

2. Migrating:
1. `docker-compose exec web python manage.py migrate`
1. Verify that tables have been created:
  1. `docker exec -it [container id] psql -U postgres`
  1. `\dt`

### Migrating the database

TODO


## Interactions with other developers

Done via our slack

## Decision process

## Technical overview

Tech overview diagram: https://docs.google.com/drawings/d/15sx4YFCvtGF8nAua7IqMI7zYry7YVGBZa7iAJvCffBQ/edit?usp=sharing

* Django (Python)
  * GeoDjango
  * DjangoAdmin
  * Django REST framework
  * ...
* Postgresql
  * PostGIS
* Leaflet (Javascript)
* React 
* REST
* GDAL
* ...

Wiki pages:
* https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/wikis/External-Documentation-for-Dependencies
* https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/wikis/Help-using-dependencies
* https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/wikis/Problems-and-solutions

## General Overview

Requirements spec can be found [here](https://gitlab.com/kollaborativ-ekonomi/docs/-/blob/main/smarta-kartan-req-spec.md)

## Merge Requests and Workflow Overview

TODO

## What can I do right now?

TODO

## Tips for implementing new pages
- Register page in [react router](https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/blob/main/react-frontend/src/App.js).
- Create page in [pages folder](https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/tree/main/react-frontend/src/pages).
- data transferred to react via REST API defined in [urls.py](https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/blob/main/smartakartan4/urls.py) and [views.py](https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/blob/main/website/views.py)

<!--
Reference:
https://gitlab.com/mindfulness-at-the-computer/mindfulness-at-the-computer/-/blob/master/CONTRIBUTING.md
-->
