"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcp = void 0;
const mongodb_1 = require("mongodb");
const SMITHERY_CONFIG = {
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
    constructor() {
        this.client = null;
        this.db = null;
        this.isConnecting = false;
        this.connectionPromise = null;
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
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
    static getInstance() {
        if (!MongoMCP.instance) {
            MongoMCP.instance = new MongoMCP();
        }
        return MongoMCP.instance;
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async getClient(connectionString, retryCount = 0) {
        try {
            if (!this.client || !this.connectionPromise) {
                const options = {
                    connectTimeoutMS: 5000,
                    socketTimeoutMS: 30000,
                    serverSelectionTimeoutMS: 5000,
                    keepAlive: true,
                };
                this.connectionPromise = new mongodb_1.MongoClient(connectionString, options).connect();
                this.client = await this.connectionPromise;
            }
            // 测试连接是否有效
            await this.client.db('admin').command({ ping: 1 });
            return this.client;
        }
        catch (error) {
            this.client = null;
            this.connectionPromise = null;
            if (retryCount < this.maxRetries) {
                await this.delay(this.retryDelay);
                return this.getClient(connectionString, retryCount + 1);
            }
            throw error;
        }
    }
    async connect(config) {
        try {
            this.client = await mongodb_1.MongoClient.connect(config.connectionString);
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
// 使用单例模式
exports.mcp = MongoMCP.getInstance();
