export class FSDH360BankError extends Error {
    name = "FSDH360BankError";
    status: number;
}

export class FSDH360BankAuthenticationError extends FSDH360BankError {
    name = "FSDH360BankAuthenticationError";
}

export class FSDH360BankStaticVirtualAccountError extends FSDH360BankError {
    name = "FSDH360BankStaticVirtualAccountError";
}

export class FSDH360BankVerifyBvnError extends FSDH360BankError {
    name = "FSDH360BankVerifyBvnError";
}
