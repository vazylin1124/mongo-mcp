import { MongoClient, Db, Collection } from 'mongodb';
import * as dotenv from 'dotenv';

interface ConnectionConfig {
  uri: string;
  database: string;
  collection?: string;
  query?: Record<string, any>;
  limit?: number;
}

class MongoMCP {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(config: ConnectionConfig): Promise<{ success: boolean; message: string }> {
    try {
      this.client = await MongoClient.connect(config.uri);
      this.db = this.client.db(config.database);
      return {
        success: true,
        message: `Successfully connected to database: ${config.database}`
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to connect to MongoDB: ${error.message}`);
      }
      throw new Error('Failed to connect to MongoDB: Unknown error');
    }
  }

  async find(config: ConnectionConfig): Promise<any[]> {
    if (!this.client || !this.db) {
      throw new Error('Not connected to MongoDB. Call connect() first.');
    }

    try {
      const collection: Collection = this.db.collection(config.collection || 'default');
      return await collection
        .find(config.query || {})
        .limit(config.limit || 10)
        .toArray();
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to execute find operation: ${error.message}`);
      }
      throw new Error('Failed to execute find operation: Unknown error');
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }
}

export const mcp = new MongoMCP(); 