#!/bin/sh
set -e


### Start app
npm start
exec "$@"
