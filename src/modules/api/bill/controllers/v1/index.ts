import { AuthGuard } from "@/modules/api/auth/guard";
import { Controller, UseGuards } from "@nestjs/common";

@UseGuards(AuthGuard)
@Controller({
    path: "bill",
})
export class BillController {}
