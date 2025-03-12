#!/bin/bash

MAX_CPU=0
MAX_MEM=0

while true; do
  CPU=$(pm2 jlist | jq -r '.[] | select(.name=="evolution-api") | .monit.cpu')
  MEM=$(pm2 jlist | jq -r '.[] | select(.name=="evolution-api") | .monit.memory')

  MEM_MB=$((MEM / 1024 / 1024))

  if (( CPU > MAX_CPU )); then MAX_CPU=$CPU; fi
  if (( MEM_MB > MAX_MEM )); then MAX_MEM=$MEM_MB; fi

  echo "$(date '+%Y-%m-%d %H:%M:%S') - CPU: ${CPU}% | Memória: ${MEM_MB}MB | Pico maximo de CPU: ${MAX_CPU}% | Pico maximo de Memória: ${MAX_MEM}MB" | tee -a pm2_monitor.log
done
