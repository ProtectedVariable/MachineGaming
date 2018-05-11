#!/bin/bash
if [ $# -lt 3 ]; then
    echo "Usage: $0 <Server_IP> <Host_File> <Client_Jar>"
    exit 1
fi
t=0
while IFS='' read -r line || [[ -n "$line" ]]; do
    ssh-keyscan $line >> ~/.ssh/known_hosts
    if [ $t -eq 0 ]; then
        scp $3 thomas.ibanez@$line:~/client.jar
        t=1
    fi
done < "$2"
pssh -v -h $2 -l thomas.ibanez -A -i "java -jar client.jar $1 8 Worker"
echo 'END'
