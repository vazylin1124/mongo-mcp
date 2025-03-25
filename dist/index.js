"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcp = void 0;
const mongodb_1 = require("mongodb");
const url_1 = require("url");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os_1 = require("os");
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
        this.config = SMITHERY_CONFIG;
        this.configPath = path.join((0, os_1.homedir)(), '.smithery', 'mcp', 'mongo-mcp.json');
        this.loadConfig();
    }
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            }
        }
        catch (error) {
            console.error('Error loading config:', error);
        }
    }
    saveConfig() {
        try {
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        }
        catch (error) {
            console.error('Error saving config:', error);
        }
    }
    async connect(params) {
        try {
            this.client = new mongodb_1.MongoClient(params.connectionString);
            await this.client.connect();
            const db = this.client.db(params.database);
            await db.command({ ping: 1 });
            const url = new url_1.URL(params.connectionString);
            const host = url.hostname;
            return {
                content: [{
                        type: 'text',
                        text: `Successfully connected to MongoDB database '${params.database}' at ${host}`
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `Failed to connect to MongoDB: ${error}`
                    }],
                isError: true
            };
        }
    }
    async find(params) {
        try {
            if (!this.client) {
                await this.connect(params);
            }
            const db = this.client.db(params.database);
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
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `Failed to find documents: ${error}`
                    }],
                isError: true
            };
        }
    }
    async close() {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
    }
}
exports.mcp = new MongoMCP();
