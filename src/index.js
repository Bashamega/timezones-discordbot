const { Client, GatewayIntentBits} = require('discord.js');
require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { RegisterCommands } = require('./commands/register');
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const commands = [].map(command => command.toJSON());
RegisterCommands(commands)

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;
  }
});

client.login(token);