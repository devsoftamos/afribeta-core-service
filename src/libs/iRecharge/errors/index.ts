import { IRechargeStatusCode } from "../interfaces";

export class IRechargeError extends Error {
    name = "IRechargeError";
    status: IRechargeStatusCode;
}
