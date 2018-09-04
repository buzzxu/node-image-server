#!/bin/bash
#forever start -a -l forever.log -o out.log -e err.log bin/www
pm2 start bin/www --env production --watch -i 2 --name "image" --merge-logs --log-date-format="YYYY-MM-DD HH:mm Z" -o /data/logs/images/out.log -e /data/logs/images/error.log
