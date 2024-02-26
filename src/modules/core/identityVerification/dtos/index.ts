import { IsString } from "class-validator";

export class BVNVerificationDto {
    @IsString()
    bvn: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;
}
