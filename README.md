<h1 style="text-align: center; display: flex; align-items:center; justify-content:center">
  <img src="https://beta.smartakartan.se/sk-logotype-topbar.png" width="100" height="auto" style="margin-right: 15px">
  Smarta Kartan 4.0
</h1>

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

## Environment tips:
#### Windows OS

* API doesn't start
````
api-1    | exec /code/entry.sh: no such file or directory
api-1    | exited with code 1
web-1    |
````
If ```/bin/bash``` seemingly exists but there's an unexpected problem, consider checking for Windows line endings.

Git repository contains an entry point script with Unix line endings ```(\n)```. However, when the repository is cloned on a Windows machine, Git attempted to intelligently replace the line endings with Windows format ```(\r\n)```.

Consequently, it fails to work as expected, searching for ```/bin/bash\r``` instead of ```/bin/bash```

To resolve this issue, it's good to disable Git's automatic line ending conversion using the following command:

```
git config --global core.autocrlf input
```
To apply this change, reset the repository (ensure your changes are saved):

```
git rm --cached -r .
git reset --hard
Afterwards, rebuild your project.
```
For additional information on changing line-ending settings, you may find these resources helpful:

- [How to change line-ending settings](https://stackoverflow.com/questions/10418975/how-to-change-line-ending-settings)
- [Dealing with Windows line endings in Docker for Windows](https://willi.am/blog/2016/08/11/docker-for-windows-dealing-with-windows-line-endings/)

## Contributors
@SunyataZero
@ytterdorr
@antonhedstrom
@BImpobhYF2
@Ahmed-Allam