import { IsString } from "class-validator";

export class GetUserByIdentifierDto {
    @IsString()
    id: string;
}
