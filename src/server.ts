#!/usr/bin/env node

import { mcp } from './index';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// 加载环境变量
dotenv.config();

interface ConnectionConfig {
  uri: string;
  database: string;
  collection?: string;
  query?: Record<string, any>;
  limit?: number;
}

interface SmitheryConfig {
  mcps: {
    mongo: {
      package: string;
      connections: {
        default: ConnectionConfig;
      };
    };
  };
}

async function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);
  const command = args[0] || 'connect';

  // 尝试读取配置文件
  let config: ConnectionConfig;
  try {
    const configPath = path.resolve(process.cwd(), 'smithery.config.json');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const smitheryConfig: SmitheryConfig = JSON.parse(configContent);
    config = smitheryConfig.mcps.mongo.connections.default;
  } catch (error) {
    // 如果配置文件不存在或无效，使用环境变量
    config = {
      uri: process.env.MONGODB_URI || '',
      database: process.env.MONGODB_DATABASE || '',
      collection: process.env.MONGODB_COLLECTION || 'default',
      query: process.env.MONGODB_QUERY ? JSON.parse(process.env.MONGODB_QUERY) : {},
      limit: process.env.MONGODB_LIMIT ? parseInt(process.env.MONGODB_LIMIT) : 10
    };
  }

  // 检查必需的配置
  if (!config.uri) {
    console.error('Error: MongoDB connection string is required');
    console.error('Please set MONGODB_URI environment variable or provide it in smithery.config.json');
    process.exit(1);
  }

  if (!config.database) {
    console.error('Error: Database name is required');
    console.error('Please set MONGODB_DATABASE environment variable or provide it in smithery.config.json');
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