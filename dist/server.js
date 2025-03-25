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
const readline = __importStar(require("readline"));
// 加载环境变量
dotenv.config();
async function main() {
    // 创建 readline 接口
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    // 处理 tools 命令
    if (process.argv.includes('--tools')) {
        console.log(JSON.stringify(index_1.mcp.getToolList()));
        process.exit(0);
    }
    // 处理 JSON-RPC 请求
    rl.on('line', async (line) => {
        try {
            const request = JSON.parse(line);
            const response = await index_1.mcp.handleJsonRpcRequest(request);
            console.log(JSON.stringify(response));
        }
        catch (error) {
            const response = {
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32700,
                    message: 'Parse error',
                    data: error instanceof Error ? error.message : 'Unknown error'
                }
            };
            console.log(JSON.stringify(response));
        }
    });
    // 处理错误
    rl.on('error', (error) => {
        console.error('Error:', error);
        process.exit(1);
    });
    // 处理关闭
    rl.on('close', async () => {
        await index_1.mcp.close();
        process.exit(0);
    });
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
