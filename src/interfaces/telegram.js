/**
 * FORTRESS ZAG - Telegram Bot Interface
 * 
 * Telegram bot integration using node-telegram-bot-api.
 */

const TelegramBot = require('node-telegram-bot-api');

class TelegramInterface {
  constructor(agent, config = {}) {
    this.agent = agent;
    this.token = config.token || process.env.TELEGRAM_BOT_TOKEN;
    this.allowedUsers = config.allowedUsers || []; // Whitelist of user IDs
    this.bot = null;
  }
  
  async start() {
    if (!this.token) {
      console.error('❌ Telegram: No bot token provided');
      return false;
    }
    
    try {
      this.bot = new TelegramBot(this.token, { polling: true });
      
      // Handle messages
      this.bot.on('message', async (msg) => {
        await this.handleMessage(msg);
      });
      
      // Handle errors
      this.bot.on('error', (error) => {
        console.error('Telegram bot error:', error);
      });
      
      console.log('✅ Telegram bot started');
      return true;
    } catch (error) {
      console.error('❌ Telegram: Failed to start:', error.message);
      return false;
    }
  }
  
  async handleMessage(msg) {
    // Check user whitelist
    if (this.allowedUsers.length > 0 && !this.allowedUsers.includes(msg.from.id)) {
      console.log(`Blocked message from unauthorized user: ${msg.from.id}`);
      return;
    }
    
    // Ignore non-text messages
    if (!msg.text) return;
    
    console.log(`[Telegram] ${msg.from.username || msg.from.id}: ${msg.text.substring(0, 50)}...`);
    
    // Show typing indicator
    this.bot.sendChatAction(msg.chat.id, 'typing');
    
    // Process message
    try {
      const response = await this.agent.processMessage({
        text: msg.text,
        source: 'telegram',
        user: msg.from.username || msg.from.id.toString(),
        userId: msg.from.id,
        chatId: msg.chat.id,
        messageId: msg.message_id
      });
      
      // Send response
      if (response.text) {
        // Split long messages
        const chunks = this.splitMessage(response.text, 4000);
        for (const chunk of chunks) {
          await this.bot.sendMessage(msg.chat.id, chunk, {
            reply_to_message_id: msg.message_id
          });
        }
      }
    } catch (error) {
      console.error('Error processing Telegram message:', error);
      await this.bot.sendMessage(msg.chat.id, '❌ Error processing your request.');
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
    if (this.bot) {
      this.bot.stopPolling();
      console.log('Telegram bot stopped');
    }
  }
}

module.exports = { TelegramInterface };
