// src/fastify-plugin.ts
import fp from "fastify-plugin";

// src/fastify-plugin-errors.ts
var ErrorCodes = {
  PARSEERROR: {
    code: -32700,
    message: "Parse error"
  },
  INVALIDREQUEST: {
    code: -32600,
    message: "Invalid Request"
  },
  METHODNOTFOUND: {
    code: -32601,
    message: "Method not found"
  },
  INVALIDPARAMS: {
    code: -32602,
    message: "Invalid params"
  },
  INTERNALERROR: {
    code: -32603,
    message: "Internal error"
  }
};
var isErrorObj = (item) => typeof item !== "string";
var CustomError = class extends Error {
  code;
  data;
  constructor(message = ErrorCodes.INTERNALERROR.message, data = null, code = ErrorCodes.INTERNALERROR.code) {
    if (isErrorObj(message)) {
      super(message.message);
      this.code = message.code;
      this.data = message.data;
    } else {
      super(message);
      this.code = code;
      this.data = data;
    }
  }
};

// src/utils.ts
var isObject = (val) => val != null && typeof val === "object" && Array.isArray(val) === false;
var isFunction = (value) => typeof value === "function";

// src/fastify-plugin.ts
var isJSONRPCRequestObj = (item) => {
  const testItem = item;
  return testItem?.jsonrpc === "2.0" && Boolean(testItem?.method);
};
var successObject = (id, result) => {
  return {
    jsonrpc: "2.0",
    result,
    id
  };
};
var errorObject = (id, err) => {
  if (err instanceof CustomError) {
  } else {
    const message = err.message;
    err = new CustomError(ErrorCodes.INTERNALERROR, { internal: message });
  }
  const error = {
    code: err.code,
    data: err.data ?? 1234,
    message: err.message
  };
  return {
    jsonrpc: "2.0",
    error,
    id
  };
};
var processRequest = async (req, _res, methods, body) => {
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
        await method.call(methods, { params, logger: req.log })
      );
    } catch (err) {
      console.log("***** RPC Method threw an exception.");
      console.log(err);
      console.log("*****");
      return errorObject(id, err);
    }
  } else {
    return errorObject(id, ErrorCodes.METHODNOTFOUND);
  }
};
var registerPlugin = async (fastify, _opts) => {
  fastify.addSchema({
    $id: "json-rpc-request-body",
    type: "object",
    properties: {
      jsonrpc: {
        type: "string",
        enum: ["2.0"]
      },
      method: {
        type: "string"
      },
      params: {
        oneOf: [{ type: "object" }, { type: "array" }]
      },
      id: {
        anyOf: [{ type: "integer" }, { type: "string" }, { type: "null" }]
      }
    },
    required: ["jsonrpc", "method"]
  });
  fastify.addSchema({
    $id: "json-rpc-response",
    type: "object",
    properties: {
      jsonrpc: {
        type: "string",
        enum: ["2.0"]
      },
      result: {},
      error: {
        type: "object",
        properties: {
          code: {
            type: "number"
          },
          message: {
            type: "string"
          },
          data: {}
        },
        required: ["code"]
      },
      id: {
        anyOf: [{ type: "integer" }, { type: "string" }, { type: "null" }]
      }
    },
    oneOf: [
      { type: "object", required: ["jsonrpc", "id", "result"] },
      { type: "object", required: ["jsonrpc", "id", "error"] }
    ]
  });
  fastify.decorate("rpcify", (prefix, methods) => {
    fastify.post(prefix, {
      schema: {
        description: "A JSON-RPC interface using POST.",
        params: {
          type: "object"
        },
        body: {
          oneOf: [
            {
              $ref: "json-rpc-request-body#"
            },
            {
              type: "array",
              items: {
                $ref: "json-rpc-request-body#"
              }
            }
          ]
        },
        response: {
          200: {
            oneOf: [
              {
                $ref: "json-rpc-response#"
              },
              {
                type: "array",
                items: {
                  $ref: "json-rpc-response#"
                }
              }
            ]
          }
        }
      },
      async handler(request, reply) {
        const body = request.body;
        if (Array.isArray(body)) {
          return reply.send(
            await Promise.all(
              body.map((item) => processRequest(request, reply, methods, item))
            )
          );
        } else if (isJSONRPCRequestObj(body)) {
          return reply.send(
            await processRequest(request, reply, methods, body)
          );
        } else {
          return reply.send(errorObject(null, ErrorCodes.PARSEERROR));
        }
      }
    });
  });
};
var fastifyPlugin = fp(registerPlugin);
export {
  CustomError,
  ErrorCodes,
  fastifyPlugin
};
