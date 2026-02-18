import { FastifyPluginOptions, FastifyRequest } from 'fastify';

declare const fastifyPlugin: (fastify: any, _opts: FastifyPluginOptions) => Promise<void>;

/**
 * Where you put this is important. Seems to work fine here.
 */
declare module "fastify" {
    interface FastifyInstance {
        rpcify: (prefix: string, methods: RPCMethods) => void;
    }
}
type JSONRPCRequest = {
    jsonrpc: "2.0";
    method: string;
    params?: Record<string, any>;
    id?: string | number | null;
};
type JSONRPCResponseSuccess<T> = {
    jsonrpc: "2.0";
    result: T;
    id?: string | number | null;
};
type JSONRPCResponseError = {
    jsonrpc: "2.0";
    error: {
        code: number;
        message: string;
        data?: any;
    };
    id?: string | number | null;
};
type ErrorObj = JSONRPCResponseError["error"];
type JSONRPCResponse<T> = JSONRPCResponseSuccess<T> | JSONRPCResponseError;
type RPCMethod<T extends StructuredObject, R = any> = ({ params, logger }: {
    params: T;
    logger: Logger;
}) => Promise<R> | R;
type TID = JSONRPCRequest["id"];
type RPCMethods = Record<string, RPCMethod<any>>;
type Logger = FastifyRequest["log"];
type StructuredObject = {
    [key: string]: any;
} | any[];

declare const ErrorCodes: Record<string, ErrorObj>;
declare class CustomError extends Error {
    code: ErrorObj["code"];
    data: ErrorObj["data"] | null;
    constructor(message?: string | ErrorObj, data?: ErrorObj["data"], code?: ErrorObj["code"]);
}

export { CustomError, ErrorCodes, type ErrorObj, type JSONRPCRequest, type JSONRPCResponse, type JSONRPCResponseError, type JSONRPCResponseSuccess, type Logger, type RPCMethod, type RPCMethods, type StructuredObject, type TID, fastifyPlugin };
