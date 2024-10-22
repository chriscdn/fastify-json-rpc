import isobject from "isobject";
import isFunction from "is-function";
import fp from "fastify-plugin";
import {
  type FastifyPluginOptions,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import { CustomError, ErrorCodes } from "./fastify-plugin-errors";
import { JSONRPCRequest, JSONRPCResponse, JSONRPCResponseError } from "./types";

/**
 * Where you put this is important. Seems to work fine here.
 */
declare module "fastify" {
  interface FastifyInstance {
    rpcify: (prefix: string, methods: RPCMethods) => void;
  }
}

type TID = JSONRPCRequest["id"];
export type StructuredObject = { [key: string]: any } | any[];
type RPCMethods = Record<string, RPCMethod<any>>;
type Logger = FastifyRequest["log"];

export type RPCMethod<T extends StructuredObject, R = any> = (
  { params, logger }: { params: T; logger: Logger },
) => Promise<R> | R;

const isJSONRPCRequestObj = (item: unknown): item is JSONRPCRequest => {
  const testItem = item as JSONRPCRequest;
  return (testItem?.jsonrpc === "2.0" && Boolean(testItem?.method));
};

const successObject = <T>(id: TID, result: T): JSONRPCResponse<T> => {
  return {
    jsonrpc: "2.0",
    result,
    id,
  };
};

const errorObject = (
  id: TID,
  err: JSONRPCResponseError["error"] | CustomError,
) => {
  if (err instanceof CustomError) {
    // all good
  } else {
    const message = err.message;
    err = new CustomError(ErrorCodes.INTERNALERROR, { internal: message });
  }

  const error = {
    code: err.code,
    data: err.data ?? 1234,
    message: err.message,
  };

  // console.log(error);

  return {
    jsonrpc: "2.0",
    error,
    id,
  };
};

const processRequest = async (
  req: FastifyRequest,
  _res: FastifyReply,
  methods: RPCMethods,
  body: JSONRPCRequest,
) => {
  const jsonrpc = body.jsonrpc;
  const methodName = body.method;
  const id = body.id;

  const params = body.params;

  const method = methods[methodName];

  if (jsonrpc !== "2.0" || methodName == null) {
    return errorObject(id, ErrorCodes.INVALIDREQUEST);
  } else if (params && !(isobject(params) || Array.isArray(params))) {
    return errorObject(id, ErrorCodes.INVALIDREQUEST);
  } else if (isFunction(method)) {
    try {
      return successObject(
        id,
        await method.call(methods, { params, logger: req.log }),
      );
    } catch (err) {
      // keep this console.log for sanity sake
      console.log("***** RPC Method threw an exception.");
      console.log(err);
      console.log("*****");

      return errorObject(id, err);
    }
  } else {
    return errorObject(id, ErrorCodes.METHODNOTFOUND);
  }
};

// For whatever reason `fastify: FastifyInstance`, breaks here
const registerPlugin = (
  // fastify: FastifyInstance,
  fastify: any,
  _opts: FastifyPluginOptions,
  done,
) => {
  fastify.addSchema({
    $id: "json-rpc-request-body",
    type: "object",
    properties: {
      jsonrpc: {
        type: "string",
        enum: ["2.0"],
      },
      method: {
        type: "string",
      },
      params: {
        oneOf: [{ type: "object" }, { type: "array" }],
      },
      id: {
        anyOf: [{ type: "integer" }, { type: "string" }, { type: "null" }],
      },
    },
    required: ["jsonrpc", "method"],
  });

  fastify.addSchema({
    $id: "json-rpc-response",
    type: "object",
    properties: {
      jsonrpc: {
        type: "string",
        enum: ["2.0"],
      },
      result: {},
      error: {
        type: "object",
        properties: {
          code: {
            type: "number",
          },
          message: {
            type: "string",
          },
          data: {},
        },
        required: ["code"],
      },
      id: {
        anyOf: [{ type: "integer" }, { type: "string" }, { type: "null" }],
      },
    },
    oneOf: [
      { type: "object", required: ["jsonrpc", "id", "result"] },
      { type: "object", required: ["jsonrpc", "id", "error"] },
    ],
  });

  fastify.decorate("rpcify", (prefix: string, methods: RPCMethods) => {
    fastify.post(prefix, {
      schema: {
        description: "A JSON-RPC interface using POST.",
        params: {
          type: "object",
        },
        body: {
          oneOf: [
            {
              $ref: "json-rpc-request-body#",
            },
            {
              type: "array",
              items: {
                $ref: "json-rpc-request-body#",
              },
            },
          ],
        },
        response: {
          200: {
            oneOf: [
              {
                $ref: "json-rpc-response#",
              },
              {
                type: "array",
                items: {
                  $ref: "json-rpc-response#",
                },
              },
            ],
          },
        },
      },
      async handler(request, reply) {
        const body = request.body as JSONRPCRequest | JSONRPCRequest[];

        if (Array.isArray(body)) {
          return reply.send(
            await Promise.all(
              body.map((item) => processRequest(request, reply, methods, item)),
            ),
          );
        } else if (isJSONRPCRequestObj(body)) {
          return reply.send(
            await processRequest(request, reply, methods, body),
          );
        } else {
          return reply.send(errorObject(null, ErrorCodes.PARSEERROR));
        }
      },
    });
  });

  done();
};

const fastifyPlugin = fp(registerPlugin);

export { fastifyPlugin };
