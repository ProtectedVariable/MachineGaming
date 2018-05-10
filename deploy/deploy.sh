#!/bin/bash
set -e
if [ $# -lt 3 ]; then
    echo "Usage: $0 <Server_IP> <File> <Client>"
    exit 1
fi
echo "Password:"
read -s password
while IFS='' read -r line || [[ -n "$line" ]]; do
    ssh-keyscan $line >> ~/.ssh/known_hosts
    sshpass -p $password scp $3 thomas.ibanez@$line:~/
    sshpass -p $password ssh thomas.ibanez@$line "java -jar client.jar $1 4 Worker &" &
    #sshpass -p $password ssh thomas.ibanez@$line "nohup ls && exit" &
done < "$2"
echo 'END'
