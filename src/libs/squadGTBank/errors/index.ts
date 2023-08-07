export class SquadGtBankError extends Error {
    name = "SquadGtBankError";
    status: number;
}

export class SquadGtBankVirtualAccountError extends SquadGtBankError {
    name = "SquadGtBankVirtualAccountError";
}
