/* eslint-disable max-len */
/* eslint-disable consistent-return */
const Discord = require('discord.js');
const eco = require('discordenvo');

const cooldowns = new Discord.Collection();

module.exports = async (client, message) => {
  // Ignore all bots
  if (message.author.bot) {
    return;
  }

  // Blacklist so no stupid spam bot can wreak havoc on 1-Up World
  client.blacklist.ensure(message.guild.id, []);

  const blacklist = client.blacklist.get(message.guild.id);

  // eslint-disable-next-line no-restricted-syntax
  for (const i in blacklist) {
    if (message.content.toLowerCase().includes(blacklist[i].toLowerCase())) {
      message.delete();

      if (!message.member.kickable) {
        console.log(`Unable to kick ${message.author.tag} because of missing permissions`);
      } else {
        message.member.kick('Spam Bot / Raider');
      }
    }
  }

  // When bot is mentioned, display this message
  const prefixMention = new RegExp(`^<@!?${client.user.id}>( |)$`);
  if (message.content.match(prefixMention)) {
    if (message.channel.id === '355186664869724161') {
      const embed = new Discord.RichEmbed()
        .setColor('RANDOM')
        .setDescription(`Hey ${message.author}! I'm ${client.user}, a bot made by **${client.fetchOwner().tag}** for the **1-Up World Discord server**! I mainly handle Faction Battle stuff along with distributing roles but I've got other fun commands! Use \`.help\` to see a full list! Remember to ping or DM ${client.fetchOwner().username} with any questions, comments, or feedback!`);

      message.channel.send(embed);
    } else {
      return;
    }
  }

  const settings = client.getSettings(message.guild);
  const level = client.permLevel(message);

  // Ignore messages not starting with the prefix
  if (message.content.indexOf(settings.prefix) !== 0) {
    return;
  }

  // Our standard argument/command name definition.
  const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (message.guild && !message.member) {
    await message.guild.fetchMember(message.author);
  }

  // Grab the command data and aliases from the client.commands Enmap
  const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command));
  const enabledCmds = client.enabledCmds.get(command) || client.enabledCmds.get(client.aliases.get(command));

  // If that command doesn't exist, silently exit and do nothing
  if (!cmd) {
    return;
  }

  // Custom objects on message
  message.success = (suc, msg) => {
    message.channel.send(`${client.emoji.checkMark} **${suc}**\n${msg}`);
  };

  message.error = (err, msg) => {
    message.channel.send(`${client.emoji.redX} **${err}**\n${msg}`);
  };

  if (enabledCmds.enabled === false) {
    if (message.author.id !== client.config.ownerID) {
      return message.error('Command Disabled!', 'This command is currently disabled!');
    }
  }

  if (!message.guild && cmd.conf.guildOnly) {
    return message.error('Command Not Available in DMs!', 'This command is unavailable in DMs. Please use it in a server!');
  }

  // eslint-disable-next-line prefer-destructuring
  message.author.permLevel = level[1];

  if (level[1] < client.levelCache[cmd.conf.permLevel]) {
    message.error('Invalid Permissions!', `You do not currently have the proper permssions to run this command!\n**Current Level:** \`${level[0]}: Level ${level[1]}\`\n**Level Required:** \`${cmd.conf.permLevel}: Level ${client.levelCache[cmd.conf.permLevel]}\``);
    return console.log(`${message.author.tag} (${message.author.id}) tried to use cmd ${cmd.help.name} without proper perms!`);
  }

  if (cmd.conf.args && (cmd.conf.args > args.length)) {
    return message.error('Invalid Arguments!', `The proper usage for this command is \`${settings.prefix}${cmd.help.usage}\`! For more information, please see the help command by using \`${settings.prefix}help ${cmd.help.name}\`!`);
  }

  if (!cooldowns.has(cmd.name)) {
    cooldowns.set(cmd.name, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(cmd.name);
  const cooldownAmount = (cmd.conf.cooldown || 0) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      let timeLeft = (expirationTime - now) / 1000;
      let time = 'second(s)';
      if (cmd.conf.cooldown > 60) {
        timeLeft = (expirationTime - now) / 60000;
        time = 'minute(s)';
      }
      return message.error('Woah There Bucko!', `Please wait **${timeLeft.toFixed(2)} more ${time}** before reusing the \`${cmd.name}\` command!`);
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  message.flags = [];
  while (args[0] && args[0][0] === '-') {
    message.flags.push(args.shift().slice(1));
  }

  // Run the command
  const guildUsed = message.guild ? `**${message.guild.name}** *(${message.guild.id})*` : '**DMs**';

  console.log(`**${message.author.tag}** *(${message.author.id})* ran cmd \`${cmd.help.name}\` in ${guildUsed}!`);
  cmd.run(client, message, args, level[1], Discord, eco);
};
