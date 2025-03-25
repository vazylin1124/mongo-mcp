from datetime import datetime
from urllib.parse import urlparse
from pydantic import BaseModel, ValidationError, Field
from typing import Optional, Dict, Any
import json

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
    """
    Connect to a MongoDB database using a connection string
    :param params: Parameters including connectionString and database
    :return: Connection status
    """
    try:
        # Simulate connection details
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
    """
    Find documents in a MongoDB collection based on a query
    :param params: Parameters including connectionString, database, collection, query, and limit
    :return: Query results
    """
    try:
        # Simulate the API call to a MongoDB service
        api_url = 'https://api.mongodb-service.example/query'
        query_params = {
            'connectionString': params.connectionString,
            'database': params.database,
            'collection': params.collection,
            'query': params.query,
            'limit': params.limit
        }

        # Simulated response
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
    # Example usage
    def get_mcp_config():
        # Simulate fetching configuration from MCP
        return {
            'connectionString': 'mongodb://localhost:27017',
            'database': 'mydatabase',
            'collection': 'mycollection',
            'query': {'name': 'Sample'},
            'limit': 5
        }

    config = get_mcp_config()

    try:
        # Connect to MongoDB
        connect_params = ConnectToMongoDBParams(**config)
        connection_result = await connect_to_mongodb(connect_params)
        print(connection_result)

        # Find documents
        find_params = FindDocumentsParams(**config)
        query_result = await find_documents(find_params)
        print(query_result)
    except ValidationError as e:
        print('Validation error:', e)

# Run the main function
import asyncio
asyncio.run(main())
