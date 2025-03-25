interface MongoConfig {
    connectionString: string;
    database: string;
    collection?: string;
    query?: Record<string, any>;
    limit?: number;
}
declare class MongoMCP {
    private static instance;
    private client;
    private db;
    private isConnecting;
    private connectionPromise;
    private maxRetries;
    private retryDelay;
    private constructor();
    static getInstance(): MongoMCP;
    private delay;
    private getClient;
    connect(config: MongoConfig): Promise<{
        success: boolean;
        message: string;
    }>;
    find(config: MongoConfig): Promise<any[]>;
    close(): Promise<void>;
}
export declare const mcp: MongoMCP;
export {};
