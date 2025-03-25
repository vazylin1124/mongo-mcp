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
  private client: MongoClient | null = null;
  private config: SmitheryConfig;
  private configPath: string;
  private connectionString: string = '';
  private database: string = '';

  constructor() {
    this.config = SMITHERY_CONFIG;
    this.configPath = path.join(homedir(), '.smithery', 'mcp', 'mongo-mcp.json');
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }

  private saveConfig(): void {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  async ensureConnection(params: MCPConfig): Promise<void> {
    if (this.connectionString !== params.connectionString || !this.client) {
      if (this.client) {
        await this.client.close();
      }
      this.client = new MongoClient(params.connectionString);
      await this.client.connect();
      this.connectionString = params.connectionString;
      this.database = params.database;
    }
  }

  async connect(params: MCPConfig): Promise<MCPResponse> {
    try {
      await this.ensureConnection(params);
      
      const db = this.client!.db(params.database);
      await db.command({ ping: 1 });

      const url = new URL(params.connectionString);
      const host = url.hostname;

      return {
        content: [{
          type: 'text',
          text: `成功连接到 MongoDB 数据库 '${params.database}' (${host})`
        }]
      };
    } catch (error: any) {
      this.client = null;
      this.connectionString = '';
      this.database = '';
      
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
      await this.ensureConnection(params);

      const db = this.client!.db(params.database);
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
      if (error.message && error.message.includes('topology')) {
        this.client = null;
        this.connectionString = '';
        this.database = '';
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
      await this.client.close();
      this.client = null;
      this.connectionString = '';
      this.database = '';
    }
  }
}

process.on('exit', async () => {
  const instance = mcp as MongoMCP;
  await instance.close();
});

process.on('SIGINT', async () => {
  const instance = mcp as MongoMCP;
  await instance.close();
  process.exit(0);
});

export const mcp = new MongoMCP(); 