const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
require("dotenv").config();
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { RegisterCommands } = require("./commands/register");
const { DateTime } = require("luxon");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const rest = new REST({ version: "9" }).setToken(token);
const commands = []; // Add your commands here
RegisterCommands(commands);

async function refreshCommands() {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("Error reloading commands:", error);
  }
}

function extractUserId(mention) {
  const match = mention.match(/^<@(\d+)>$/);
  return match ? match[1] : null;
}

async function fetchTimezone(url, headers) {
  const response = await fetch(url, { method: "GET", headers });
  return response.json();
}

function buildEmbed({ title, description, color, fields = [], footer = "Timezone Bot" }) {
  const embed = new EmbedBuilder().setColor(color).setTitle(title).setFooter({ text: footer });
  if (description) embed.setDescription(description);
  if (fields.length) embed.addFields(fields);
  return embed;
}

async function handleMyTimezoneCommand(interaction, authorId) {
  const url = `https://timezone-bot-backend.vercel.app/timezones/${authorId}`;
  const headers = { Authorization: `Bearer ${clientId}_${token}` };

  try {
    const data = await fetchTimezone(url, headers);

    if (data.error) {
      const embed = buildEmbed({ title: "Forbidden", description: data.error, color: "#FF0000" });
      return interaction.reply({ embeds: [embed] });
    }

    if (data.length === 0) {
      const embed = buildEmbed({
        title: "No Timezone Registered",
        description: "Use `/settimezone` to set your timezone.",
        color: "#ed620c",
      });
      return interaction.reply({ embeds: [embed] });
    }

    const timezone = data[0].timezone;
    if (DateTime.local().setZone(timezone).isValid) {
      const currentTime = DateTime.now().setZone(timezone).toLocaleString(DateTime.DATETIME_FULL);
      const embed = buildEmbed({
        title: "Timezone Data",
        color: "#00FF00",
        fields: [
          { name: "Your timezone:", value: timezone },
          { name: "Your current time", value: currentTime },
        ],
      });
      return interaction.reply({ embeds: [embed] });
    } else {
      const embed = buildEmbed({ title: "Invalid timezone provided", color: "#f70a0a" });
      return interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error("Error fetching timezone:", error);
    const embed = buildEmbed({
      title: "Error",
      description: "There was an error fetching the timezone data.",
      color: "#FF0000",
    });
    interaction.reply({ embeds: [embed] });
  }
}

async function handleSetTimezoneCommand(interaction) {
  const offsetsToInclude = [-12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const timezones = offsetsToInclude.map(offset => ({
    label: `GMT${offset >= 0 ? "+" : ""}${offset}:00`,
    value: `Etc/GMT${offset >= 0 ? "-" : "+"}${Math.abs(offset)}`,
  }));

  const timezoneSelectMenu = new StringSelectMenuBuilder()
    .setCustomId("timezone_select")
    .setPlaceholder("Select your timezone")
    .addOptions(timezones.slice(0, 25));

  const row = new ActionRowBuilder().addComponents(timezoneSelectMenu);
  const embed = buildEmbed({
    title: "Select Your Timezone",
    description: "Please select your timezone from the dropdown below:",
    color: "#0099FF",
  });

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleUserTimezoneCommand(interaction) {
  const username = interaction.options.getString("username");
  const userId = extractUserId(username);
  const url = `https://timezone-bot-backend.vercel.app/timezones/${userId}`;
  const headers = { Authorization: `Bearer ${clientId}_${token}` };

  try {
    const data = await fetchTimezone(url, headers);

    if (data.error) {
      const embed = buildEmbed({ title: "Forbidden", description: data.error, color: "#FF0000" });
      return interaction.reply({ embeds: [embed] });
    }

    if (data.length === 0) {
      const embed = buildEmbed({
        title: "No Timezone Registered",
        description: `${username} has not registered their timezone yet.`,
        color: "#ed620c",
      });
      return interaction.reply({ embeds: [embed] });
    }

    const timezone = data[0].timezone;
    if (DateTime.local().setZone(timezone).isValid) {
      const currentTime = DateTime.now().setZone(timezone).toLocaleString(DateTime.DATETIME_FULL);
      const embed = buildEmbed({
        title: "Timezone Data",
        color: "#00FF00",
        fields: [
          { name: "User's timezone:", value: timezone },
          { name: "User's current time", value: currentTime },
        ],
      });
      return interaction.reply({ embeds: [embed] });
    } else {
      const embed = buildEmbed({ title: "Invalid timezone provided", color: "#f70a0a" });
      return interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error("Error fetching user's timezone:", error);
    const embed = buildEmbed({
      title: "Error",
      description: "There was an error fetching the user's timezone data.",
      color: "#FF0000",
    });
    interaction.reply({ embeds: [embed] });
  }
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;
    const authorId = interaction.user.id;

    if (commandName === "mytimezone") {
      await handleMyTimezoneCommand(interaction, authorId);
    } else if (commandName === "settimezone") {
      await handleSetTimezoneCommand(interaction);
    } else if (commandName === "user_timezone") {
      await handleUserTimezoneCommand(interaction);
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "timezone_select") {
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
          discord_user_id: interaction.user.id,
        }),
      });

      if (response.ok) {
        const embed = buildEmbed({
          title: "Timezone Set",
          description: `Your timezone has been set to: ${selectedTimezone}`,
          color: "#00FF00",
        });
        await interaction.reply({ embeds: [embed] });
      } else {
        const data = await response.json();
        const embed = buildEmbed({
          title: "Failed to Set Timezone",
          description: `Failed to set timezone: ${data.error}`,
          color: "#FF0000",
        });
        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error setting timezone:", error);
      const embed = buildEmbed({
        title: "Error",
        description: "There was an error setting your timezone.",
        color: "#FF0000",
      });
      await interaction.reply({ embeds: [embed] });
    }
  }
});

client.login(token);
refreshCommands();