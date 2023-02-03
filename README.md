# Smarta Kartan 4.0

This is the repo for version 4.0 of Smarta Kartan, a future version.

The code for the current version (at the time of writing) is available here:
https://github.com/GoteborgsStad/smartakartan3.0


## Installation

```
$ git clone https://gitlab.com/kollaborativ-ekonomi/smartakartan4.git
$ cd smartakartan4
# Update docker-compose.yml to your liking. Especially the db-volume and URL.
# Define an administrator (to access /admin)
docker-compose run api /code/manage.py createsuperuser
docker-compose run api /code/manage.py setup_groups_or_users --ca_group
```

## Start
```
$ cd smartakartan4
$ docker-compose up -d --build
# Smartakartan now listens on port 80.
$ docker-compose down
```

## Upgrade
```
$ cd smartakartan4
$ docker-compose down
$ git pull
$ docker-compose up -d --build
```

