FROM node:18-alpine

RUN mkdir /melasoul.fr
WORKDIR /melasoul.fr

RUN apk add --update --virtual .tmp-deps python3 make g++ && \
    rm -rf /var/cache/apk/*

COPY package.json .
RUN npm install --quiet

RUN apk del .tmp-deps

COPY . .

RUN npm run build
