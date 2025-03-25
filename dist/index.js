"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcp = void 0;
const mongodb_1 = require("mongodb");
const url_1 = require("url");
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
    async connect(params) {
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
            const url = new url_1.URL(params.connectionString);
            const host = url.hostname;
            this.isConnecting = false;
            return {
                content: [{
                        type: 'text',
                        text: `成功连接到 MongoDB 数据库 '${params.database}' (${host})`
                    }]
            };
        }
        catch (error) {
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
    async find(params) {
        var _a;
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
        }
        catch (error) {
            // 如果是连接错误，尝试重新连接
            if (error.name === 'MongoNotConnectedError' || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('closed'))) {
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
    async close() {
        if (this.client) {
            try {
                await this.client.close(true);
            }
            catch (error) {
                // 忽略关闭时的错误
            }
            finally {
                this.client = null;
                this.connectionPromise = null;
            }
        }
    }
}
// 使用单例模式
exports.mcp = MongoMCP.getInstance();
