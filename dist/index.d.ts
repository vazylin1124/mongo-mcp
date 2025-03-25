interface ConnectionConfig {
    mongoUri: string;
    mongoDatabase: string;
    mongoCollection?: string;
    mongoQuery?: Record<string, any>;
    mongoLimit?: number;
}
interface JsonRpcRequest {
    jsonrpc: string;
    id: number | string;
    method: string;
    params: any;
}
interface JsonRpcResponse {
    jsonrpc: string;
    id: number | string;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
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
    handleJsonRpcRequest(request: JsonRpcRequest): Promise<JsonRpcResponse>;
    getToolList(): any[];
}
export declare const mcp: MongoMCP;
export {};
