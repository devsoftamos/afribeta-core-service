import { Injectable } from "@nestjs/common";
import { customAlphabet } from "nanoid";

@Injectable()
export class TransactionService {
    // constructor() {}

    generateId() {
        return customAlphabet("1234567890ABCDEFGH", 15)();
    }
}
