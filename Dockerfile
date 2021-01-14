FROM node:10.15.2-alpine
WORKDIR /app

COPY package*.json /app/
RUN npm install

COPY . .

ENTRYPOINT ["./docker-entrypoint.sh"]

EXPOSE 3000