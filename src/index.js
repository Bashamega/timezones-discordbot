const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
require("dotenv").config();
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { RegisterCommands } = require("./commands/register");
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const commands = [].map((command) => command.toJSON());
RegisterCommands(commands);

const rest = new REST({ version: "9" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log("Successfully reloaded application (/) commands.");
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

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;
    const authorId = interaction.user.id;

    // Ensure that the command is "mytimezone"
    if (commandName === "mytimezone") {
      // Construct the URL dynamically, using the author's ID
      const url = `https://timezone-bot-backend.vercel.app/timezones/${authorId}`;

      try {
        // Make the fetch request to the constructed URL
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${clientId}_${token}`, // Replace with your actual token
          },
        });
        console.log(response)
        const data = await response.json();
        // Check for forbidden status
        if (response.status === 403) {
          const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("Forbidden")
            .setDescription(data.error)
            .setFooter({ text: "Timezone Bot" });

          await interaction.reply({ embeds: [embed] });
          return; // Exit early if forbidden
        }

        // Check if the array returned is empty
        if (Array.isArray(data) && data.length === 0) {
          // Create an embed to prompt the user to register
          const embed = new EmbedBuilder()
            .setColor("#ed620c")
            .setTitle("No Timezone Registered")
            .setDescription(
              "It looks like you have not registered your timezone yet. Please use `/settimezone` to set it up."
            )
            .setFooter({ text: "Timezone Bot" });

          // Send the embed response
          await interaction.reply({ embeds: [embed] });
        } else {
          // Reply with the author's ID and any data received
          await interaction.reply(
            `Author ID: ${authorId}\nTimezone Data: ${JSON.stringify(data)}`
          );
        }
      } catch (error) {
        console.error(error);
        await interaction.reply(
          "There was an error fetching the timezone data."
        );
      }
    }
  }
});

client.login(token);
