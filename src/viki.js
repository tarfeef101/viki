// Load up the discord.js library
const Discord = require("discord.js");

// Initialize the bot.
const client = new Discord.Client();

// this allows us to define a voice connection with global scope
var connection;
var dispatcher;

// Here we load the config.json file that contains our token and our prefix values.
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.


client.on("ready", () =>
{
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);

  console.log(`users: ${client.users}`);

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


client.on('message', msg => {
  if (msg.content === '!ping') {
    msg.reply('pong');
    channel = msg.guild.channels.cache.find(each => each.name === "General" && each.type === "voice");
    if (channel)
    {
      console.log(channel.name);

      channel.join().then(conn =>
      {
        connection = conn;
        console.log('Connected!');
      }).catch(console.error);
    }
  }
});

client.login(config.token);
