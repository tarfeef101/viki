# Viki
Viki is a bot focused mainly on music streaming. Specifically, streaming from a `beets` music library on the docker host on which the `viki` container is run. Yes, this is a very specific, narrow use case.

## Usage
To get this running on your server, other than the normal creation of a bot user stuff on the discord, side, do the following:
- create `src/config.json` and add:
  - `"token"`, your bot's token
  - `"prefix"`, the character that is the prefix for bot commands in your server
  - `"whitelist"`, an array of users in the form `username#tag` who can run `addmusic` for your bot
- in `docker-compose.yaml`:
  - change the volumes to the locations of your `beets` config and media folder(s)
  - optionally change the restart policy to your preference
- in `Dockerfile`:
  - change the added user to the user who owns the media library on the host
  - change the `uid` and `gid` of this user to match the host, if necessary
  - ensure the version of `beets` to be installed is equal or at least compatible with the host's
- run `docker-compose up --build -d` to run the bot

## Caveats
- as mentioned above, yes, this is a very narrow use case
- anyone you whitelist can technically execute arbitrary code on your host system through `addmusic`. so that's great
- yes, the whitelist is an array in the config file, not role-based
- yes, these are solvable problems
