#!/usr/bin/env node

import { mcp } from './index';
import * as dotenv from 'dotenv';
import * as http from 'http';
import { WebSocket, WebSocketServer } from 'ws';

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

// 创建 HTTP 服务器用于健康检查
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
    return;
  }
  res.writeHead(404);
  res.end();
});

// 创建 WebSocket 服务器
const wss = new WebSocketServer({ server });

// 处理 WebSocket 连接
wss.on('connection', (ws: WebSocket) => {
  console.error('Client connected');

  // 处理 tools 命令
  if (process.argv.includes('--tools')) {
    ws.send(JSON.stringify(mcp.getToolList()));
    return;
  }

  // 处理消息
  ws.on('message', async (data: Buffer) => {
    try {
      const request: JsonRpcRequest = JSON.parse(data.toString());
      const response = await mcp.handleJsonRpcRequest(request);
      ws.send(JSON.stringify(response));
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
      ws.send(JSON.stringify(response));
    }
  });

  // 处理关闭
  ws.on('close', async () => {
    console.error('Client disconnected');
    await mcp.close();
  });

  // 处理错误
  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
  });
});

// 处理未捕获的错误
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

// 启动服务器
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
server.listen(port, () => {
  console.error(`Server is running on port ${port}`);
}); 