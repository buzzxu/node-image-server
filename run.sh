#!/bin/sh

CONFIG_FILE=/app/core/config.js
instance=max
until [ $# -eq 0 ]
do
 case "$1" in
 --maxAge)
  sed -i "11s/31536000/$2/g" $CONFIG_FILE
  shift 2;;
 --defalut-img)
  sed -i "19s/default.png/$2/g" $CONFIG_FILE
  shift 2;;
 --jwt-secret)
 sed -i "21s/123456/$2/g" $CONFIG_FILE
 shift 2;;
 --jwt-algorithm)
 sed -i "22s/HS512/$2/g" $CONFIG_FILE
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


pm2-runtime start bin/www  --env production -i $instance --name "image" --max_memory_restart 100M  --output /data/logs/images/out.log --error /data/logs/images/error.log
