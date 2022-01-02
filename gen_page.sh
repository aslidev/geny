#!/bin/bash

folder=$1
name=$2

if [ ! -f "$folder/.env" ]; then
    echo "$folder/.env does not exist."
    exit
fi

source $folder/.env

cd $folder/pages

ng generate module $moduleName-$name --module=$moduleName --interactive=false && \
ng generate component $moduleName-$name/$moduleName-$name --flat=true --export=true --skipTests=true --module=$moduleName-$name --interactive=false
