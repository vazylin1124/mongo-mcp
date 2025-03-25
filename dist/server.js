#!/usr/bin/env node
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
const index_1 = require("./index");
const dotenv = __importStar(require("dotenv"));
// 加载环境变量
dotenv.config();
async function main() {
    const config = {
        connectionString: process.env.MONGODB_URI || process.env.connectionString || '',
        database: process.env.MONGODB_DATABASE || process.env.database || '',
        collection: process.env.MONGODB_COLLECTION || process.env.collection || 'default',
        query: process.env.MONGODB_QUERY ? JSON.parse(process.env.MONGODB_QUERY) :
            process.env.query ? JSON.parse(process.env.query) : {},
        limit: process.env.MONGODB_LIMIT ? parseInt(process.env.MONGODB_LIMIT) :
            process.env.limit ? parseInt(process.env.limit) : 10
    };
    // 检查必需的配置
    if (!config.connectionString) {
        console.error('Error: MongoDB connection string is required');
        process.exit(1);
    }
    if (!config.database) {
        console.error('Error: Database name is required');
        process.exit(1);
    }
    // 监听命令行参数
    const command = process.argv[2] || 'connect';
    try {
        switch (command) {
            case 'connect':
                const connectResult = await index_1.mcp.connect(config);
                console.log(JSON.stringify(connectResult, null, 2));
                break;
            case 'find':
                const findResult = await index_1.mcp.find(config);
                console.log(JSON.stringify(findResult, null, 2));
                break;
            default:
                console.error('Unknown command:', command);
                process.exit(1);
        }
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}
main();
