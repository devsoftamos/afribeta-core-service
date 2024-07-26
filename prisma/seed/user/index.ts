import { generateId } from "../../../src/utils";
import { UserType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const hashPassword = bcrypt.hashSync("superadmin1", 10);

export const userAdmin = {
    email: "superadmin@afribeta.com",
    phone: "09000987654",
    firstName: "admin",
    lastName: "admin",
    password: hashPassword,
    identifier: generateId({ type: "identifier" }),
    userType: UserType.SUPER_ADMIN,
    roleId: 5,
};
