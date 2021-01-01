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
// this is the playlist queue for music
var playlist = new Queue();
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
  let nextSong = playlist.dequeue();
  dispatcher = connection.play(nextSong[0]);
  console.log(`Playing ${nextSong[2]}.`);
  nextSong[1].reply(`Playing ${nextSong[2]}.`);
  dispatcher.setVolume(0.2);
  dispatcher.setBitrate(96);

  dispatcher.on("finish", reason => 
  {
    if (!(playlist.isEmpty()))
    {
      play();
      console.log(reason);
    }
    else
    {
      console.log("Playlist exhausted, music playback stopped.");
    }
  });
}

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

  if (command === "addmusic") // adds songs to queue, starts playback if none already
  {
    var type = args[0];
    if (!(musicTypes.includes(type)))
    {
      return msg.reply("Sorry, that is not a valid command. Please enter something from: " + musicTypesString);
    }
    if (type == 'song' || type == 'track') type = 'title'; // account for poor beets API
    args.splice(0, 1);
    const query = args.join(' '); // creates a single string of all args (the query)
    var path; // this will hold the filepaths from our query
    exec(`beet ls -p ${type}:${query} | wc -l`, function (error, stdout, stderr)
    {
      if (error)
      {
        return msg.reply(`Sorry, I encountered an issue looking for that: ${error}`);
      }
      else if (stdout === '\n' || stdout === '' || stdout === undefined)
      {
        return msg.reply(`There were no results that matched your search. Please give the type and name of your query (e.g. song songname, album albumname...)`);
      }
      else
      {  
        exec(`beet ls -p ${type}:${query}`, function (error, stdout, stderr)
        {
          if (error)
          {
            return msg.reply(`Sorry, I encountered an issue looking for that: ${error}`);
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
                  return msg.reply(`Sorry, I encountered an issue looking for song ${i}: ${error}`);
                }
                else
                {
                  stdouts = stdouts.trim();
                  playlist.enqueue([filepathRaw, msg, stdouts]);
                  
                  // check if music is playing, if not start it
                  if ((dispatcher === undefined || dispatcher.destroyed == true) && !(playlist.isEmpty()))
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
      msg.reply(`${amt} songs added!`);
    });
  }
  
  if (command === 'stop') // clears playlist, stops music
  {
    playlist.reset();
    dispatcher.destroy();
    console.log("Playback stopped, playlist cleared.")
  }
  
  if (command === 'next') // returns next song in playlist, or informs that there is none
  {
    if (playlist.isEmpty())
    {
      msg.reply("The playlist is empty.");
    }
    else
    {
      const next = playlist.peek();
      msg.reply(`Next song is: ${next[2]}.`);
    }
  }
  
  if (command === 'pause') // pauses the dispatcher if playing, or does nothing
  {
    dispatcher.pause();
    msg.reply("Playback paused.");
  }
  
  if (command === 'resume') // resumes the dispatcher, or does nothing
  {
    dispatcher.resume();
    msg.reply("Playback resumed.");
  }
  
  if (command === 'skip') // starts playing the next song in the queue if it exists
  {
    if (playlist.isEmpty())
    {
      msg.reply("Sorry, the playlist is empty.");
    }
    else
    {
      function resolveEnd()
      {
        return new Promise((success, fail) =>
        {
          dispatcher.destroy();

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
});

client.login(config.token);
