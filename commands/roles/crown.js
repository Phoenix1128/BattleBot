module.exports = {
  name: 'crown',
  category: 'roles',
  description: 'Gives the mentioned user the Crown role',
  usage: '[@User]',
  args: '[@User] => A valid member of the server',
  modonly: true,
  async run(client, message, args) {
    // Setting the crown role
    const crown = client.roleFind(message, 'Crown');

    // Setting the member to the user mentioned
    const member = message.mentions.members.first() || message.guild.members.get(args[0]);

    // If no user mentioned, display this message
    if (!member) {
      return message.reply('Please mention a valid member of this server to give the Crown role to!');
    }

    // Add role, if fails log and display the message
    member.addRole(crown).catch((err) => {
      message.reply('Something went wrong...');
      console.log(err);
    });
    // Displays the success message
    return message.channel.send(`Successfully gave the Crown role to **${member}**!`);
  },
};
