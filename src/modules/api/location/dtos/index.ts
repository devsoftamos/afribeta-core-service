import { IsNumberString } from "class-validator";

export class GetLgasByStateDto {
    @IsNumberString()
    id: string;
}
