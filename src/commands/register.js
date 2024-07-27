const { SlashCommandBuilder } = require('@discordjs/builders');
const jsoncommands = require('./data/commands.json');

function RegisterCommands(commands) {
    jsoncommands.map(commandData =>{
        commands.push(
          new SlashCommandBuilder()
            .setName(commandData.name)
            .setDescription(commandData.description)
        )
        console.log(jsoncommands)
      })
}
module.exports = {RegisterCommands}