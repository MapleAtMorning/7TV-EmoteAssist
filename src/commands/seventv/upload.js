const { EmbedBuilder, MessageFlags, InteractionContextType } = require('discord.js');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');

async function uploadEmote(name, id, animated, guild) {
    let url;
    if (animated) {
        // Scuffed!
        try {
            let newmoji = await guild.emojis.create({ attachment: `https://cdn.7tv.app/emote/${id}/2x.gif`, name: `${name}` })
            return newmoji;
        }catch (error){
            url = `https://cdn.7tv.app/emote/${id}/1x.gif`;
            console.warn("Tried to upload higher quality gif, failed. Using 1x gif instead.")
        }
    } else {
        url = `https://cdn.7tv.app/emote/${id}/4x.png`;
    }

    try {
        let newmoji = await guild.emojis.create({ attachment: `${url}`, name: `${name}` })
        return newmoji;
    } catch (error) {
        console.warn(`Error with uploading emoji. Name: ${name} ID: ${id} Animated: ${animated}`);
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

async function fetchEmoteSetData(emoteID) {
    const query = fs.readFileSync('src/gql/GrabEmoteSet.gql', 'utf8');
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
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Change the name of the emote'))
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
            // If no data, aka ID is invalid then return and send an error message.
            if (!response["data"]) {
                const unsuccessfulUploadEmbed = new EmbedBuilder()
                    .setColor('#f34747')
                    .setTitle(`ID not found`)
                    .setDescription(`Failed to find the emote!`)
                await interaction.followUp({ embeds: [unsuccessfulUploadEmbed] });
                return;
            }

            response = response["data"]["emotes"]["emote"];
            let name;
            if (interaction.options.getString('name')) {
                name = interaction.options.getString('name');
            } else {
                name = response["defaultName"];
            }
            let aspectRatio = response["aspectRatio"];
            let animated = response["flags"]["animated"];

            // Check if an emote already exists with the same name in the guild
            let guildEmojis = await interaction.guild.emojis.fetch()
            let existingGuildEmoji = guildEmojis.find(emoji => emoji.name === name)
            if (existingGuildEmoji) {
                if (!interaction.options.getBoolean('replace')) {
                    const unsuccessfulUploadEmbed = new EmbedBuilder()
                        .setColor('#f34747')
                        .setTitle(`Emote already exists`)
                        .setDescription(`Failed to upload the emote as an emote with the same name of \"${name}\" already exists in this server. Please use the replace option to replace the existing emote.`)
                    await interaction.followUp({ embeds: [unsuccessfulUploadEmbed] });
                    return;
                }
                interaction.guild.emojis.delete(existingGuildEmoji)
            }

            // Attempt to upload the emote to the server with the uploadEmote() function
            let newMoji = await uploadEmote(name, id, animated, interaction.guild);
            if (newMoji === false || !newMoji) {
                const unsuccessfulUploadEmbed = new EmbedBuilder()
                    .setColor('#f34747')
                    .setTitle(`Emote failed to upload`)
                    .setDescription(`This could be due to the name not fitting Discord's restraints or some other issue. Try replacing the name.`)
                await interaction.followUp({ embeds: [unsuccessfulUploadEmbed] });
                return;
            }

            // If the emote was successfully uploaded, send a success message with the emote's details
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
            await interaction.deferReply();
            console.log(`Uploading emoteSet ${id} for guild ${interaction.guild.name} (${interaction.guild.id})`)

            let staticGuildEmoteSlots, animatedGuildEmoteSlots, staticEmoteSetSlots, animatedEmoteSetSlots;

            // Set the amount of slots available in the server depending on the server's boost level
            if (interaction.guild.premiumTier === 0) {
                staticGuildEmoteSlots = animatedGuildEmoteSlots = 50;
            } else if (interaction.guild.premiumTier === 1) {
                staticGuildEmoteSlots = animatedGuildEmoteSlots = 100;
            } else if (interaction.guild.premiumTier === 2) {
                staticGuildEmoteSlots = animatedGuildEmoteSlots = 150;
            } else if (interaction.guild.premiumTier === 3) {
                staticGuildEmoteSlots = animatedGuildEmoteSlots = 250;
            }

            // Lower the amount of slots available depending on how many emotes are already in the server
            let guildEmojis = await interaction.guild.emojis.fetch()
            guildEmojis.forEach(emoji => {
                if (emoji.animated) {
                    animatedGuildEmoteSlots--;
                } else {
                    staticGuildEmoteSlots--;
                }
            });

            // If the ID is invalid, return and send an error message.
            // let response = JSON.parse(fs.readFileSync('src/gql/testdata.json', 'utf8'));
            let response = await fetchEmoteSetData(id);
            if (!response["data"]) {
                const unsuccessfulUploadEmbed = new EmbedBuilder()
                    .setColor('#f34747')
                    .setTitle(`EmoteSet not found`)
                    .setDescription(`Failed to find the EmoteSet!`)
                await interaction.followUp({ embeds: [unsuccessfulUploadEmbed] });
                return;
            }
            // Trim response down to the emotes array
            response = response["data"]["emoteSets"]["emoteSet"]["emotes"]["items"];
            animatedEmoteSetSlots = staticEmoteSetSlots = 0;

            // Check how many emotes are in the emote set and divide them into animated and static.
            response.forEach(async emote => {
                emote = emote["emote"];
                let existingGuildEmoji = guildEmojis.find(emoji => emoji.name === emote.defaultName)
                // TODO: Tweak this line later to allow for zero width emotes when parameter is true.
                if (!existingGuildEmoji && emote["flags"].defaultZeroWidth === false) {
                    if (emote["flags"].animated) {
                        animatedEmoteSetSlots++;
                    } else {
                        staticEmoteSetSlots++;
                    }
                }
            });

            // If there's not enough slots in the server, return and send an error message.
            if (staticGuildEmoteSlots < staticEmoteSetSlots || animatedGuildEmoteSlots < animatedEmoteSetSlots) {
                const unsuccessfulUploadEmbed = new EmbedBuilder()
                    .setColor('#f34747')
                    .setTitle(`Too many emotes`)
                    .setDescription(`You're attempting to upload an emote set with more emotes than you have slots in your server. Please remove some emotes from the server or choose a smaller emote set.`)
                await interaction.followUp({ embeds: [unsuccessfulUploadEmbed] });
                return;
            }

            let uploadedEmoteString = "";
            let failedUploadsString = "";
            let failedUploadsIDs = "";

            const startingEmbed = new EmbedBuilder()
                .setColor('#f3d147')
                .setTitle(`Uploading Emote Set`)
                .setDescription(` `)
                .addFields(
                    { name: 'Failed Uploads', value: ``, inline: true },
                    { name: 'Failed IDs', value: ``, inline: true }
                )
            await interaction.followUp({ embeds: [startingEmbed] })

            for (let ctr = 0; response.length > ctr; ctr++) {
                let emote = response[ctr]["emote"];
                let existingGuildEmoji = guildEmojis.find(emoji => emoji.name === emote.defaultName)
                // TODO: Tweak this line later to allow for zero width emotes when parameter is true.
                if (!existingGuildEmoji && emote["flags"].defaultZeroWidth === false) {
                    let newMoji = await uploadEmote(emote.defaultName, emote.id, emote["flags"].animated, interaction.guild);
                    if (newMoji === false || !newMoji) {
                        uploadedEmoteString += `❌`
                        failedUploadsString += `${emote.defaultName}\n`
                        failedUploadsIDs += `${emote.id}\n`
                    } else {
                        console.log(emote)
                        uploadedEmoteString += `${newMoji}`
                    }
                }

                // For each loop, set the updating embed as the message except for the last loop where it sends the finished embed.
                if (response.length - 1 > ctr) {
                    const updatingEmbed = new EmbedBuilder()
                        .setColor('#f3d147')
                        .setTitle(`Uploading Emote Set`)
                        .setDescription(`Uploading emotes... ${uploadedEmoteString}`)
                        .addFields(
                            { name: 'Failed Uploads', value: `${failedUploadsString}`, inline: true },
                            { name: 'Failed IDs', value: `${failedUploadsIDs}`, inline: true }
                        )
                    await interaction.editReply({ embeds: [updatingEmbed] })
                } else {
                    if (failedUploadsString == "") { failedUploadsString = failedUploadsIDs = "None!" }
                    const finishedEmbed = new EmbedBuilder()
                        .setColor('#00ff99')
                        .setTitle(`Emote Set Uploaded`)
                        .setDescription(`Emotes Uploaded! ${uploadedEmoteString}`)
                        .addFields(
                            { name: 'Failed Uploads', value: `${failedUploadsString}`, inline: true },
                            { name: 'Failed IDs', value: `${failedUploadsIDs}`, inline: true }
                        )
                await interaction.editReply({ embeds: [finishedEmbed] })
            }
        }
    }
},
};
