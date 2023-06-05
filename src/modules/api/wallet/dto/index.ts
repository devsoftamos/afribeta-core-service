import { IsBIC, IsNumberString, IsString, Length } from "class-validator";

export class InitiateWalletCreationDto {
    @IsNumberString()
    @Length(10, 10, { message: "Please input a valid Bank Account Number" })
    accountNumber: string;

    @IsNumberString()
    @Length(11, 11, {
        message: "Please input a valid Bank Verification Number",
    })
    bvn: string;

    @IsString()
    bankCode: string;
}
