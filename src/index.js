const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
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

    if (commandName === "mytimezone") {
      const url = `https://timezone-bot-backend.vercel.app/timezones/${authorId}`;
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${clientId}_${token}`,
          },
        });
        const data = await response.json();

        if (response.status === 403) {
          const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("Forbidden")
            .setDescription(data.error)
            .setFooter({ text: "Timezone Bot" });
          await interaction.reply({ embeds: [embed] });
          return;
        }

        if (Array.isArray(data) && data.length === 0) {
          const embed = new EmbedBuilder()
            .setColor("#ed620c")
            .setTitle("No Timezone Registered")
            .setDescription(
              "It looks like you have not registered your timezone yet. Please use `/settimezone` to set it up."
            )
            .setFooter({ text: "Timezone Bot" });
          await interaction.reply({ embeds: [embed] });
        } else {
          const embed = new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle("Timezone Data")
            .setDescription(`Author ID: ${authorId}\nTimezone Data: ${JSON.stringify(data)}`)
            .setFooter({ text: "Timezone Bot" });
          await interaction.reply({ embeds: [embed] });
        }
      } catch (error) {
        console.error(error);
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("Error")
          .setDescription("There was an error fetching the timezone data.")
          .setFooter({ text: "Timezone Bot" });
        await interaction.reply({ embeds: [embed] });
      }
    }

    if (commandName === "settimezone") {
      // Create a dropdown menu for selecting a timezone
      const timezones = [
        { label: "UTC", value: "UTC" },
        { label: "PST", value: "America/Los_Angeles" },
        { label: "MST", value: "America/Denver" },
        { label: "CST", value: "America/Chicago" },
        { label: "EST", value: "America/New_York" },
        { label: "GMT", value: "GMT" },
        // Add more timezones as needed
      ];

      const timezoneSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('timezone_select')
        .setPlaceholder('Select your timezone')
        .addOptions(timezones);

      const row = new ActionRowBuilder().addComponents(timezoneSelectMenu);

      const embed = new EmbedBuilder()
        .setColor("#0099FF")
        .setTitle("Select Your Timezone")
        .setDescription("Please select your timezone from the dropdown below:")
        .setFooter({ text: "Timezone Bot" });

      await interaction.reply({
        embeds: [embed],
        components: [row],
      });
    }
  }

  // Handle the selection of the timezone from the dropdown
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'timezone_select') {
      const selectedTimezone = interaction.values[0];
      const url = `https://timezone-bot-backend.vercel.app/timezones/`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${clientId}_${token}`,
          },
          body: JSON.stringify({
            timezone: selectedTimezone,
            discord_user_id: interaction.user.id
          }),
        });

        if (response.ok) {
          const embed = new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle("Timezone Set")
            .setDescription(`Your timezone has been set to: ${selectedTimezone}`)
            .setFooter({ text: "Timezone Bot" });
          await interaction.reply({ embeds: [embed] });
        } else {
          const data = await response.json();
          const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("Failed to Set Timezone")
            .setDescription(`Failed to set timezone: ${data.error}`)
            .setFooter({ text: "Timezone Bot" });
          await interaction.reply({ embeds: [embed] });
        }
      } catch (error) {
        console.error(error);
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("Error")
          .setDescription("There was an error setting your timezone.")
          .setFooter({ text: "Timezone Bot" });
        await interaction.reply({ embeds: [embed] });
      }
    }
  }
});

client.login(token);