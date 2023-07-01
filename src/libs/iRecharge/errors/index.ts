import { IRechargeStatusCode } from "../interfaces";

export class IRechargeError extends Error {
    name: string = "IRechargeError";
    status: IRechargeStatusCode;
}
