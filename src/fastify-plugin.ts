// import isFunction from "is-function";
import fp from "fastify-plugin";
import type {
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { CustomError, ErrorCodes } from "./fastify-plugin-errors.js";
import type {
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCResponseError,
  RPCMethods,
  TID,
} from "./types.js";
import { isFunction, isObject } from "./utils.js";

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
  } else if (params && !(isObject(params) || Array.isArray(params))) {
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

      // This err handling should be better.
      return errorObject(id, err as any);
    }
  } else {
    return errorObject(id, ErrorCodes.METHODNOTFOUND);
  }
};

// For whatever reason `fastify: FastifyInstance`, breaks here
const registerPlugin = async (
  // fastify: FastifyInstance,
  fastify: any,
  _opts: FastifyPluginOptions,
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
      async handler(request: FastifyRequest, reply: FastifyReply) {
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

  // done();
};

const fastifyPlugin = fp(registerPlugin);

export { fastifyPlugin };
