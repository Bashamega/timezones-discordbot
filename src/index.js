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
    const authorId = interaction.user.id;

    // Ensure that the command is "mytimezone"
    if (commandName === 'mytimezone') {
      // Construct the URL dynamically, using the author's ID
      const url = `https://timezone-bot-backend.vercel.app/timezones/${authorId}`;

      try {
        // Make the fetch request to the constructed URL
        const response = await fetch(url);
        const data = await response.json();

        // Reply with the author's ID or any data received
        await interaction.reply(`Author ID: ${authorId}\nTimezone Data: ${JSON.stringify(data)}`);
      } catch (error) {
        console.error(error);
        await interaction.reply('There was an error fetching the timezone data.');
      }
    }
  }
});

client.login(token);