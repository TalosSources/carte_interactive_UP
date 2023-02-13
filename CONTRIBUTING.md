
# Getting started for developers

## Setup (with docker)

Ubuntu 22.04 LTS was used to create this section. On Windows you may want to use [Windows Subsystem](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux)

1. Installing docker and docker compose, see: https://docs.docker.com/get-docker/
1. Building image and starting the containers: `docker-compose up --build`
   * The first time is different, but usually you will not need to use the `--build` flag, so the process will be much faster
1. Use the website
   * [Admin interface](http://localhost/admin/) - Credentials from createsuperuser step
   * [API](http://localhost/api/) - it's possible to view the API in html by opening this link in a browser)
   * [Our React frontend](http://localhost/) - what the users see when visiting the (future) site
   * Run Django tests:
     1. `docker-compose run api /code/manage.py test`
     1. `docker-compose down`

You can add `-d` (`docker-compose up -d`) to start docker compose in "detached mode", but then please remember to run `docker-compose down` when you are done, so that resources/ports are not taken/blocked from your system

## How to

### Import SK3 data

1. If you have made changes to the import script: `docker-compose build`
1. `docker-compose run api /code/manage.py import_sk3_data`
1. `docker-compose down`

### Creating an admin superuser (to access `/admin/`)

1. `docker-compose run api /code/manage.py createsuperuser`
1. `docker-compose down`

### Clear the database

* Option A: One way to do this is to go into the admin interface, select all rows for each data type, and then delete them all
* (Dangerous) Option B: `docker-compose run api /code/manage.py flush`. (Afterwards the superuser will have to be recreated)
* Option C: In some rare cases (for me `ProgrammingError --- id does not exist`) we may have to drop the entire database (not just flush):
  1. `docker-compose run db`
  1. Find the container id using `docker ps`
  1. Connect to the postgres: `docker exec -it [container id] psql -U postgres`
  1. `postgres-# DROP DATABASE smarta_kartan_db;`
  1. `postgres=# CREATE DATABASE smarta_kartan_db;`

### Creating a new database

We need to create the database manually (but only the first time), otherwise we will get `database "smarta_kartan_db" does not exist`
1. `docker-compose run db`
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

1. `python3 manage.py makemigrations` (this will create a migration file here: `website/migrations`, which is version controlled. If another person has made the changes in the database we can skip this step)
1. `docker-compose run api /code/manage.py migrate` (this uses the migration file created in the previous step)

Alternatively we can do the same thing with these commands:

1. `docker-compose run api bash`
1. `./manage.py makemigrations`
1. `./manage.py migrate`

### Adding new pages

- Register page in [react router](https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/blob/main/react-frontend/src/App.js).
- Create page in [pages folder](https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/tree/main/react-frontend/src/pages).
- data transferred to react via REST API defined in [urls.py](https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/blob/main/smartakartan4/urls.py) and [views.py](https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/blob/main/website/views.py)


## General Product Overview

Requirements spec can be found [here](https://gitlab.com/kollaborativ-ekonomi/docs/-/blob/main/smarta-kartan-req-spec.md)

The aim is that version 4.0 will be similar to 3.0 ("feature parity") but with some minor differences

## Meeting notes

Can be found [here](https://drive.google.com/drive/folders/1gr585Yq0tNy16csVm5dar_Ub2rE7hnvL)

## Way of working

We use agile/SCRUM and work in two-week sprints

**[Planning board](https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/boards/5077759)**

## Interactions with other developers

Done mainly via our slack, and also via GitLab issues

## People, roles and contact info

[Link to Google Drive](https://docs.google.com/spreadsheets/d/1JJy8dElqG6_5EAk4F8F5O_uArkIzjXly7_qbCxSe8UI) ("Restricted - Only people with access can open with the link")

## Decision process

Jonathan is the product owner (he has the experience with the product and the overview)

## GitLab Workflow

We do issue work in branches and then merge into the main branch

## Technical overview and architecture

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

### Decisions, why a certain technology was chosen

TODO

## What can I do right now?

* Check ready issues: https://gitlab.com/kollaborativ-ekonomi/smartakartan4/-/boards/5077652
* Adding more auto-tests and increasing coverage


***

## Appendix A: For 3.0 (the previous version)

[Kravspec 3.0](https://docs.google.com/document/d/1MerETncgN8kq5oeXADo5M_3h4R3SN-02BW9_AoC-X7c/edit)

[Trello board](https://trello.com/b/5rDw6kzZ/sk-30-development)

## Appendix B: Abbreviations

* SK: Smarta Kartan (aka The Smart Map)
* SK3: Version 3
* SK4: Version 4

## Appendix C: Overview of files

* The `docs/` directory (where this document is located)
* [docs-repo](https://gitlab.com/kollaborativ-ekonomi/docs/)
* [GDRIVE Smarta Kartan 4.0](https://drive.google.com/drive/folders/15xD7PqmqnNJkf_RsjQqBVDT2auBkkfuN)
* [Tord/SunyataZero's Google Drive](https://drive.google.com/drive/u/0/folders/1c3vxplDZns8zA4BI6KdN6nwKnsjJA2cJ) (hopefully this will be merged with the Google drive above)
