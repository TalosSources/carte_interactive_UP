
# Getting started for developers

## Setup (with docker)
(Ubuntu 22.04 LTS used but this shouldn't be very important)

1. Installing docker and docker compose, see: https://docs.docker.com/get-docker/
1. Building image and starting the containers: `docker-compose up --build`
1. Use the website
   * [Admin interface](http://127.0.0.1:8000/admin/) - Credentials from createsuperuser step
   * [API](http://127.0.0.1:8000/api/) - it's possible to view the API in html by opening this link in a browser)
   * [Our React frontend](http://localhost:3000/) - what the users see when visiting the (future) site. (http://127.0.0.1:3000/ doesn't load data, `localhost` has to be used)
   * Test Django: ____TODO____

You can add `-d` (`docker-compose up --build -d`) to start docker compose in "detached mode", but then please remember to run `docker-compose down` when you are done, so that resources/ports are not taken/blocked from your system


## How to

### Import SK3 data

1. `docker-compose run api /code/manage.py shell < migrate_from_sk3.py`
1. `docker-compose down`


### Creating an admin superuser (to access `/admin/`)

1. `docker-compose run api /code/manage.py createsuperuser`
1. `docker-compose down`

### Clear the database

-

### Creating a new database

We need to create the database manually (but only the first time), otherwise we will get `database "smarta_kartan_db" does not exist`
1. Find the container id using `docker ps`
1. Connect to the postgres: `docker exec -it [container id] psql -U postgres`
1. Create the database: `postgres=# CREATE DATABASE smarta_kartan_db;`
1. Verify that the database has been created: `postgres=# \l`
1. Migrating the first time:
   1. `docker-compose exec web python manage.py migrate`
   1. Verify that tables have been created:
      1. `docker exec -it [container id] psql -U postgres`
      1. `\dt`

### Migrating the database

After a change in the model, we need to migrate the changes to the database:
1. `docker-compose up` (use `-d` if running in a single terminal)
1. `docker-compose run api bash`
1. `./manage.py makemigrations`
1. `./manage.py migrate`

## Interactions with other developers

Done mainly via our slack, and also via GitLab issues

## Decision process

TODO

## Technical overview

Tech overview diagram: https://docs.google.com/drawings/d/15sx4YFCvtGF8nAua7IqMI7zYry7YVGBZa7iAJvCffBQ/edit?usp=sharing

* Django (Python)
  * GeoDjango
  * DjangoAdmin
  * Django REST framework
  * ...
* Postgresql
  * PostGIS
* Javascript
  * Leaflet
  * React
    * React Router (website is an SPA)
* REST
* GDAL
* ...

Wiki pages:
* https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/wikis/External-Documentation-for-Dependencies
* https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/wikis/Help-using-dependencies
* https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/wikis/Problems-and-solutions

## General Product Overview

Requirements spec can be found [here](https://gitlab.com/kollaborativ-ekonomi/docs/-/blob/main/smarta-kartan-req-spec.md)

## Abbreviations

* SK: Smarta Kartan (aka The Smart Map)
* SK3: Version 3
* SK4: Version 4

## Merge Requests and Workflow Overview

TODO

## What can I do right now?
Check ready issues https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/boards/5077652

## Tips for implementing new pages
- Register page in [react router](https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/blob/main/react-frontend/src/App.js).
- Create page in [pages folder](https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/tree/main/react-frontend/src/pages).
- data transferred to react via REST API defined in [urls.py](https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/blob/main/smartakartan4/urls.py) and [views.py](https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/blob/main/website/views.py)

<!--
Reference:
https://gitlab.com/mindfulness-at-the-computer/mindfulness-at-the-computer/-/blob/master/CONTRIBUTING.md
-->
