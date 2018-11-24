FROM node:11.2.0-alpine

MAINTAINER buzzxu <downloadxu@163.com>

RUN apk update && apk upgrade && \
    apk add --no-cache -U zlib libpng libjpeg libwebp git imagemagick tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    mkdir -p /app && \
    apk del git && \
    rm -rf /var/cache/apk/* && \
    rm -rf /tmp/*

COPY . /app
WORKDIR /app
COPY run.sh .

RUN npm install --production --registry=https://registry.npm.taobao.org && \
    npm install pm2 -g --registry=https://registry.npm.taobao.org

ENV TZ Asia/Shanghai
ENV NODE_ENV production
ENTRYPOINT ["/bin/sh","run.sh"]
