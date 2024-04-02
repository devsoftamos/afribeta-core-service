import { User } from "@prisma/client";
import { BillServiceCommissionOptions } from "../dtos";

export interface CreateUser {
    firstName: string;
}

export interface ValidateAgentCommissionAssignmentOptions {
    merchantId: number;
    billServiceCommissions: BillServiceCommissionOptions[];
}

export interface AgentCreationEventOptions {
    user: User;
}
export interface UserEventMap {
    "agent-creation": AgentCreationEventOptions;
}

export interface AgentPostAccountCreateEmailParams {
    firstName: string;
    email: string;
    password: string;
}

export enum BillServiceSlug {
    MTN_AIRTIME = "mtn-airtime",
    GLO_AIRTIME = "glo-airtime",
    ETISALAT_AIRTIME = "etisalat-airtime",
    AIRTEL_AIRTIME = "airtel-airtime",
    MTN_DATA = "mtn-data",
    GLO_DATA = "glo-data",
    ETISALAT_DATA = "etisalat-data",
    AIRTEL_DATA = "airtel-data",
    DSTV = "dstv",
    GOTV = "gotv",
    STARTIMES = "startimes",
    IKEJA_ELECTRIC = "ikeja-electric",
    EKO_ELECTRICITY = "eko-electricity",
    KANO_ELECTRICITY = "kano-electricity",
    PORT_HARCOURT_ELECTRIC = "port-harcourt-electric",
    JOS_ELECTRICITY = "jos-electricity",
    IBADAN_ELECTRICITY = "ibadan-electricity",
    KADUNA_ELECTRIC = "kaduna-electric",
    ABUJA_ELECTRIC = "abuja-electric",
    ENUGU_ELECTRIC = "enugu-electric",
    BENIN_ELECTRIC = "benin-electric",
    ABA_POWER = "aba-power",
    MTN_INTERNET = "mtn-internet",
    GLO_INTERNET = "glo-internet",
    ETISALAT_INTERNET = "etisalat-internet",
    AIRTEL_INTERNET = "airtel-internet",
    SMILE = "smile-internet",
    SPECTRANET = "spectranet-internet",
}

export interface ClientDataInterface {
    ipAddress: string;
}
