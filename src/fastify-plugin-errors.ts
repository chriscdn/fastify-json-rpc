import { ErrorObj } from "./types.js";

const ErrorCodes: Record<string, ErrorObj> = {
  PARSEERROR: {
    code: -32700,
    message: "Parse error",
  },
  INVALIDREQUEST: {
    code: -32600,
    message: "Invalid Request",
  },
  METHODNOTFOUND: {
    code: -32601,
    message: "Method not found",
  },
  INVALIDPARAMS: {
    code: -32602,
    message: "Invalid params",
  },
  INTERNALERROR: {
    code: -32603,
    message: "Internal error",
  },
};

// -32000 to -32099 is reserved!

const isErrorObj = (item: string | ErrorObj): item is ErrorObj =>
  typeof item !== "string";

class CustomError extends Error {
  public code: ErrorObj["code"];
  public data: ErrorObj["data"] | null;

  constructor(
    message: string | ErrorObj = ErrorCodes.INTERNALERROR.message,
    data: ErrorObj["data"] = null,
    code: ErrorObj["code"] = ErrorCodes.INTERNALERROR.code,
  ) {
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
}

export { CustomError, ErrorCodes };
