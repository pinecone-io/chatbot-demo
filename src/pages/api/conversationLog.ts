import * as pg from 'pg';
import { Sequelize } from 'sequelize-cockroachdb';

const sequelize = new Sequelize(process.env.DATABASE_URL!, { logging: false, dialectModule: pg });

type ConversationLogEntry = {
  entry: string,
  created_at: Date,
  speaker: string,
}

class ConversationLog {
  constructor(
    public userId: string,
  ) {
    this.userId = userId
  }

  public async addEntry({ entry, speaker }: { entry: string, speaker: string }) {
    try {
      await sequelize.query(`INSERT INTO conversations (user_id, entry, speaker) VALUES (?, ?, ?) ON CONFLICT (created_at) DO NOTHING`, {
        replacements: [this.userId, entry, speaker],
      });
    } catch (e) {
      console.log(`Error adding entry: ${e}`)
    }
  }

  public async getConversation({ limit }: { limit: number }): Promise<string[]> {
    const conversation = await sequelize.query(`SELECT entry, speaker, created_at FROM conversations WHERE user_id = '${this.userId}' ORDER By created_at DESC LIMIT ${limit}`);
    const history = conversation[0] as ConversationLogEntry[]

    return history.map((entry) => {
      return `${entry.speaker.toUpperCase()}: ${entry.entry}`
    }).reverse()
  }

  public async clearConversation() {
    await sequelize.query(`DELETE FROM conversations WHERE user_id = '${this.userId}'`);
  }
}

export { ConversationLog }