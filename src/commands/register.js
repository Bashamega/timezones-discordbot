const { SlashCommandBuilder } = require("@discordjs/builders");
const jsoncommands = require("./data/commands.json");

function RegisterCommands(commands) {
  jsoncommands.map((commandData) => {
    const commandBuilder = new SlashCommandBuilder()
      .setName(commandData.name)
      .setDescription(commandData.description);

    // Add an option to accept input from users
    if (commandData.options) {
      commandData.options.forEach(option => {
        commandBuilder.addStringOption(optionBuilder =>
          optionBuilder
            .setName(option.name)
            .setDescription(option.description)
            .setRequired(option.required || false) // Make it required if specified
        );
      });
    }

    commands.push(commandBuilder);
    console.log(jsoncommands);
  });
}

module.exports = { RegisterCommands };