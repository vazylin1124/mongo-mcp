interface MCPConfig {
    connectionString: string;
    database: string;
    collection?: string;
    query?: Record<string, any>;
    limit?: number;
}
interface SmitheryResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}
declare class MongoMCP {
    private client;
    private config;
    private configPath;
    constructor();
    private loadConfig;
    private saveConfig;
    connect(params: MCPConfig): Promise<SmitheryResponse>;
    find(params: MCPConfig): Promise<SmitheryResponse>;
    close(): Promise<void>;
}
export declare const mcp: MongoMCP;
export {};
