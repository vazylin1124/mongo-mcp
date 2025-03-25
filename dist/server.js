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
    // 获取命令行参数
    const args = process.argv.slice(2);
    const command = args[0] || 'connect';
    // 从环境变量构建配置
    const config = {
        connectionString: process.env.MONGODB_URI || '',
        database: process.env.MONGODB_DATABASE || '',
        collection: process.env.MONGODB_COLLECTION || 'default',
        query: process.env.MONGODB_QUERY ? JSON.parse(process.env.MONGODB_QUERY) : {},
        limit: process.env.MONGODB_LIMIT ? parseInt(process.env.MONGODB_LIMIT) : 10
    };
    // 检查必需的配置
    if (!config.connectionString) {
        console.error('Error: MongoDB connection string is required');
        console.error('Please set MONGODB_URI environment variable');
        process.exit(1);
    }
    if (!config.database) {
        console.error('Error: Database name is required');
        console.error('Please set MONGODB_DATABASE environment variable');
        process.exit(1);
    }
    try {
        switch (command) {
            case 'connect':
                console.error('Connecting to MongoDB...');
                const connectResult = await index_1.mcp.connect(config);
                console.log(JSON.stringify(connectResult, null, 2));
                break;
            case 'find':
                console.error('Querying MongoDB...');
                const findResult = await index_1.mcp.find(config);
                console.log(JSON.stringify(findResult, null, 2));
                break;
            default:
                console.error('Unknown command:', command);
                console.error('Available commands: connect, find');
                process.exit(1);
        }
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
    finally {
        // 确保在完成后关闭连接
        await index_1.mcp.close();
    }
}
// 处理未捕获的错误
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});
main();
