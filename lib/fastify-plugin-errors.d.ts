import { ErrorObj } from "./types";
declare const ErrorCodes: Record<string, ErrorObj>;
declare class CustomError extends Error {
    code: ErrorObj["code"];
    data: ErrorObj["data"] | null;
    constructor(message?: string | ErrorObj, data?: ErrorObj["data"], code?: ErrorObj["code"]);
}
export { CustomError, ErrorCodes };
