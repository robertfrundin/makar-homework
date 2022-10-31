FROM node:16-alpine

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm ci
RUN npm install -g serve

COPY . ./

RUN npm run build

CMD serve -s build -l 3000