import { FastifyRequest } from "fastify";

/**
 * Where you put this is important. Seems to work fine here.
 */
declare module "fastify" {
    interface FastifyInstance {
        rpcify: (prefix: string, methods: RPCMethods) => void;
    }
}

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

export type RPCMethod<T extends StructuredObject, R = any> = (
    { params, logger }: { params: T; logger: Logger },
) => Promise<R> | R;

export type TID = JSONRPCRequest["id"];
export type RPCMethods = Record<string, RPCMethod<any>>;
export type Logger = FastifyRequest["log"];

export type StructuredObject = { [key: string]: any } | any[];
