/**
 * FORTRESS ZAG - Discord Bot Interface
 * 
 * Discord bot integration using discord.js.
 */

const { Client, GatewayIntentBits, Partials } = require('discord.js');

class DiscordInterface {
  constructor(agent, config = {}) {
    this.agent = agent;
    this.token = config.token || process.env.DISCORD_BOT_TOKEN;
    this.allowedChannels = config.allowedChannels || [];
    this.allowedUsers = config.allowedUsers || [];
    this.prefix = config.prefix || '!zag';
    this.client = null;
  }
  
  async start() {
    if (!this.token) {
      console.error('❌ Discord: No bot token provided');
      return false;
    }
    
    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.DirectMessages
        ],
        partials: [Partials.Channel]
      });
      
      this.client.on('ready', () => {
        console.log(`✅ Discord bot logged in as ${this.client.user.tag}`);
      });
      
      this.client.on('messageCreate', async (message) => {
        await this.handleMessage(message);
      });
      
      this.client.on('error', (error) => {
        console.error('Discord client error:', error);
      });
      
      await this.client.login(this.token);
      return true;
    } catch (error) {
      console.error('❌ Discord: Failed to start:', error.message);
      return false;
    }
  }
  
  async handleMessage(message) {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Check if message mentions the bot or starts with prefix
    const isMention = message.mentions.has(this.client.user);
    const isPrefixed = message.content.startsWith(this.prefix);
    const isDM = message.channel.type === 1; // DM channel
    
    if (!isMention && !isPrefixed && !isDM) return;
    
    // Check channel whitelist
    if (this.allowedChannels.length > 0 && !isDM) {
      if (!this.allowedChannels.includes(message.channelId)) {
        return;
      }
    }
    
    // Check user whitelist
    if (this.allowedUsers.length > 0) {
      if (!this.allowedUsers.includes(message.author.id)) {
        return;
      }
    }
    
    // Extract message text
    let text = message.content;
    
    // Remove prefix if present
    if (isPrefixed) {
      text = text.substring(this.prefix.length).trim();
    }
    
    // Remove mention if present
    if (isMention) {
      text = text.replace(/<@!?\d+>/g, '').trim();
    }
    
    if (!text) return;
    
    console.log(`[Discord] ${message.author.username}: ${text.substring(0, 50)}...`);
    
    // Show typing
    await message.channel.sendTyping();
    
    // Process message
    try {
      const response = await this.agent.processMessage({
        text: text,
        source: 'discord',
        user: message.author.username,
        userId: message.author.id,
        channelId: message.channelId,
        guildId: message.guildId,
        messageId: message.id
      });
      
      // Send response
      if (response.text) {
        const chunks = this.splitMessage(response.text, 2000);
        for (const chunk of chunks) {
          await message.reply(chunk);
        }
      }
    } catch (error) {
      console.error('Error processing Discord message:', error);
      await message.reply('❌ Error processing your request.');
    }
  }
  
  splitMessage(text, maxLength) {
    if (text.length <= maxLength) return [text];
    
    const chunks = [];
    while (text.length > maxLength) {
      let chunk = text.substring(0, maxLength);
      const lastNewline = chunk.lastIndexOf('\n');
      if (lastNewline > maxLength * 0.8) {
        chunk = chunk.substring(0, lastNewline);
      }
      chunks.push(chunk);
      text = text.substring(chunk.length);
    }
    chunks.push(text);
    return chunks;
  }
  
  async stop() {
    if (this.client) {
      await this.client.destroy();
      console.log('Discord bot stopped');
    }
  }
}

module.exports = { DiscordInterface };
