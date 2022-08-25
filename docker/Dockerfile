FROM node:12
RUN mkdir -p /var/www/reviews-api
RUN npm install -g nodemon
EXPOSE 4650
#ADD entrypoint.sh /entrypoint.sh
#RUN chmod 755 /entrypoint.sh
#CMD ["/bin/bash", "/entrypoint.sh"]
ENTRYPOINT ["tail", "-f", "/dev/null"]