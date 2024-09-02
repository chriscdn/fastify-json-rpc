export type JSONRPCRequest = {
    jsonrpc: "2.0";
    method: string;
    params?: Record<string, any>;
    id?: string | number | null;
};

export type JSONRPCResponseSuccess<T> = {
    jsonrpc: "2.0";
    result: T;
    id?: string | number | null;
};

export type JSONRPCResponseError = {
    jsonrpc: "2.0";
    error: {
        code: number;
        message: string;
        data?: any;
    };
    id?: string | number | null;
};

export type ErrorObj = JSONRPCResponseError["error"];

export type JSONRPCResponse<T> =
    | JSONRPCResponseSuccess<T>
    | JSONRPCResponseError;
