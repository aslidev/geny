#!/bin/bash

template=$1
dir=$2

echo $template
echo $dir

case "$template" in
x)
  echo "Oh it's X"
  ;;
*)
  echo "unknown :("
  ;;
esac
