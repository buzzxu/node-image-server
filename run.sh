#!/bin/sh

CONFIG_FILE=/app/config/config.js
instance=max
until [ $# -eq 0 ]
do
 case "$1" in
 --defalut-img)
  sed -i "15s/default.png/$2/g" $CONFIG_FILE
  shift 2;;
 --jwt-secret)
 sed -i "25s/123456/$2/g" $CONFIG_FILE
 shift 2;;
 --jwt-algorithm)
 sed -i "26s/HS512/$2/g" $CONFIG_FILE
 shift 2;;
 --instance)
 instance=$2
 shift 2;;
 *) echo " unknow prop $1";shift;;
 esac
done

echo "===================================="
cat $CONFIG_FILE
echo "===================================="


pm2-runtime start bin/www  --env production --watch -i $instance --name "image"  --output /data/logs/images/out.log --error /data/logs/images/error.log
