#! /bin/bash

while ! nc -z db 5432; do
  sleep 0.1
done

python /code/manage.py migrate
python /code/manage.py runserver 0.0.0.0:8000
