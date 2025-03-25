import { MongoClient, Db, Collection } from 'mongodb';
import * as dotenv from 'dotenv';
import { URL } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

interface ConnectionConfig {
  uri: string;
  database: string;
  collection?: string;
  query?: Record<string, any>;
  limit?: number;
}

interface SmitheryConfig {
  name: string;
  version: string;
  type: string;
  connections: {
    default: ConnectionConfig;
  };
  commands: {
    connect: {
      description: string;
      connection: string;
      parameters: string[];
    };
    find: {
      description: string;
      connection: string;
      parameters: string[];
    };
  };
}

interface SmitheryResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

interface MCPResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

const SMITHERY_CONFIG: SmitheryConfig = {
  name: "mongo-mcp-smithery",
  version: "1.0.0",
  type: "mcp",
  client: "claude",
  config: {
    connectionString: "",
    database: "",
    collection: "",
    query: {},
    limit: 10
  }
};

class MongoMCP {
  private static instance: MongoMCP;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnecting: boolean = false;
  private connectionPromise: Promise<MongoClient> | null = null;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  private constructor() {
    // 添加进程退出时的清理
    process.on('SIGINT', async () => {
      await this.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.close();
      process.exit(0);
    });
  }

  public static getInstance(): MongoMCP {
    if (!MongoMCP.instance) {
      MongoMCP.instance = new MongoMCP();
    }
    return MongoMCP.instance;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async getClient(connectionString: string, retryCount: number = 0): Promise<MongoClient> {
    try {
      if (!this.client || !this.connectionPromise) {
        const options = {
          connectTimeoutMS: 5000,
          socketTimeoutMS: 30000,
          serverSelectionTimeoutMS: 5000,
          keepAlive: true,
        };
        
        this.connectionPromise = new MongoClient(connectionString, options).connect();
        this.client = await this.connectionPromise;
      }

      // 测试连接是否有效
      await this.client.db('admin').command({ ping: 1 });
      
      return this.client;
    } catch (error: any) {
      this.client = null;
      this.connectionPromise = null;

      if (retryCount < this.maxRetries) {
        await this.delay(this.retryDelay);
        return this.getClient(connectionString, retryCount + 1);
      }
      throw error;
    }
  }

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

// 使用单例模式
export const mcp = MongoMCP.getInstance(); 