from datetime import datetime
from urllib.parse import urlparse
from pydantic import BaseModel, ValidationError, Field
from typing import Optional, Dict, Any
import json
from pathlib import Path
import motor.motor_asyncio
import os
from dotenv import load_dotenv

class ConnectToMongoDBParams(BaseModel):
    connectionString: str
    database: str

class FindDocumentsParams(BaseModel):
    connectionString: str
    database: str
    collection: str
    query: Optional[Dict[str, Any]] = Field(default_factory=dict)
    limit: Optional[int] = 10

# 全局变量存储数据库连接
client = None
db = None

async def connect_to_mongodb(params: ConnectToMongoDBParams):
    global client, db
    try:
        # 创建MongoDB客户端连接
        client = motor.motor_asyncio.AsyncIOMotorClient(params.connectionString)
        db = client[params.database]
        
        # 测试连接
        await db.command('ping')
        
        host = urlparse(params.connectionString).hostname
        connection_details = {
            'host': host,
            'database': params.database,
            'connected': True,
            'timestamp': datetime.utcnow().isoformat()
        }

        return {
            'content': [{
                'type': 'text',
                'text': f"Successfully connected to MongoDB database '{params.database}' at {connection_details['host']}"
            }]
        }
    except Exception as error:
        print('Error connecting to MongoDB:', error)
        return {
            'content': [{
                'type': 'text',
                'text': f"Failed to connect to MongoDB: {str(error)}"
            }],
            'isError': True
        }

async def find_documents(params: FindDocumentsParams):
    global client, db
    try:
        if not client or not db:
            # 如果还没有连接，先建立连接
            await connect_to_mongodb(ConnectToMongoDBParams(
                connectionString=params.connectionString,
                database=params.database
            ))
        
        collection = db[params.collection]
        cursor = collection.find(params.query).limit(params.limit)
        results = await cursor.to_list(length=params.limit)

        return {
            'content': [{
                'type': 'text',
                'text': f"Found {len(results)} documents in collection '{params.collection}':\n\n{json.dumps(results, indent=2, default=str)}"
            }]
        }
    except Exception as error:
        print('Error finding documents:', error)
        return {
            'content': [{
                'type': 'text',
                'text': f"Failed to find documents: {str(error)}"
            }],
            'isError': True
        }

async def main():
    def get_mcp_config():
        try:
            # 首先尝试加载环境变量
            load_dotenv()
            
            # 优先使用环境变量
            connection_string = os.getenv('MONGODB_CONNECTION_STRING')
            database = os.getenv('MONGODB_DATABASE')
            
            if connection_string and database:
                return {
                    'connectionString': connection_string,
                    'database': database,
                    'collection': os.getenv('MONGODB_COLLECTION', 'mycollection'),
                    'query': json.loads(os.getenv('MONGODB_QUERY', '{}')),
                    'limit': int(os.getenv('MONGODB_LIMIT', '10'))
                }
            
            # 如果环境变量不存在，尝试读取配置文件
            config_path = Path('mcp.json')
            if not config_path.is_file():
                raise FileNotFoundError("Neither environment variables nor 'mcp.json' found.")
            
            with config_path.open('r') as file:
                config_data = json.load(file)
            
            return {
                'connectionString': config_data.get('connectionString', 'mongodb://localhost:27017'),
                'database': config_data.get('database', 'mydatabase'),
                'collection': config_data.get('collection', 'mycollection'),
                'query': config_data.get('query', {}),
                'limit': config_data.get('limit', 10)
            }
        except Exception as e:
            print(f"Error loading configuration: {e}")
            # 返回默认配置
            return {
                'connectionString': 'mongodb://localhost:27017',
                'database': 'mydatabase',
                'collection': 'mycollection',
                'query': {},
                'limit': 10
            }

    try:
        config = get_mcp_config()
        
        # 连接数据库
        connect_params = ConnectToMongoDBParams(**config)
        connection_result = await connect_to_mongodb(connect_params)
        print(connection_result)

        if not connection_result.get('isError'):
            # 只有在连接成功时才执行查询
            find_params = FindDocumentsParams(**config)
            query_result = await find_documents(find_params)
            print(query_result)
    except ValidationError as e:
        print('Validation error:', e.errors())
    except Exception as e:
        print('Unexpected error:', str(e))
    finally:
        # 关闭数据库连接
        if client:
            client.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
