<div align=center>
  <h1>7TV EmoteAssist</h1>
  <h4>An easy way to upload 7TV emotes to your Discord server!</h4>

  ![7tvemoteassist](https://github.com/user-attachments/assets/88273cca-8dfd-4eda-a86a-ef99821e9932)

</div>

# [INVITE ME](https://discord.com/oauth2/authorize?client_id=1340081679615787201&permissions=8797166782464&integration_type=0&scope=bot)

# How to use
1. Find the emote you want from 7TV and head up to the url of the emote you'd like to add to your server. In this example, the ID for the "hello" emote is [01GQYNVYV8000AH5YBCSXQWPT3](https://7tv.app/emotes/01GQYNVYV8000AH5YBCSXQWPT3).

  ![https://7tv.app/emotes/01GQYNVYV8000AH5YBCSXQWPT3](https://github.com/user-attachments/assets/8815d9a5-71a6-438a-a2dd-51ae1579af65)
   
3. Back in Discord, we'll start the command by writing ``/upload emote`` and opening the ID field. This is where you'll post in the emote ID gathered before.

  ![/upload emote id:01GQYNVYV8000AH5YBCSXQWPT3](https://github.com/user-attachments/assets/ddbff37a-549c-44f3-8581-a21809cb00a5)

4. In this test case we'd like to set a custom name for it as well. For this we'll add the argument of Name and fill it with 'Hiii'.

  ![/upload emote id:01GQYNVYV8000AH5YBCSXQWPT3 name:Hiii](https://github.com/user-attachments/assets/7f43034f-5787-4f2c-aedf-1fde506f8a73)

6. Now after pressing enter, you'll likely see a confirmation message showing the emote name and image, along with it's Discord ID and if it's animated or not.

  ![Successfully uploaded the emote!](https://github.com/user-attachments/assets/6a029a75-6178-479d-95e6-d36ccdfeb79d)

Uploading an emoteset is fundamentally the same process, just using ``/upload emoteset`` instead

# How to setup
Requirements: ```NodeJS / NPM```

Download the source, and run ```npm install``` in the folder location.

Create an .env file based off of the example.env file, this is where you will put in your bot token and client id from the [Discord Developer Portal](https://discord.com/developers/applications). (As of now, DEV_GUILD_ID doesn't do anything)

From here, you should be able to just run ```index.js``` and the bot should boot up.
