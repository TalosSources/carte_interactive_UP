FROM node:16.18.1

WORKDIR /react-frontend

COPY . .

RUN npm install -g nodemon
RUN npm install

EXPOSE 3000

CMD ["npm","run","start-dev"]
