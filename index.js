const { Client, GatewayIntentBits, Events, EmbedBuilder, Colors, ButtonBuilder, ButtonStyle, ActionRowBuilder, ActivityType } = require('discord.js');
const { Database, JSONDriver } = require('st.db');
const config = require('./config.js');

const db = new Database({
    driver: new JSONDriver('database')
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once(Events.ClientReady, async () => {
    console.log(`Logged In As ${client.user.tag} !`);
    client.user.setPresence({
        status: config.presence.status,
        activities: [{
            name: config.presence.activity.name,
            type: ActivityType[config.presence.activity.type],
            url: config.presence.activity.url
        }]
    });
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(config.bot.prefix + 'set-channel')) {
        const args = message.content.trim().split(/ +/);
        const channel = message.mentions.channels.first() || (await message.guild.channels.cache.get(args[1]));

        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply({
                content: `**You Do Not Have The Permissions To Use This Command**`
            });
        }

        if (!channel) {
            return message.reply({
                content: `**Please Mention The Channel Or Provide Its ID**`
            });
        }

        await db.set(message.guild.id, channel.id);
        message.reply({
            content: `**Done ! Set The Feedbacks Channel To ${channel}**`
        });
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(config.bot.prefix + 'remove-channel')) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply({
                content: `**You Do Not Have The Permissions To Use This Command**`
            });
        }

        if (!await db.get(message.guild.id)) {
            return message.reply({
                content: `**There Is No Feedbacks Channel In This Server**`
            });
        }

        await db.remove(message.guild.id);
        message.reply({
            content: `**Done ! Removed The Feedbacks Channel**`
        });
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(config.bot.prefix + 'help')) {
        const embed = new EmbedBuilder()
          .setTitle(`**Help Menu :**`)
          .setDescription(`**[Powered By Dark <3](https://darkdev.sayrz.com)**`)
          .addFields(
            {
                name: `${config.bot.prefix}set-channel`,
                value: `> **To Set The Feebacks Channel**`
            },
            {
                name: `${config.bot.prefix}remove-channel`,
                value: `> **To Remove The Feedbacks Channel**`
            },
            {
                name: `**${config.bot.prefix}help**`,
                value: `> **Shows This Help Embed**`
            }
          )
          .setColor(Colors.DarkButNotBlack)
          .setFooter({
            text: `Powered By Dark <3`
          })

        const websiteButton = new ButtonBuilder()
          .setLabel('Website')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://darkdev.sayrz.com`)
        
        const studioButton = new ButtonBuilder()
          .setLabel('SaYrZ Studio')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://sayrz.com`)

        const row = new ActionRowBuilder().setComponents(websiteButton, studioButton);

        message.reply({
            embeds: [embed],
            components: [row]
        });
    }
});

client.on(Events.MessageCreate, async (message) => {
    const channelID = await db.get(message.guild.id);
    const channel = await message.guild.channels.cache.get(channelID);

    if (message.author.bot) return;
    if (message.channel.id == channelID) {
        const webhook = await channel.createWebhook({
            name: message.author.displayName,
            avatar: message.author.avatarURL()
        });

        await webhook.send({
            content: message.content
        });

        message.delete();
    }
});

client.login(config.bot.token);