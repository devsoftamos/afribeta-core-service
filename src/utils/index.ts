import { customAlphabet, urlAlphabet } from "nanoid";
import { TransactionIdOption } from "./interfaces";
import { AES } from "crypto-js";
import { DEFAULT_CAPPING_MULTIPLIER, encryptSecret } from "@/config";
import slugify from "slugify";

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
        case "walletNumber": {
            return customAlphabet(alphaNumeric, 10)();
        }

        default:
            break;
    }
};

export const formatName = (name: string) => {
    const formatted = name.trim().toLowerCase();
    return `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
};

export const encrypt = (data: any) => {
    return AES.encrypt(JSON.stringify(data), encryptSecret).toString();
};

export const computeCap = (commission: number) => {
    return commission * DEFAULT_CAPPING_MULTIPLIER;
};

export const generateSlug = (input: string) => {
    const options = {
        strict: true,
        lower: true,
    };
    return slugify(input, options);
};

export function groupBy<TData extends Record<string, any>>(
    key: string,
    data: TData[]
): TData[][] {
    const list = data.reduce((hash, obj) => {
        hash[obj[key]] = (hash[obj[key]] || []).concat(obj);
        return hash;
    }, {});

    return Object.values(list);
}
