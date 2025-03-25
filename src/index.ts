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

  private constructor() {}

  public static getInstance(): MongoMCP {
    if (!MongoMCP.instance) {
      MongoMCP.instance = new MongoMCP();
    }
    return MongoMCP.instance;
  }

  private async getClient(connectionString: string): Promise<MongoClient> {
    if (!this.client || !this.connectionPromise) {
      this.connectionPromise = new MongoClient(connectionString).connect();
      this.client = await this.connectionPromise;
    }
    return this.client;
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

  // 这个方法现在只在进程退出时调用
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.connectionPromise = null;
    }
  }
}

// 使用单例模式
export const mcp = MongoMCP.getInstance();

// 确保在进程退出时关闭连接
process.on('SIGINT', async () => {
  await mcp.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mcp.close();
  process.exit(0);
}); 