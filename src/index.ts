import { MongoClient, Db, Collection } from 'mongodb';
import * as dotenv from 'dotenv';

interface ConnectionConfig {
  mongoUri: string;
  mongoDatabase: string;
  mongoCollection?: string;
  mongoQuery?: Record<string, any>;
  mongoLimit?: number;
}

interface JsonRpcRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params: any;
}

interface JsonRpcResponse {
  jsonrpc: string;
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class MongoMCP {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(config: ConnectionConfig): Promise<{ success: boolean; message: string }> {
    try {
      this.client = await MongoClient.connect(config.mongoUri);
      this.db = this.client.db(config.mongoDatabase);
      return {
        success: true,
        message: `Successfully connected to database: ${config.mongoDatabase}`
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
      const collection: Collection = this.db.collection(config.mongoCollection || 'default');
      return await collection
        .find(config.mongoQuery || {})
        .limit(config.mongoLimit || 10)
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

  async handleJsonRpcRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const response: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: request.id
    };

    try {
      switch (request.method) {
        case 'connect':
          response.result = await this.connect(request.params);
          break;
        case 'find':
          response.result = await this.find(request.params);
          break;
        default:
          response.error = {
            code: -32601,
            message: 'Method not found'
          };
      }
    } catch (error: unknown) {
      response.error = {
        code: -32000,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return response;
  }

  getToolList(): any[] {
    return [
      {
        name: 'connect',
        description: 'Connect to MongoDB database',
        parameters: {
          type: 'object',
          required: ['mongoUri', 'mongoDatabase'],
          properties: {
            mongoUri: {
              type: 'string',
              description: 'MongoDB connection string'
            },
            mongoDatabase: {
              type: 'string',
              description: 'MongoDB database name'
            }
          }
        }
      },
      {
        name: 'find',
        description: 'Query documents in collection',
        parameters: {
          type: 'object',
          required: ['mongoUri', 'mongoDatabase'],
          properties: {
            mongoUri: {
              type: 'string',
              description: 'MongoDB connection string'
            },
            mongoDatabase: {
              type: 'string',
              description: 'MongoDB database name'
            },
            mongoCollection: {
              type: 'string',
              description: 'MongoDB collection name',
              default: 'default'
            },
            mongoQuery: {
              type: 'object',
              description: 'MongoDB query conditions',
              default: {}
            },
            mongoLimit: {
              type: 'number',
              description: 'Maximum number of documents to return',
              default: 10
            }
          }
        }
      }
    ];
  }
}

export const mcp = new MongoMCP(); 