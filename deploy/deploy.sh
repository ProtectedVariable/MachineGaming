#!/bin/bash
if [ $# -lt 3 ]; then
    echo "Usage: $0 <Server_IP> <File> <Client>"
    exit 1
fi
while IFS='' read -r line || [[ -n "$line" ]]; do
    ssh-keyscan $line >> ~/.ssh/known_hosts
done < "$2"
pscp -v -h $2 -l thomas.ibanez -A $3 ~/client.jar
pssh -v -h $2 -l thomas.ibanez -A -i -P "java -jar client.jar $1 8 Worker"
echo 'END'
