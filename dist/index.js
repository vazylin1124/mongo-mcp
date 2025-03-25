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
    }
    static getInstance() {
        if (!MongoMCP.instance) {
            MongoMCP.instance = new MongoMCP();
        }
        return MongoMCP.instance;
    }
    async getClient(connectionString) {
        if (!this.client || !this.connectionPromise) {
            this.connectionPromise = new mongodb_1.MongoClient(connectionString).connect();
            this.client = await this.connectionPromise;
        }
        return this.client;
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
    // 这个方法现在只在进程退出时调用
    async close() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.connectionPromise = null;
        }
    }
}
// 使用单例模式
exports.mcp = MongoMCP.getInstance();
// 确保在进程退出时关闭连接
process.on('SIGINT', async () => {
    await exports.mcp.close();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await exports.mcp.close();
    process.exit(0);
});
