FROM node:15-alpine
RUN apk add git make g++ gcc musl-dev python beets python3
COPY src/ /home/node/src/
WORKDIR /home/node/src
RUN yarn install
ENTRYPOINT node viki.js
