const { SlashCommandBuilder, EmbedBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const fs = require('node:fs');

async function fetchData(user) {
    const query = fs.readFileSync('src/gql/FindUserFromName.gql', 'utf8');
    const response = await fetch('https://7tv.io/v4/gql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query,
            variables: { user },
        }),
    })
    return await response.json();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lookup')
        .setDescription('Looks up a user on 7TV')
        .setContexts(InteractionContextType.Guild)
        .addStringOption(option =>
            option.setName('user')
                .setRequired(true)
                .setDescription('The user to look up on 7TV')),

    async execute(interaction) {
        const user = interaction.options.getString('user');
        try {
            let returnedData = await fetchData(user);
            returnedData = returnedData["data"]["users"]["search"]["items"][0];

            const platform = returnedData["mainConnection"]["platform"];
            const username = returnedData["mainConnection"]["platformUsername"];
            const userAvatar = returnedData["mainConnection"]["platformAvatarUrl"];
            const userRoles = returnedData["roles"];
            const sevenTVID = returnedData["id"];
            const sevenTVEmoteSetID = returnedData["style"]["activeEmoteSetId"];
            let badges = "";
            userRoles.forEach(role => {
                role.name == "Admin" ? badges += " <:7TVAdmin:1340120676207562792>" : badges += "";
                role.name == "Verified" ? badges += " <:Verified:1340120790464462878>" : badges += "";
            });

            const userEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`${username}${badges}`)
                .setThumbnail(`${userAvatar}`)
                .addFields(
                    { name: 'Platform', value: `${platform}`, inline: true },
                    { name: '7TV ID', value: `[${sevenTVID}](https://7tv.app/users/${sevenTVID})`, inline: true },
                    { name: '7TV Emote Set ID', value: `[${sevenTVEmoteSetID}](https://7tv.app/emote-sets/${sevenTVEmoteSetID})`, inline: true },
                )
            await interaction.reply({ embeds: [userEmbed] });
        } catch (error) {
            await interaction.reply({ content: 'The person you tried to look up couldn\'t be found. Please try again & with a different username.', flags: MessageFlags.Ephemeral });
        }
    },
};
