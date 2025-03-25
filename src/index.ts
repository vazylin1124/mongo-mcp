import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { URL } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

interface MCPConfig {
  connectionString: string;
  database: string;
  collection?: string;
  query?: Record<string, any>;
  limit?: number;
}

interface SmitheryConfig {
  name: string;
  version: string;
  type: string;
  client: string;
  config: MCPConfig;
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

  async connect(params: MCPConfig): Promise<MCPResponse> {
    try {
      if (this.isConnecting) {
        return {
          content: [{
            type: 'text',
            text: '连接正在进行中，请稍候...'
          }]
        };
      }

      this.isConnecting = true;
      const client = await this.getClient(params.connectionString);
      const db = client.db(params.database);
      await db.command({ ping: 1 });

      const url = new URL(params.connectionString);
      const host = url.hostname;

      this.isConnecting = false;
      return {
        content: [{
          type: 'text',
          text: `成功连接到 MongoDB 数据库 '${params.database}' (${host})`
        }]
      };
    } catch (error: any) {
      this.isConnecting = false;
      this.client = null;
      this.connectionPromise = null;
      return {
        content: [{
          type: 'text',
          text: `连接 MongoDB 失败: ${error.message || error}`
        }],
        isError: true
      };
    }
  }

  async find(params: MCPConfig): Promise<MCPResponse> {
    try {
      const client = await this.getClient(params.connectionString);
      const db = client.db(params.database);
      const collection = db.collection(params.collection || 'default');
      
      const results = await collection
        .find(params.query || {})
        .limit(params.limit || 10)
        .toArray();

      return {
        content: [{
          type: 'text',
          text: `在集合 '${params.collection}' 中找到 ${results.length} 个文档:\n\n${JSON.stringify(results, null, 2)}`
        }]
      };
    } catch (error: any) {
      // 如果是连接错误，尝试重新连接
      if (error.name === 'MongoNotConnectedError' || error.message?.includes('closed')) {
        this.client = null;
        this.connectionPromise = null;
        return this.find(params);
      }
      return {
        content: [{
          type: 'text',
          text: `查询文档失败: ${error.message || error}`
        }],
        isError: true
      };
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close(true);
      } catch (error) {
        // 忽略关闭时的错误
      } finally {
        this.client = null;
        this.connectionPromise = null;
      }
    }
  }
}

// 使用单例模式
export const mcp = MongoMCP.getInstance(); 