FROM node:16
RUN npm install -g prisma

RUN mkdir /app
WORKDIR /app

COPY ./ ./prisma/
# COPY ../.env ./prisma/

CMD [ "prisma", "generate"]
CMD [ "prisma", "migrate", "deploy"]