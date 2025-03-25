interface MCPConfig {
    connectionString: string;
    database: string;
    collection?: string;
    query?: Record<string, any>;
    limit?: number;
}
interface MCPResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}
declare class MongoMCP {
    private static instance;
    private client;
    private isConnecting;
    private connectionPromise;
    private maxRetries;
    private retryDelay;
    private constructor();
    static getInstance(): MongoMCP;
    private delay;
    private getClient;
    connect(params: MCPConfig): Promise<MCPResponse>;
    find(params: MCPConfig): Promise<MCPResponse>;
    close(): Promise<void>;
}
export declare const mcp: MongoMCP;
export {};
