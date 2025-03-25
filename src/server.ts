#!/usr/bin/env node

import { mcp } from './index';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function main() {
  const config = {
    connectionString: process.env.connectionString || '',
    database: process.env.database || '',
    collection: process.env.collection || 'default',
    query: process.env.query ? JSON.parse(process.env.query) : {},
    limit: process.env.limit ? parseInt(process.env.limit) : 10
  };

  // 监听命令行参数
  const command = process.argv[2] || 'connect';

  try {
    switch (command) {
      case 'connect':
        const connectResult = await mcp.connect(config);
        console.log(JSON.stringify(connectResult, null, 2));
        break;

      case 'find':
        const findResult = await mcp.find(config);
        console.log(JSON.stringify(findResult, null, 2));
        break;

      default:
        console.error('Unknown command:', command);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main(); 