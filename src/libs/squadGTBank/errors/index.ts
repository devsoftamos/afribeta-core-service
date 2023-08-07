export class SquadGtBankError extends Error {
    name: string = "SquadGtBankError";
    status: number;
}

export class SquadGtBankVirtualAccountError extends SquadGtBankError {
    name: string = "SquadGtBankVirtualAccountError";
}
