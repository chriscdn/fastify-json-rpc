const isobject = require('isobject')
const isFunction = require('is-function')
const fp = require('fastify-plugin')

const { CustomError, ErrorCodes } = require('../error')

function successObject(id, result) {
  return {
    jsonrpc: '2.0',
    result,
    id,
    // ...(id && {
    //   id,
    // }),
  }
}

function errorObject(id, err) {
  if (err instanceof CustomError) {
    // all good
  } else {
    const message = err.message
    err = new CustomError(ErrorCodes.INTERNALERROR)
    err.data = { internal: message }
  }

  return {
    jsonrpc: '2.0',
    error: {
      code: err.code,
      data: err.data,
      message: err.message,
    },
    id,
    // ...(id && {
    //   id,
    // }),
  }
}

const processRequest = async (req, res, methods, body) => {
  const jsonrpc = body.jsonrpc
  const methodName = body.method
  const id = body.id

  const params = body.params

  const method = methods[methodName]

  if (jsonrpc != '2.0' || methodName == null) {
    return errorObject(id, ErrorCodes.INVALIDREQUEST)
  } else if (params && !(isobject(params) || Array.isArray(params))) {
    return errorObject(id, ErrorCodes.INVALIDREQUEST)
  } else if (isFunction(method)) {
    try {
      return successObject(id, await method.call(methods, params, req, res))
    } catch (err) {
      // keep this console.log for sanity sake
      console.log(err)
      return errorObject(id, err)
    }
  } else {
    return errorObject(id, ErrorCodes.METHODNOTFOUND)
  }
}

function registerPlugin(fastify, opts, done) {
  fastify.addSchema({
    $id: 'json-rpc-request-body',
    type: 'object',
    properties: {
      jsonrpc: {
        type: 'string',
        enum: ['2.0'],
      },
      method: {
        type: 'string',
      },
      params: {
        oneOf: [{ type: 'object' }, { type: 'array' }],
        default: {},
      },
      id: {
        anyOf: [{ type: 'integer' }, { type: 'string' }, { type: 'null' }],
      },
    },
    required: ['jsonrpc', 'method'],
  })

  fastify.addSchema({
    $id: 'json-rpc-response',
    type: 'object',
    properties: {
      jsonrpc: {
        type: 'string',
        enum: ['2.0'],
      },
      result: {
        type: 'string',
      },
      error: {
        type: 'object',
      },
      id: {
        anyOf: [{ type: 'integer' }, { type: 'string' }, { type: 'null' }],
      },
    },
    required: ['jsonrpc', 'id'],
    oneOf: [{ required: ['result'] }, { required: ['error'] }],
  })

  fastify.decorate('rpcify', (prefix, methods) => {
    fastify.post(prefix, {
      schema: {
        description: 'A JSON-RPC interface using POST.',
        body: {
          oneOf: [
            {
              $ref: 'json-rpc-request-body',
            },
            {
              type: 'array',
              items: { $ref: 'json-rpc-request-body' },
            },
          ],
        },
        response: {
          200: {
            oneOf: [
              {
                $ref: 'json-rpc-response',
              },
              {
                type: 'array',
                items: { $ref: 'json-rpc-response' },
              },
            ],
          },
        },
      },
      async handler(request, reply) {
        const body = request.body

        if (Array.isArray(body)) {
          return reply.send(
            await Promise.all(
              body.map((item) => processRequest(request, reply, methods, item))
            )
          )
        } else if (isobject(body)) {
          return reply.send(await processRequest(request, reply, methods, body))
        } else {
          return reply.send(errorObject(null, ErrorCodes.PARSEERROR))
        }
      },
    })
  })

  done()
}

module.exports = fp(registerPlugin)
