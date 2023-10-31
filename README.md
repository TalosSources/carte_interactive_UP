# Smarta Kartan 4.0

This is the repo for version 4.0 of Smarta Kartan, a future version.

The code for the current version (at the time of writing) is available here:
https://github.com/GoteborgsStad/smartakartan3.0


## Installation

```
$ git clone https://gitlab.com/kollaborativ-ekonomi-sverige/smartakartan.git
$ cd smartakartan
# Update docker-compose.yml to your liking. Especially the db-volume and URL.
```

## Start
```
$ docker compose up --build
# Smartakartan now listens on port 80.
# Ctrl-C quits the server
```
The main webpage is available at port 80.
The UI for entering or editing data is located in the subdir `/admin`.
The API can be queried at `/api`.

## Creating users for data entry
For entering or editing data, users are required.
Those can be created an user with admin privileges or via django commands.
```
# Define an administrator
docker compose run api /code/manage.py setup_user --super_user --username <username> --password <pass>
# define a curator
docker compose run api /code/manage.py setup_user --content_admin --username <username> --password <pass>
```

## Data import
Importing data from the current version 3 of Smartakartan.
This queries the API endpoints and downloads the images.
The first run typically takes around 20min.
The data is cached in `/cache` for subsequent runs.
```
$ docker compose run api /code/manage.py import_sk3_data
```

## Upgrade
```
$ docker compose down
$ git pull
$ docker compose up -d --build
```
## Contributors
@SunyataZero
@ytterdorr
@antonhedstrom
@BImpobhYF2
