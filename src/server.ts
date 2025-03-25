import { mcp } from './index';
import * as dotenv from 'dotenv';

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
    const connectResult = await mcp.connect(config);
    console.log('Connection result:', connectResult);

    if (!connectResult.isError) {
      // 测试查询
      console.log('Attempting to query collection:', config.collection);
      const findResult = await mcp.find(config);
      console.log('Find result:', findResult);
    }

    // 关闭连接
    await mcp.close();
  } catch (error) {
    console.error('Detailed error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

main(); 