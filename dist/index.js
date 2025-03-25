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
            this.client = await mongodb_1.MongoClient.connect(config.uri);
            this.db = this.client.db(config.database);
            return {
                success: true,
                message: `Successfully connected to database: ${config.database}`
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
            const collection = this.db.collection(config.collection || 'default');
            return await collection
                .find(config.query || {})
                .limit(config.limit || 10)
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
}
exports.mcp = new MongoMCP();
