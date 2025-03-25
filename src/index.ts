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

  async connect(params: MCPConfig): Promise<SmitheryResponse> {
    try {
      this.client = new MongoClient(params.connectionString);
      await this.client.connect();
      
      const db = this.client.db(params.database);
      await db.command({ ping: 1 });

      const url = new URL(params.connectionString);
      const host = url.hostname;

      return {
        content: [{
          type: 'text',
          text: `Successfully connected to MongoDB database '${params.database}' at ${host}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Failed to connect to MongoDB: ${error}`
        }],
        isError: true
      };
    }
  }

  async find(params: MCPConfig): Promise<SmitheryResponse> {
    try {
      if (!this.client) {
        await this.connect(params);
      }

      const db = this.client!.db(params.database);
      const collection = db.collection(params.collection || 'default');
      const results = await collection
        .find(params.query || {})
        .limit(params.limit || 10)
        .toArray();

      return {
        content: [{
          type: 'text',
          text: `Found ${results.length} documents in collection '${params.collection}':\n\n${JSON.stringify(results, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Failed to find documents: ${error}`
        }],
        isError: true
      };
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }
}

export const mcp = new MongoMCP(); 