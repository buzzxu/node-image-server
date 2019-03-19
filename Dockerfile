FROM node:alpine

MAINTAINER buzzxu <downloadxu@163.com>

RUN apk update && apk upgrade && \
    apk add --no-cache -U zlib libpng libjpeg libwebp git imagemagick tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    mkdir -p /app

COPY . /app
WORKDIR /app
COPY run.sh .
#--registry=https://registry.npm.taobao.org
RUN npm install --production  && \
    npm install pm2 -g  && \
    apk del git && \
    rm -rf /var/cache/apk/* && \
    rm -rf /tmp/*

ENV TZ Asia/Shanghai
ENV LANG C.UTF-8
ENV NODE_ENV production
ENTRYPOINT ["/bin/sh","run.sh"]
