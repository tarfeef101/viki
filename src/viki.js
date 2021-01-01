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
});

client.login(config.token);
