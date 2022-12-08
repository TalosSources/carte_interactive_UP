
# Getting started for developers

## Development setup - with docker
(Ubuntu 22.04 LTS used but this shouldn't be very important)

1. Installing docker and docker compose, see: https://docs.docker.com/get-docker/
1. Building image and starting the containers: `docker-compose up --build -d`
1. ___________react___________
1. Use the website
  * Admin interface: http://127.0.0.1:8000/admin/
  * API: http://127.0.0.1:8000/api/
  * Our React frontend: _____cd react-frontend/_______npm start________http://127.0.0.1:3000/
  * Test Django: __________________
1. `docker-compose down`



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

## Abbreviations

* SK: Smarta Kartan (aka The Smart Map)
* SK3: Version 3
* SK4: Version 4

## Merge Requests and Workflow Overview

TODO

## What can I do right now?

TODO

<!--
Reference:
https://gitlab.com/mindfulness-at-the-computer/mindfulness-at-the-computer/-/blob/master/CONTRIBUTING.md
-->
