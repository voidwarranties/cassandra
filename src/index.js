import "dotenv/config";
import { Ollama } from "ollama";
import { Client, GatewayIntentBits } from "discord.js";

const DISCORD_CHUNK_SIZE_LIMIT = 2000;
const IGNORE_PREFIX = "!";

const ollama = new Ollama({ host: process.env.OLLAMA_HOST_ADDRESS });

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
    message.channelId !== process.env.DISCORD_CHANNEL_ID &&
    !message.mentions.users.has(client.user.id)
  )
    return;

  await message.channel.sendTyping();
  const sendTypingInterval = setInterval(() => {
    message.channel.sendTyping();
  }, 5000);

  let conversation = [];
  conversation.push({
    role: "system",
    content: process.env.ROLE_DESCRIPTION,
  });

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

  await ollama
    .chat({
      model: "llama3",
      messages: conversation,
    })
    .then(async (response) => {
      clearInterval(sendTypingInterval);
      const responseMessage = response.message.content;

      for (
        let i = 0;
        i < responseMessage.length;
        i += DISCORD_CHUNK_SIZE_LIMIT
      ) {
        const chunk = responseMessage.substring(
          i,
          i + DISCORD_CHUNK_SIZE_LIMIT
        );

        await message.reply(chunk);
      }
    })
    .catch(async (error) => {
      clearInterval(sendTypingInterval);
      await message.reply("Sorry, can't talk right now. We'll catch up later!");
      console.error(error);
    });
});

client.login(process.env.DISCORD_ACCESS_TOKEN);
