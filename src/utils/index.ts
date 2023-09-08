import { customAlphabet, urlAlphabet } from "nanoid";
import { TransactionIdOption } from "./interfaces";
import { AES } from "crypto-js";
import { encryptSecret } from "@/config";

export * from "./api-response-util";
export * from "./interfaces";

export const generateId = (options: TransactionIdOption): string => {
    const alphaNumeric = "1234567890ABCDEFGH";
    const numeric = "0123456789";
    const length = options.length ?? 15;

    switch (options.type) {
        case "reference": {
            return customAlphabet(alphaNumeric.toLowerCase(), 30)();
        }
        case "transaction": {
            return customAlphabet(alphaNumeric, 15)();
        }
        case "custom_lower_case": {
            return customAlphabet(alphaNumeric.toLowerCase(), length)();
        }
        case "custom_upper_case": {
            return customAlphabet(alphaNumeric, length)();
        }

        case "numeric": {
            return customAlphabet(numeric, length)();
        }
        case "identifier": {
            return customAlphabet(urlAlphabet, 16)();
        }
        case "irecharge_ref": {
            return customAlphabet(numeric, 12)();
        }

        default:
            break;
    }
};

export const formatName = (name: string) => {
    const formatted = name.trim();
    return `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
};

export const encrypt = (data: any) => {
    return AES.encrypt(JSON.stringify(data), encryptSecret).toString();
};
