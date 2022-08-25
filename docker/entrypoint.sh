#!/bin/sh

npm --prefix /var/www/reviews-api install /var/www/reviews-api
nodemon -L /var/www/reviews-api/server.js --watch "/var/www/reviews-api/plugins/" -e js,json