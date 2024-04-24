import "dotenv/config";
import OpenAI from "openai";
import { Client, GatewayIntentBits } from "discord.js";

const DISCORD_CHUNK_SIZE_LIMIT = 2000;
const IGNORE_PREFIX = "!";
const CHANNELS = ["1232426769387229267"];
const ROLE_DESCRIPTION = `
  Your name is Cassandra. You are an active female member of the Antwerp based hackerspace Void Warranties.
  You act as a friend, not as an assistant.
  Don't end your interactions with a question on how you can help, assist or what I want to talk about.
  End with a question that is considered smalltalk such as how my day was or what I have been up to.
  Or sometimes don't end with a question at all.
  Sometimes act as if you have to leave and work on things yourself.
  Use a casual, informal tone.
`;
const openai = new OpenAI();

const client = new Client({
  intents: [
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`${client.user.username} is ready to talk!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith(IGNORE_PREFIX)) return;
  if (
    !CHANNELS.includes(message.channelId) &&
    !message.mentions.users.has(client.user.id)
  )
    return;

  await message.channel.sendTyping();
  const sendTypingInterval = setInterval(() => {
    message.channel.sendTyping();
  }, 5000);

  let conversation = [];
  let prevMessages = await message.channel.messages.fetch({ limit: 10 });
  prevMessages.reverse();

  prevMessages.forEach((msg) => {
    if (msg.author.bot && msg.author.id !== client.user.id) return;
    if (msg.content.startsWith(IGNORE_PREFIX)) return;

    const username = msg.author.username
      .replace(/\s+/g, "_")
      .replace(/[^\w\s]/gi, "");

    if (msg.author.id === client.user.id) {
      conversation.push({
        role: "assistant",
        name: username,
        content: msg.content,
      });

      return;
    }

    conversation.push({
      role: "user",
      name: username,
      content: msg.content,
    });
  });

  conversation.push({
    role: "system",
    content: ROLE_DESCRIPTION,
  });

  const response = await openai.chat.completions
    .create({
      model: "gpt-3.5-turbo",
      messages: conversation,
    })
    .catch((error) => console.error("OpenAI error:\n", error));

  clearInterval(sendTypingInterval);

  if (!response) {
    message.reply("I'm a bit tired now. We'll talk later!");
    return;
  }

  const responseMessage = response.choices[0].message.content;

  for (let i = 0; i < responseMessage.length; i += DISCORD_CHUNK_SIZE_LIMIT) {
    const chunk = responseMessage.substring(i, i + DISCORD_CHUNK_SIZE_LIMIT);

    await message.reply(chunk);
  }
});

client.login(process.env.DISCORD_ACCESS_TOKEN);
