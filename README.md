# Viki
Viki is a bot focused mainly on music streaming. Specifically, streaming from a `beets` music library on the docker host on which the `viki` container is run. Yes, this is a very specific, narrow use case.

## Deployment
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

## Usage
The bot recognizes commands sent by non-bot users, prepended with the `prefix` character set in the `config.json`. Below is a list of commands the bot recognizes.
- `ping`
  - responds to the commands with the one-way and round-trip latency for the bot
  - e.g. `!ping`
- `join channelname`
  - Joins the voice channel named `channelname`
  - e.g. `!join General`
- `leave channelname`
  - Leaves the voice channel named `channelname`
  - e.g. `!leave General`
- `price type weapon`
  - Returns riven price data for the `weapon` of mod type `type`, where `type` is either `rolled` or `unrolled`
  - e.g. `!price unrolled kuva bramma`
- `search querytype querystring`
  - Looks up music in the host DB, and adds responds w/ the results
  - Valid `querytypes` include `['track', 'title', 'song', 'artist', 'album']`
  - `querystring` is the actual query, so if `querytype` was `artist`, a valid `querystring` would be `green day`
- `addmusic querytype querystring`
  - Looks up music in the host DB, and adds matching songs to the playlist, and starts playing if nothing is playing already
  - Same argument syntax as `search`
- `stop`
  - Stops playback and clears the playlist
- `next`
  - Returns the next song in the playlist
- `previous`
  - Returns the previous song that was played
- `playlist`
  - Returns the contents of the current playlist
- `pause`
  - Pauses playback
- `resume`
  - Resumes playback
- `repeat setting`
  - Sets repeat behaviour to `off`, `one`, or `all`.  The default behaviour of the bot is `off`
- `skip`
  - Skips to the next song in the playlist
- `back`
  - Goes back to replay the previous song, and adds the song that was playing at the time of the command back onto the front of the playlist
- `shuffle`
  - Shuffles the playlist's order

## Caveats
- as mentioned above, yes, this is a very narrow use case
- anyone you whitelist can technically execute arbitrary code in your container (and since there's bind mounts, place code on the host) through `addmusic`. so that's great
- yes, the whitelist is an array in the config file, not role-based
- yes, these are solvable problems
