#!/usr/bin/env bash
if [[ -d "/Library/Audio/Plug-Ins/HAL/BlackHole2ch.driver" ]]; then
  echo "installed"
  exit 0
fi
echo "missing"
exit 1
