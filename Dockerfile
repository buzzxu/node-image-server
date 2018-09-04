FROM node:10.9.0-alpine

MAINTAINER buzzxu <downloadxu@163.com>

RUN apk update && apk upgrade \
    &&  apk add --no-cache zlib libpng libjpeg libwebp git imagemagick

RUN mkdir -p /app
RUN mkdir -p /data/logs/images

COPY . /app
WORKDIR /app
COPY run.sh .

RUN rm -rf /app/img

RUN npm install --production --registry=https://registry.npm.taobao.org
RUN npm install pm2 -g --registry=https://registry.npm.taobao.org
RUN apk del git && rm -rf /var/cache/apk/*

ENTRYPOINT ["/bin/sh","run.sh"]