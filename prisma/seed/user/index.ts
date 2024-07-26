import { UserType } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { customAlphabet, urlAlphabet } from "nanoid";

const hashPassword = bcrypt.hashSync("xxx@gmail.com", 10);
const identifier = customAlphabet(urlAlphabet, 16)();

export const userAdmin = {
    email: "xxx@gmail.com",
    phone: "08081144473",
    firstName: "Maryam",
    lastName: "Hassan-Mohammed",
    password: hashPassword,
    identifier: identifier,
    userType: UserType.SUPER_ADMIN,
    roleId: 5,
};
