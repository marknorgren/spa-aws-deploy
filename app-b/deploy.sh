#!/bin/bash
set -e
# Get the directory name (app name)
APP_NAME=$(basename "$PWD")
# Call the shared script from the root
../scripts/deploy-app.sh "$APP_NAME"
