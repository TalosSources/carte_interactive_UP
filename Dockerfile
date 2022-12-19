FROM python:3.10-slim-bullseye

ENV PIP_DISABLE_PIP_VERSION_CHECK 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /code

COPY ./requirements.txt .
RUN pip install -r requirements.txt
RUN apt-get update -y
RUN apt-get install -y gdal-bin

COPY . .
CMD ["/code/entry.sh"]
