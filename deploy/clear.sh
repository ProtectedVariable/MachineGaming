#!/bin/bash
pssh -v -h $1 -l thomas.ibanez -A -t 0 -i "-O TCPKeepAlive=no" "-O StrictHostKeyChecking=no" "pkill -f 'java -jar'"
