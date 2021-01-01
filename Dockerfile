FROM node:15-alpine
RUN apk add git make g++ gcc musl-dev python beets python3 ffmpeg shadow && \
    groupmod --new-name tdedhar node && \
    usermod -l tdedhar node && \
    mv /home/node /home/tdedhar && \
    chown -R tdedhar /home/tdedhar
USER tdedhar
ENV HOME /home/tdedhar
RUN mkdir -p /home/tdedhar/src && \
    mkdir -p /home/tdedhar/.config/beets
COPY src/ /home/tdedhar/src/
WORKDIR /home/tdedhar/src
RUN yarn install
ENTRYPOINT node viki.js
