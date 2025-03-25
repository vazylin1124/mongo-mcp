interface ConnectionConfig {
    uri: string;
    database: string;
    collection?: string;
    query?: Record<string, any>;
    limit?: number;
}
declare class MongoMCP {
    private client;
    private db;
    connect(config: ConnectionConfig): Promise<{
        success: boolean;
        message: string;
    }>;
    find(config: ConnectionConfig): Promise<any[]>;
    close(): Promise<void>;
}
export declare const mcp: MongoMCP;
export {};
