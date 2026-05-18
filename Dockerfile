FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
RUN rm -rf /usr/share/nginx/html/docker /usr/share/nginx/html/api /usr/share/nginx/html/Dockerfile /usr/share/nginx/html/docker-compose.yml
EXPOSE 80
