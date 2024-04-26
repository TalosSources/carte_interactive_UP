FROM node:16.18.1

WORKDIR /react-frontend

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

RUN npx tsc

EXPOSE 3000

CMD ["npm","start"]
