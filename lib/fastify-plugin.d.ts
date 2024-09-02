import { type FastifyPluginOptions, type FastifyRequest } from "fastify";
/**
 * Where you put this is important. Seems to work fine here.
 */
declare module "fastify" {
    interface FastifyInstance {
        rpcify: (prefix: string, methods: RPCMethods) => void;
    }
}
export type StructuredObject = {
    [key: string]: any;
} | any[];
type RPCMethods = Record<string, RPCMethod<any>>;
type Logger = FastifyRequest["log"];
export type RPCMethod<T extends StructuredObject, R = any> = ({ params, logger }: {
    params: T;
    logger: Logger;
}) => Promise<R> | R;
declare const fastifyPlugin: (fastify: any, _opts: FastifyPluginOptions, done: any) => void;
export { fastifyPlugin };
