FROM node:16
RUN npm install -g prisma

RUN mkdir /app
WORKDIR /app

COPY ./ ./prisma/

CMD [ "prisma", "migrate", "dev", "--name", "init"]
