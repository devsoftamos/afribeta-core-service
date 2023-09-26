import { generateId } from "@/utils";
import { roles } from "../role";
import { UserType } from "@prisma/client";
import { rolePermissions } from "../rolePermission";
import * as bcrypt from "bcryptjs"
import { customAlphabet, urlAlphabet } from "nanoid";


const hashPassword = bcrypt.hashSync("pass1234", 10)


export const userAdmin = {
    email: "test@email.com",
    phone: "09000987654",
    password: hashPassword,
    identifier: customAlphabet(urlAlphabet, 16)(),
    userType: UserType.SUPER_ADMIN,
    roleId: 2
};

