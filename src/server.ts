#!/usr/bin/env node

import { mcp } from './index';
import * as dotenv from 'dotenv';

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
        const connectResult = await mcp.connect(config);
        console.log(JSON.stringify(connectResult, null, 2));
        break;

      case 'find':
        console.error('Querying MongoDB...');
        const findResult = await mcp.find(config);
        console.log(JSON.stringify(findResult, null, 2));
        break;

      default:
        console.error('Unknown command:', command);
        console.error('Available commands: connect, find');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // 确保在完成后关闭连接
    await mcp.close();
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