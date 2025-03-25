#!/usr/bin/env node

import { mcp } from './index';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// 加载环境变量
dotenv.config();

interface JsonRpcRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params: any;
}

interface JsonRpcResponse {
  jsonrpc: string;
  id: number | string | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

async function main() {
  // 创建 readline 接口
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  // 处理 tools 命令
  if (process.argv.includes('--tools')) {
    console.log(JSON.stringify(mcp.getToolList()));
    process.exit(0);
  }

  // 处理 JSON-RPC 请求
  rl.on('line', async (line) => {
    try {
      const request: JsonRpcRequest = JSON.parse(line);
      const response = await mcp.handleJsonRpcRequest(request);
      console.log(JSON.stringify(response));
    } catch (error) {
      const response: JsonRpcResponse = {
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
    await mcp.close();
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