import { HttpException } from "@nestjs/common";

export class BillCommissionException extends HttpException {
    name: string = "BillCommissionException";
}
