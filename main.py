from datetime import datetime
from urllib.parse import urlparse
from pydantic import BaseModel, ValidationError, Field
from typing import Optional, Dict, Any, List
import json
from pathlib import Path
import motor.motor_asyncio
import os
from dotenv import load_dotenv

# Smithery MCP 配置
SMITHERY_CONFIG = {
    "name": "@vazylin1124/mongo-mcp",
    "version": "1.0.0",
    "type": "mcp",
    "client": "claude",
    "config": {
        "connectionString": "",
        "database": "",
        "collection": "",
        "query": {},
        "limit": 10
    }
}

class ConnectToMongoDBParams(BaseModel):
    connectionString: str
    database: str

class FindDocumentsParams(BaseModel):
    connectionString: str
    database: str
    collection: str
    query: Optional[Dict[str, Any]] = Field(default_factory=dict)
    limit: Optional[int] = 10

class SmitheryResponse(BaseModel):
    content: List[Dict[str, str]]
    isError: Optional[bool] = False
    config: Optional[Dict] = Field(default_factory=lambda: SMITHERY_CONFIG)

# 全局变量存储数据库连接
client = None
db = None

def save_smithery_config(config: Dict):
    """保存 Smithery 配置到文件"""
    config_dir = Path.home() / '.smithery' / 'mcp'
    config_dir.mkdir(parents=True, exist_ok=True)
    
    config_file = config_dir / 'mongo-mcp.json'
    with config_file.open('w') as f:
        json.dump(config, f, indent=2)

def load_smithery_config() -> Dict:
    """加载 Smithery 配置"""
    config_file = Path.home() / '.smithery' / 'mcp' / 'mongo-mcp.json'
    if config_file.exists():
        with config_file.open('r') as f:
            return json.load(f)
    return SMITHERY_CONFIG

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

        # 保存成功的配置
        config = load_smithery_config()
        config['config']['connectionString'] = params.connectionString
        config['config']['database'] = params.database
        save_smithery_config(config)

        return SmitheryResponse(
            content=[{
                'type': 'text',
                'text': f"Successfully connected to MongoDB database '{params.database}' at {connection_details['host']}"
            }]
        ).dict()
    except Exception as error:
        print('Error connecting to MongoDB:', error)
        return SmitheryResponse(
            content=[{
                'type': 'text',
                'text': f"Failed to connect to MongoDB: {str(error)}"
            }],
            isError=True
        ).dict()

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

        return SmitheryResponse(
            content=[{
                'type': 'text',
                'text': f"Found {len(results)} documents in collection '{params.collection}':\n\n{json.dumps(results, indent=2, default=str)}"
            }]
        ).dict()
    except Exception as error:
        print('Error finding documents:', error)
        return SmitheryResponse(
            content=[{
                'type': 'text',
                'text': f"Failed to find documents: {str(error)}"
            }],
            isError=True
        ).dict()

def get_mcp_config():
    try:
        # 首先尝试加载 Smithery 配置
        config = load_smithery_config()
        if config['config']['connectionString'] and config['config']['database']:
            return config['config']

        # 然后尝试加载环境变量
        load_dotenv()
        connection_string = os.getenv('MONGODB_CONNECTION_STRING')
        database = os.getenv('MONGODB_DATABASE')
        
        if connection_string and database:
            config = {
                'connectionString': connection_string,
                'database': database,
                'collection': os.getenv('MONGODB_COLLECTION', 'mycollection'),
                'query': json.loads(os.getenv('MONGODB_QUERY', '{}')),
                'limit': int(os.getenv('MONGODB_LIMIT', '10'))
            }
            # 保存到 Smithery 配置
            smithery_config = load_smithery_config()
            smithery_config['config'] = config
            save_smithery_config(smithery_config)
            return config
        
        raise FileNotFoundError("No connection configuration found. Please set MONGODB_CONNECTION_STRING and MONGODB_DATABASE environment variables.")
    except Exception as e:
        print(f"Error loading configuration: {e}")
        raise

async def main():
    try:
        config = get_mcp_config()
        
        # 连接数据库
        connect_params = ConnectToMongoDBParams(**config)
        connection_result = await connect_to_mongodb(connect_params)
        print(json.dumps(connection_result, indent=2))

        if not connection_result.get('isError'):
            # 只有在连接成功时才执行查询
            find_params = FindDocumentsParams(**config)
            query_result = await find_documents(find_params)
            print(json.dumps(query_result, indent=2))
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
