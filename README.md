# Smarta Kartan 4.0

This is the repo for version 4.0 of Smarta Kartan, a future version.

The code for the current version (at the time of writing) is available here:
https://github.com/GoteborgsStad/smartakartan3.0

## Installation

```
$ git clone https://gitlab.com/kollaborativ-ekonomi/smartakartan4.git
$ cd smartakartan4
# Update docker-compose.yml to your liking. Especially the db-volume and URL.
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

