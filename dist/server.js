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
dotenv.config();
async function main() {
    try {
        const config = {
            connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017',
            database: process.env.MONGODB_DATABASE || 'test',
            collection: process.env.MONGODB_COLLECTION || 'default',
            query: {},
            limit: 10
        };
        console.log('Connecting with config:', {
            ...config,
            connectionString: '***hidden***' // 隐藏敏感信息
        });
        // 测试连接
        const connectResult = await index_1.mcp.connect(config);
        console.log('Connection result:', connectResult);
        if (!connectResult.isError) {
            // 测试查询
            console.log('Attempting to query collection:', config.collection);
            const findResult = await index_1.mcp.find(config);
            console.log('Find result:', findResult);
        }
        // 关闭连接
        await index_1.mcp.close();
    }
    catch (error) {
        console.error('Detailed error:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        process.exit(1);
    }
}
main();
