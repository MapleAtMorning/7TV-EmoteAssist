const { EmbedBuilder, MessageFlags, InteractionContextType } = require('discord.js');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');

async function uploadEmote(name, id, animated, aspectratio, guild) {
    let url;
    if (aspectratio >= 1.25) { return false; }
    if (animated) {
        url = `https://cdn.7tv.app/emote/${id}/1x.gif`;
    } else {
        url = `https://cdn.7tv.app/emote/${id}/4x.png`;
    }

    try {
        let newmoji = guild.emojis.create({ attachment: `${url}`, name: `${name}` })
        return newmoji;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function fetchEmoteData(emoteID) {
    const query = fs.readFileSync('src/gql/FindEmoteFromID.gql', 'utf8');
    let response = await fetch('https://7tv.io/v4/gql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables: { emoteID },
        }),
    })
    return response.json();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('upload')
        .setDescription('Upload either an emote or emoteset from 7TV using their ID')
        .setDefaultMemberPermissions(PermissionFlagsBits.CreateGuildExpressions)
        .setContexts(InteractionContextType.Guild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('emote')
                .setDescription('Upload an emote from its 7TV ID')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setRequired(true)
                        .setDescription('An emote\'s 7TV ID'))
                .addBooleanOption(option =>
                    option
                        .setName('replace')
                        .setDescription('Replace an existing emote with the same name')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('emoteset')
                .setDescription('Upload an emote set from its 7TV ID')
                .addStringOption(option =>
                    option
                        .setName('id')
                        .setRequired(true)
                        .setDescription('An emote set\'s 7TV ID'))),

    async execute(interaction) {
        const id = interaction.options.getString('id');

        if (interaction.options.getSubcommand() === 'emote') {
            await interaction.deferReply();
            let response = await fetchEmoteData(id);
            if (!response["data"]) {
                const unsuccessfulUploadEmbed = new EmbedBuilder()
                    .setColor('#ff9900')
                    .setTitle(`ID not found`)
                    .setDescription(`Failed to upload the emote!`)
                await interaction.followUp({ embeds: [unsuccessfulUploadEmbed], flags: MessageFlags.Ephemeral });
                return;
            }

            response = response["data"]["emotes"]["emote"];
            let name = response["defaultName"];
            let aspectRatio = response["aspectRatio"];
            let animated = response["flags"]["animated"];

            // Check if an emote already exists with the same name
            let guildEmojis = await interaction.guild.emojis.fetch()
            console.log(guildEmojis)
            let existingGuildEmoji = guildEmojis.find(emoji => emoji.name === name)
            console.log(existingGuildEmoji)

            if (existingGuildEmoji) {
                if (!interaction.options.getBoolean('replace')) {
                    const unsuccessfulUploadEmbed = new EmbedBuilder()
                        .setColor('#ff9900')
                        .setTitle(`Emote already exists`)
                        .setDescription(`Failed to upload the emote as an emote with the same name of \"${name}\" already exists in this server. Please use the replace option to replace the existing emote.`)
                    await interaction.followUp({ embeds: [unsuccessfulUploadEmbed], flags: MessageFlags.Ephemeral });
                    return;
                }
                interaction.guild.emojis.delete(existingGuildEmoji)
            }

            let newMoji = await uploadEmote(name, id, animated, aspectRatio, interaction.guild);
            if (newMoji === false || !newMoji) {
                await interaction.reply('There was an error uploading the emote.');
                return;
            }

            let extensionType = newMoji.animated ? "gif" : "png";
            const successfulUploadEmbed = new EmbedBuilder()
                .setColor('#00ff99')
                .setTitle(`${newMoji.name}`)
                .setDescription(`Successfully uploaded the emote!`)
                .addFields(
                    { name: 'ID', value: `${newMoji.id}`, inline: true },
                    { name: 'Animated', value: `${newMoji.animated}`, inline: true },
                )
                .setImage(`${newMoji.imageURL(options = { extension: extensionType, size: 256 })}`);
            await interaction.followUp({ embeds: [successfulUploadEmbed] });



        } else if (interaction.options.getSubcommand() === 'emoteset') {
            let emojis = interaction.guild.emojis.fetch()
            console.log(`There are ${emojis.size} emojis.`)
            await interaction.reply(`emoteset id: ${id}`);
        }
    },
};
