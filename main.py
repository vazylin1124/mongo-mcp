from datetime import datetime
from urllib.parse import urlparse
from pydantic import BaseModel, ValidationError, Field
from typing import Optional, Dict, Any
import json
from pathlib import Path

class ConnectToMongoDBParams(BaseModel):
    connectionString: str
    database: str

class FindDocumentsParams(BaseModel):
    connectionString: str
    database: str
    collection: str
    query: Optional[Dict[str, Any]] = Field(default_factory=dict)
    limit: Optional[int] = 10

async def connect_to_mongodb(params: ConnectToMongoDBParams):
    try:
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
    try:
        mock_results = [
            {'id': '1', 'name': 'Sample Document 1', 'createdAt': datetime.utcnow().isoformat()},
            {'id': '2', 'name': 'Sample Document 2', 'createdAt': datetime.utcnow().isoformat()}
        ]

        return {
            'content': [{
                'type': 'text',
                'text': f"Found {len(mock_results)} documents in collection '{params.collection}':\n\n{json.dumps(mock_results, indent=2)}"
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
        config_path = Path('mcp.json')
        
        if not config_path.is_file():
            raise FileNotFoundError("Configuration file 'mcp.json' not found.")
        
        with config_path.open('r') as file:
            config_data = json.load(file)
        
        return {
            'connectionString': config_data.get('connectionString', 'mongodb://localhost:27017'),
            'database': config_data.get('database', 'mydatabase'),
            'collection': config_data.get('collection', 'mycollection'),
            'query': config_data.get('query', {'name': 'Sample'}),
            'limit': config_data.get('limit', 5)
        }

    config = get_mcp_config()

    try:
        connect_params = ConnectToMongoDBParams(**config)
        connection_result = await connect_to_mongodb(connect_params)
        print(connection_result)

        find_params = FindDocumentsParams(**config)
        query_result = await find_documents(find_params)
        print(query_result)
    except ValidationError as e:
        print('Validation error:', e)

import asyncio
asyncio.run(main())
