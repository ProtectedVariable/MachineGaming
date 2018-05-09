#!/bin/bash
echo "Password:"
read -s password
while IFS='' read -r line || [[ -n "$line" ]]; do
    ssh-keyscan $line >> ~/.ssh/known_hosts
    sshpass -p $password scp $3 thomas.ibanez@$line:~/
    sshpass -p $password ssh thomas.ibanez@$line "java -jar client.jar $1 4 Worker &"
done < "$2"
