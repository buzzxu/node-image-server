#!/bin/sh

CONFIG_FILE=/app/core/config.js
instance=max
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
 --instance)
    instance=$2
    shift 2;;
 *) echo " unknow prop $1";shift;;
 esac
done

echo "===================================="
cat $CONFIG_FILE
echo "===================================="


pm2-runtime start bin/www  --env production -i $instance --name "image" --max-memory-restart 100M  --output /data/logs/out.log --error /data/logs/error.log
