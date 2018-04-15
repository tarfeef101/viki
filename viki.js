// Load up the discord.js library
const Discord = require("discord.js");

// Load up the shell command library
var exec = require('child_process').exec;

// Load up the queue library
const Queue = require('./Queue.js');

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
// config.token contains the bot's token
// config.prefix contains the message prefix.

client.on("ready", () =>
{
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
  
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity("Taking Over Chicago");
});

client.on("guildCreate", guild =>
{
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity("Taking Over Chicago");
});


// This plays the next song in the queue, and logs that in the channel where it was requested.
function play()
{
  let nextSong = playlist.dequeue();
  dispatcher = connection.playFile(nextSong[0]);
  console.log(`Playing ${nextSong[2]}.`);
  nextSong[1].reply(`Playing ${nextSong[2]}.`);
  dispatcher.setVolume(0.2);
  dispatcher.setBitrate(96);

  dispatcher.on("end", reason => 
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

client.on("message", async message =>
{
  // This event will run on every single message received, from any channel or DM.
  
  // Ignores bot msgs
  if (message.author.bot) return;
  
  // ignores if message isn't prefixed
  if (message.content.indexOf(config.prefix) !== 0) return;
  
  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  
  // Let's go with a few common example commands! Feel free to delete or change those.
  
  if (command === "ping")
  {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
  }
  
  if (command === "say")
  {
    // makes the bot say something and delete the original message. As an example, it's open to anyone to use. 
    // To get the "message" itself we join the `args` back into a string with spaces: 
    const sayMessage = args.join(" ");
    // Then we delete the command message (sneaky, right?). The catch just ignores the error with a cute smiley thing.
    message.delete().catch(O_o=>{}); 
    // And we get the bot to say the thing: 
    message.channel.send(sayMessage);
  }
  
  if (command === "kick") {
    // This command must be limited to mods and admins. In this example we just hardcode the role names.
    // Please read on Array.some() returns true if any element meets the passed condition (map-like)
    if (!message.member.roles.some(r=>["Administrator", "Moderator","Admin","Mod"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    
    // Let's first check if we have a member and if we can kick them!
    // message.mentions.members is a collection of people that have been mentioned, as GuildMembers.
    // We can also support getting the member by ID, which would be args[0]
    let member = message.mentions.members.first() || message.guild.members.get(args[0]);
    if (!member)
      return message.reply("Please mention a valid member of this server");
    if (!member.kickable) 
      return message.reply("I cannot kick this user! Do they have a higher role? Do I have kick permissions?");
    
    // slice(1) removes the first part, which here should be the user mention or ID
    // join(' ') takes all the various parts to make it a single string.
    let reason = args.slice(1).join(' ');
    if (!reason) reason = "No reason provided";
    
    // Now, time for a swift kick in the nuts!
    await member.kick(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't kick because of : ${error}`));
    message.reply(`${member.user.tag} has been kicked by ${message.author.tag} because: ${reason}`);

  }
  
  if (command === "ban") {
    // Most of this command is identical to kick, except that here we'll only let admins do it.
    // In the real world mods could ban too, but this is just an example, right? ;)
    if (!message.member.roles.some(r=>["Administrator"].includes(r.name)) )
      return message.reply("Sorry, you don't have permissions to use this!");
    
    let member = message.mentions.members.first();
    if (!member)
      return message.reply("Please mention a valid member of this server");
    if (!member.bannable) 
      return message.reply("I cannot ban this user! Do they have a higher role? Do I have ban permissions?");

    let reason = args.slice(1).join(' ');
    if (!reason) reason = "No reason provided";
    
    await member.ban(reason)
      .catch(error => message.reply(`Sorry ${message.author} I couldn't ban because of : ${error}`));
    message.reply(`${member.user.tag} has been banned by ${message.author.tag} because: ${reason}`);
  }
  
  if (command === "join")
  {
    // This command moves the bot to the channel given as the first arg.
    
    // This is the passed channel
    const channel = args.join(' ');
    const channelVar = message.guild.channels.find("name", channel);

    // Checks if channel is valid.
    if (!(message.guild.channels.exists("name", channel) && channelVar.type === "voice"))
      return message.reply(`Sorry ${message.author}, that channel doesn't appear to exist.`);
    
    // Joins the channel
    channelVar.join().then(conn =>
      {
        connection = conn;
        console.log('Connected!');
      }).catch(console.error);
  }

  if (command === "leave")
  {
    // this command remove the bot from the channel passed

    const channel = args.join(' ');
    const channelVar = message.guild.channels.find("name", channel);

    if (!(message.guild.channels.exists("name", channel) && channelVar.type === "voice"))
      return message.reply(`Sorry ${message.author}, that channel doesn't appear to exist.`);

    channelVar.leave();
  }
  
  if (command === "addmusic") // adds songs to queue, starts playback if none already
  {
    var type = args[0];
    if (!(musicTypes.includes(type)))
    {
      return message.reply("Sorry, that is not a valid command. Please enter something from: " + musicTypesString);
    }
    if (type == 'song' || type == 'track') type = 'title'; // account for poor beets API
    args.splice(0, 1);
    const query = args.join(' '); // creates a single string of all args (the query)
    var path; // this will hold the filepaths from our query
    exec(`beet ls -p ${type}:${query} | wc -l`, function (error, stdout, stderr)
    {
      if (error)
      {
        return message.reply(`Sorry, I encountered an issue looking for that: ${error}`);
      }
      else if (stdout === '\n' || stdout === '' || stdout === undefined)
      {
        return message.reply(`There were no results that matched your search. Please give the type and name of your query (e.g. song songname, album albumname...)`);
      }
      else
      {  
        exec(`beet ls -p ${type}:${query}`, function (error, stdout, stderr)
        {
          if (error)
          {
            return message.reply(`Sorry, I encountered an issue looking for that: ${error}`);
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
                  return message.reply(`Sorry, I encountered an issue looking for song ${i}: ${error}`);
                }
                else
                {
                  stdouts = stdouts.trim();
                  playlist.enqueue([filepathRaw, message, stdouts]);
                  
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
      message.reply(`${amt} songs added!`);
    });
  }
  
  if (command === 'stop') // clears playlist, stops music
  {
    playlist.reset();
    dispatcher.end();
    console.log("Playback stopped, playlist cleared.")
  }
  
  if (command === 'next') // returns next song in playlist, or informs that there is none
  {
    if (playlist.isEmpty())
    {
      message.reply("The playlist is empty.");
    }
    else
    {
      const next = playlist.peek();
      message.reply(`Next song is: ${next[2]}.`);
    }
  }
  
  if (command === 'pause') // pauses the dispatcher if playing, or does nothing
  {
    dispatcher.pause();
    message.reply("Playback paused.");
  }
  
  if (command === 'resume') // resumes the dispatcher, or does nothing
  {
    dispatcher.resume();
    message.reply("Playback resumed.");
  }
  
  if (command === 'skip') // starts playing the next song in the queue if it exists
  {
    if (playlist.isEmpty())
    {
      message.reply("Sorry, the playlist is empty.");
    }
    else
    {
      function resolveEnd()
      {
	return new Promise((success, fail) =>
        {
          dispatcher.end();

          dispatcher.on("end", () =>
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
