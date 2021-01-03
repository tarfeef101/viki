// Load up the discord.js library
const Discord = require("discord.js");
// Load up the shell command library
var exec = require('child_process').exec;
// Load up the queue library
const Queue = require('./Queue.js');
// Initialize the bot.
const client = new Discord.Client();
// this allows us to define a voice connection with global scope
var connection;
var dispatcher;
// playlist-related globals
var playlist = new Queue();
var played = []
var cursong;
var repeatall = false;
var repeatone = false;
// Array of music classes users can call (artist, track, etc)
const musicTypes = ['track', 'title', 'song', 'artist', 'album'];
const musicTypesString = "track, title, song, artist, album";
// Here we load the config.json file that contains our token and our prefix values.
const config = require("./config.json");


// Define a function to execute a command
function execute(command, callback)
{
  exec(command, function(error, stdout, stderr)
  {
    callback(stdout);
  });
};

// Define a new function to search + replace a char in a string
String.prototype.replaceAll = function(remove, replace)
{
    var target = this;
    return target.split(remove).join(replace);
};

// This plays the next song in the queue, and logs that in the channel where it was requested.
function play()
{
  var nextSong = cursong;
  
  // if we aren't repeating cursong, dequeue
  if (!repeatone && cursong)
  {
    played.push(cursong);
    nextSong = playlist.dequeue();
  }
  // if we set repeat, but had no songs played yet
  // we should dequeue
  else if (!nextSong)
  {
    nextSong = playlist.dequeue();
  }

  dispatcher = connection.play(nextSong[0]);
  console.log(`Playing ${nextSong[2]}.`);
  nextSong[1].channel.send(`Playing ${nextSong[2]}.`);
  dispatcher.setVolume(0.2);
  dispatcher.setBitrate(96);
  cursong = nextSong;

  var endHandler = function endHandler(reason)
  {
    if (!(playlist.isEmpty()))
    {
      play();
    }
    else
    {
      if (repeatall)
      {
        playlist.makeFilled(played);
        played = [];
        play();
        console.log("Repeat all encountered.");
      }
      else
      {
        console.log("Playlist exhausted, music playback stopped.");
      }
    }
  }

  // what to do if it ends
  dispatcher.on("finish", endHandler);
  //dispatcher.on("close", endHandler);
}

// riven stuff
// Load up the request library
var Request = require("request");
var unrolledStats = new Map();
var rolledStats = new Map();
var cacheTime = 0;

function updateRivens()
{
  Request.get("http://n9e5v4d8.ssl.hwcdn.net/repos/weeklyRivensPC.json", (error, response, body) =>
  {
    if (error) return console.dir(error);

    var rivenArr = JSON.parse(body);

    for (var i = 0; i < rivenArr.length; i++)
    {
      var info = Object.assign({}, rivenArr[i]);
      delete info.itemType;
      delete info.compatibility;
      delete info.rerolled;

      // veiled rivens
      if (!(rivenArr[i].compatibility))
      {
        // set value in map to info
        unrolledStats.set(rivenArr[i].itemType.toUpperCase(), info);
      }
      else // weapon-specific, so check if rolled or unrolled
      {
        if (rivenArr[i].rerolled === true)
        {
          rolledStats.set(rivenArr[i].compatibility, info);
        }
        else
        {
          unrolledStats.set(rivenArr[i].compatibility, info);
        }
      }
    }  
  });
}

updateRivens();
cacheTime = new Date().getTime() / 1000;


client.on("ready", () =>
{
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);

  console.log(`users: ${Array.from(client.users.cache.values()).map(each => each.username)}`);

  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity("Taking Over Chicago");
});

client.on("guildCreate", guild =>
{
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`Serving ${client.guilds.cache.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity("Taking Over Chicago");
});


client.on('message', async msg => {
  // Ignores bot msgs
  if (msg.author.bot) return;
  
  // ignores if message isn't prefixed
  if (msg.content.indexOf(config.prefix) !== 0) return;
  
  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = msg.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command === 'ping')
  {
    const m = await msg.channel.send('pong');
    m.edit(`Pong! Latency is ${m.createdTimestamp - msg.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
  }

  if (command === 'join')
  {
    const channelName = args.join(' ');
    const channel = msg.guild.channels.cache.find(each => each.name === channelName && each.type === "voice");

    if (channel)
    {
      channel.join().then(conn =>
      {
        connection = conn;
      }).catch(console.error);
    }
    else
    {
      msg.reply(`Sorry ${msg.author.username}, that channel doesn't appear to exist.`);
    }
  }

  if (command === 'leave')
  {
    const channelName = args.join(' ');
    const channel = msg.guild.channels.cache.find(each => each.name === channelName && each.type === "voice");

    if (channel)
    {
      channel.leave();
    }
    else
    {
      msg.reply(`Sorry ${msg.author.username}, that channel doesn't appear to exist.`);
    }
  }

  if (command === "prices")
  {
    // parse args 
    var type = args[0];
    args.splice(0, 1);
    var query = args.join(' ');
    query = query.toUpperCase();
   
    // check cache freshness
    delta = (new Date().getTime() / 1000) - cacheTime;
    if (delta > 3600) updateRivens();
 
    if (type == "rolled")
    {
      var result = rolledStats.get(query);
      if (!(result))
      {
        return msg.channel.send("Sorry, I couldn't find that weapon. Please check your message and try again.");
      }
      result = JSON.stringify(result, undefined, 2);
      return msg.channel.send(result);
    }
    else if (type == "unrolled")
    {
      var result = unrolledStats.get(query);
      if (!(result))
      {
        return msg.channel.send("Sorry, I couldn't find that weapon. Please check your message and try again.");
      }
      result = JSON.stringify(result, undefined, 2);
      return msg.channel.send(result);
    }
    else
    {
      return msg.channel.send("Sorry, please enter a command in the form: prices unrolled/rolled [weapon_name]");
    }
  }

  if (command === "addmusic") // adds songs to queue, starts playback if none already
  {
    if (!(config.whitelist.includes(msg.author.tag)))
    {
      return msg.channel.send("Sorry, you're not allowed to run this command. Please contact the server owner to acquire that permission.")
    }

    if (!connection)
    {
      return msg.channel.send("Please add me to a voice channel before adding music.")
    }

    var type = args[0];
    if (!(musicTypes.includes(type)))
    {
      return msg.channel.send("Sorry, that is not a valid command. Please enter something from: " + musicTypesString);
    }
    if (type == 'song' || type == 'track') type = 'title'; // account for poor beets API
    args.splice(0, 1);
    const query = args.join(' '); // creates a single string of all args (the query)
    var path; // this will hold the filepaths from our query
    exec(`beet ls -p ${type}:${query} | wc -l`, function (error, stdout, stderr)
    {
      if (error)
      {
        return msg.channel.send(`Sorry, I encountered an issue looking for that: ${error}`);
      }
      else if (stdout === '\n' || stdout === '' || stdout === undefined)
      {
        return msg.channel.send(`There were no results that matched your search. Please give the type and name of your query (e.g. song songname, album albumname...)`);
      }
      else
      {  
        exec(`beet ls -p ${type}:${query}`, function (error, stdout, stderr)
        {
          if (error)
          {
            return msg.channel.send(`Sorry, I encountered an issue looking for that: ${error}`);
          }
          else
          {
            path = stdout.trim();
            path = path.split("\n"); // now an array of paths (with spaces)
            
            // for each song, get the path and readable info, send to queue
            for (var i = 0; i < path.length; i++)
            {
              let filepathRaw = path[i];
              path[i] = path[i].replaceAll(" ", "\\ ");
              path[i] = path[i].replaceAll("'", "\\'");
              path[i] = path[i].replaceAll("&", "\\\46");
              path[i] = path[i].replaceAll("(", "\\(");
              path[i] = path[i].replaceAll(")", "\\)");
              let filepath = path[i]; // path[i] descoped in callback

              exec(`beet ls ${path[i]}`, function (error, stdouts, stderr)
              {
                if (error)
                {
                  return msg.channel.send(`Sorry, I encountered an issue looking for song ${i}: ${error}`);
                }
                else
                {
                  stdouts = stdouts.trim();
                  playlist.enqueue([filepathRaw, msg, stdouts]);
                  
                  // check if music is playing, if not start it
                  if ((!dispatcher || dispatcher.ended || dispatcher.destroyed || dispatcher.writableFinished || dispatcher.writableEnded) && !(playlist.isEmpty()))
                  {
                    play();
                  }
                }
              });
            }
          }
        });
      }

      let amt = stdout.trim();
      msg.channel.send(`${amt} songs added!`);
    });
  }
  
  if (command === 'stop') // clears playlist, stops music
  {
    playlist.reset();
    repeatone = false;
    repeatall = false;
    played = [];
    dispatcher.end();
    console.log("Playback stopped, playlist cleared.");
    msg.channel.send("Playback stopped, playlist cleared.");
  }
  
  if (command === 'next') // returns next song in playlist, or informs that there is none
  {
    if (playlist.isEmpty())
    {
      msg.channel.send("The playlist is empty.");
    }
    else
    {
      const next = playlist.peek();
      msg.channel.send(`Next song is: ${next[2]}.`);
    }
  }

  if (command === 'previous')
  {
    if (played.length <= 1)
    {
      msg.channel.send("No previous song.");
    }
    else
    {
      let temp = played.slice(-1).pop();
      msg.channel.send(`Previous song was: ${temp[2]}`);
    }
  }

  if (command === 'playlist')
  {
    if (playlist.isEmpty())
    {
      msg.channel.send("The playlist is empty.");
    }
    else
    {
      const list = playlist.read();
      var retstr = ""
      
      for (var i = 0; i < list.length; i++)
      {
        retstr += `Song #${i + 1} is: ${list[i][2]}.\n`;
      }
      msg.channel.send(retstr);
    }
  }
  
  if (command === 'pause') // pauses the dispatcher if playing, or does nothing
  {
    dispatcher.pause(true);
    msg.channel.send("Playback paused.");
  }

  if (command === 'resume') // resumes the dispatcher, or does nothing
  {
    dispatcher.resume();
    msg.channel.send("Playback resumed.");
  }

  if (command === 'repeat')
  {
    var param = args[0];
    
    if (param === 'one' && cursong)
    {
      repeatone = true; // causes play function to repeat current cursong
      repeatall = false;
      msg.channel.send(`Repeating ${cursong[2]}.`);
    }
    else if (param === 'all') // track playlist, and repeat whole thing once empty
    {
      repeatone = false;
      repeatall = true;
      msg.channel.send("Repeating playlist.");
    }
    else if (param === 'off') // resets repeat variables
    {
      repeatone = false;
      repeatall = false;
      msg.channel.send("Repeat off.");
    }
    else
    {
      msg.channel.send("There was nothing to repeat, or an invalid option was given. Valid options are one, all, and off.");
    }
  }

  if (command === 'skip') // starts playing the next song in the queue if it exists
  {
    if (playlist.isEmpty())
    {
      msg.channel.send("Sorry, the playlist is empty.");
    }
    else
    {
      function resolveEnd()
      {
        return new Promise((success, fail) =>
        {
          dispatcher.end();

          dispatcher.on("finish", () =>
          {
            success('Track skipped!');
          });

          dispatcher.on("error", () =>
          {
            fail('Couldn\'t skip :(');
          });
        });
      }

      resolveEnd();
    }
  }

  if (command === 'back') // if possible, adds cursong to queue at the front, starts playing last song
  {
    if (played.length == 0)
    {
      msg.channel.send("Sorry, there is no song to skip back to.");
    }
    else
    {
      function resolveEnd()
      {
        return new Promise((success, fail) =>
        {
          /*
          playlist.reset();
          repeatone = false;
          repeatall = false;
          played = [];
          dispatcher.end();
          */
          playlist.cut(cursong); // put cursong back on
          let tempsong = played[played.length - 1]; // captures the song to go back to
          played = played.splice(played.length - 1, 1); // removes the last song from played
          playlist.cut(tempsong); // put old song on the front
          dispatcher.end(); // stop playing wrong song

          dispatcher.on("finish", () =>
          {
            success('Track reversed!');
          });

          dispatcher.on("error", () =>
          {
            fail('Couldn\'t skip :(');
          });
        });
      }

      resolveEnd();
    }
  }
});

client.login(config.token);
