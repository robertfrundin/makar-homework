FROM node:16-alpine

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm ci
RUN npm install -g serve

COPY . ./

RUN npm run build

ENV NODE_ENV production

CMD serve -s build -l 3000