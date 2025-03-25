"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcp = void 0;
const mongodb_1 = require("mongodb");
class MongoMCP {
    constructor() {
        this.client = null;
        this.db = null;
    }
    async connect(config) {
        try {
            this.client = await mongodb_1.MongoClient.connect(config.mongoUri);
            this.db = this.client.db(config.mongoDatabase);
            return {
                success: true,
                message: `Successfully connected to database: ${config.mongoDatabase}`
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to connect to MongoDB: ${error.message}`);
            }
            throw new Error('Failed to connect to MongoDB: Unknown error');
        }
    }
    async find(config) {
        if (!this.client || !this.db) {
            throw new Error('Not connected to MongoDB. Call connect() first.');
        }
        try {
            const collection = this.db.collection(config.mongoCollection || 'default');
            return await collection
                .find(config.mongoQuery || {})
                .limit(config.mongoLimit || 10)
                .toArray();
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to execute find operation: ${error.message}`);
            }
            throw new Error('Failed to execute find operation: Unknown error');
        }
    }
    async close() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
        }
    }
    async handleJsonRpcRequest(request) {
        const response = {
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
        }
        catch (error) {
            response.error = {
                code: -32000,
                message: error instanceof Error ? error.message : 'Unknown error'
            };
        }
        return response;
    }
    getToolList() {
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
exports.mcp = new MongoMCP();
