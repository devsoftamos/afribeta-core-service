export class FSDH360BankError extends Error {
    name: string = "FSDH360BankError";
    status: number;
}

export class FSDH360BankAuthenticationError extends FSDH360BankError {
    name: string = "FSDH360BankAuthenticationError";
}

export class FSDH360BankStaticVirtualAccountError extends FSDH360BankError {
    name: string = "FSDH360BankStaticVirtualAccountError";
}
