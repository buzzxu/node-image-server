#!/bin/sh

CONFIG_FILE=/app/core/config.js
instance=max
memory=100M
max_space_old=768
max_space_semi=64
until [ $# -eq 0 ]
do
 case "$1" in
 --domain)
    sed -i "9s/image.xingchenga.com/$2/g" $CONFIG_FILE
    shift 2;;
 --model)
    sed -i "11s/local/$2/g" $CONFIG_FILE
    shift 2;;
 --maxAge)
    sed -i "12s/31536000/$2/g" $CONFIG_FILE
    shift 2;;
 --defalut-img)
    sed -i "20s/default.png/$2/g" $CONFIG_FILE
    shift 2;;
 --jwt-secret)
    sed -i "22s/123456/$2/g" $CONFIG_FILE
    shift 2;;
 --jwt-algorithm)
    sed -i "23s/HS512/$2/g" $CONFIG_FILE
    shift 2;;
 --oss-region)
    sed -i "27s/xux/$2/g" $CONFIG_FILE
    shift 2;;
 --oss-accesskey-id)
    sed -i "28s/xux/$2/g" $CONFIG_FILE
    shift 2;;
 --oss-accesskey-secret)
    sed -i "29s/xux/$2/g" $CONFIG_FILE
    shift 2;;
 --oss-bucket)
    sed -i "30s/xux/$2/g" $CONFIG_FILE
    shift 2;;
 --redis-host)
    sed -i "34s/127.0.0.1/$2/g" $CONFIG_FILE
    shift 2;;
 --redis-port)
    sed -i "35s/6379/$2/g" $CONFIG_FILE
    shift 2;;
 --redis-password)
    sed -i "36s/xux/$2/g" $CONFIG_FILE
    shift 2;;
 --redis-db)
    sed -i "37s/1/$2/g" $CONFIG_FILE
    shift 2;;
 --redis-expire)
    sed -i "38s/3600/$2/g" $CONFIG_FILE
    shift 2;;
 --instance)
    instance=$2
    shift 2;;
 --memory)
    memory=$2
    shift 2;;
 --max-old-space-size)
    max_space_old=$2
    shift 2;;
 --max-semi-space-size)
    max_space_semi=$2
    shift 2;;
 *) echo " unknow prop $1";shift;;
 esac
done

echo "============config.js==============="
cat $CONFIG_FILE
echo "===================================="

echo "instance=$instance"

if [ $instance -le 1  ]
then
    echo "max-old-space-size=$max_space_old"
    echo "max-semi-space-size=$max_space_semi"
    node --max-old-space-size=$max_space_old --max-semi-space-size=$max_space_semi bin/www
else
    echo "memory=$memory"
    pm2-runtime start bin/www  --env production -i $instance --name "image" --max-memory-restart $memory  --output /data/logs/out.log --error /data/logs/error.log

fi
