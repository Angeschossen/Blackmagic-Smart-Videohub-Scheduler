# Install dependencies only when needed
FROM node:16-alpine 

ENV PORT 3000

# Create app directory
RUN mkdir /var/movable/ && mkdir /var/movable/app
WORKDIR /var/movable/app

RUN rm -rf .next*
# Installing dependencies
COPY package*.json /var/movable/app/
RUN npm install

# Copying source files
COPY . /var/movable/app


# Building app
RUN npm run build
EXPOSE 3000

# Running the app
CMD mysql start
CMD "npm" "run" "start_prod"