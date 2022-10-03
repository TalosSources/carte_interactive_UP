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
1. Create db: `CREATE DATABASE smarta_kartan_db;`
1. Connect to db: `\connect smarta_kartan_db`
1. Exit to OS shell: `exit`
1. Verify that the db is running in the OS: `ss -nlt|grep 5432`
  * You should see a line like this: `LISTEN 0  244  127.0.0.1:5432  0.0.0.0:*`
  * You can compare these values to the values found in the `DATABASES` dict inside `settings.py`

### Starting the server

1. Update `python3 manage.py migrate`
1. Start the server: `python3 manage.py runserver 8000`

### Trying out the website

1. Create an admin user: `python3 manage.py createsuperuser`
1. Try the admin interface by going to http://127.0.0.1:8000/admin/
1. Try the normal/standard/user website by going to http://127.0.0.1:8000/


## Documentation

Requirements spec can be found [here](https://gitlab.com/kollaborativ-ekonomi/docs/-/blob/main/smarta-kartan-req-spec.md)


| Tech       | Tutorials    |Reference| Books        |Notes |
|------------|--------------|---|--------------|---|
| Javascript |              |   | [jsdg][b_jsdg] |---|
| Leaflet    | [1][t_llqs]  |   |              |   |
| Python     |              |   |              |---|
| Django     | [1][t_django] |   |              |   |
| PostgreSQL | [1][t_ispsu] |   |              |   |

[b_jsdg]: https://www.oreilly.com/library/view/javascript-the-definitive/9781491952016/
[t_llqs]: https://leafletjs.com/examples/quick-start/
[t_django]: https://docs.djangoproject.com/en/4.1/intro/tutorial01/
[t_ispsu]: https://www.cherryservers.com/blog/how-to-install-and-setup-postgresql-server-on-ubuntu-20-04

Overarching tutorials:
* https://www.paulox.net/2021/07/19/maps-with-django-part-2-geodjango-postgis-and-leaflet/ ***Recommended***
* https://docs.djangoproject.com/en/4.1/ref/contrib/gis/tutorial/


## Appendix A: PostgreSQL guidance

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

Please note:
* The default username and the default database name are the same: `postgres`
* Each time you _______

## Appendix B: Updating (migrating) the database to match the Django model

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
