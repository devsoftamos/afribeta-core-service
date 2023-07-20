import { BillService, Prisma, User } from "@prisma/client";

const airtime = [
    {
        name: "MTN",
        slug: "mtn-airtime",
        type: "AIRTIME",
        icon: "https://example.com",
    },
    {
        name: "Glo",
        slug: "glo-airtime",
        type: "AIRTIME",
        icon: "https://example.com",
    },
    {
        name: "Etisalat",
        slug: "etisalat-airtime",
        type: "AIRTIME",
        icon: "https://example.com",
    },
    {
        name: "Airtel",
        slug: "airtel-airtime",
        type: "AIRTIME",
        icon: "https://example.com",
    },
];

const data = [
    {
        name: "MTN",
        slug: "mtn-data",
        type: "DATA",
        icon: "https://example.com",
    },
    {
        name: "Glo",
        slug: "glo-data",
        type: "DATA",
        icon: "https://example.com",
    },
    {
        name: "Etisalat",
        slug: "etisalat-data",
        type: "DATA",
        icon: "https://example.com",
    },
    {
        name: "Airtel",
        slug: "airtel-data",
        type: "DATA",
        icon: "https://example.com",
    },
    {
        name: "Smile",
        slug: "smile-data",
        type: "DATA",
        icon: "https://example.com",
    },
    {
        name: "Spectranet",
        slug: "spectranet-data",
        type: "DATA",
        icon: "https://example.com",
    },
];

const cableTv = [
    {
        name: "DSTV",
        slug: "dstv",
        type: "CABLE_TV",
        icon: "https://example.com",
    },
    {
        name: "GOTV",
        slug: "gotv",
        type: "CABLE_TV",
        icon: "https://example.com",
    },
    {
        name: "Startimes",
        slug: "startimes",
        type: "CABLE_TV",
        icon: "https://example.com",
    },
];

const electricity = [
    {
        name: "Ikeja Electric",
        slug: "ikeja-electric",
        abbrev: "IKEDC",
        type: "ELECTRICITY",
        icon: "https://example.com",
    },
    {
        name: "Eko Electricity",
        slug: "eko-electricity",
        abbrev: "EKEDC",
        type: "ELECTRICITY",
        icon: "https://example.com",
    },
    {
        name: "Kano Electricity",
        slug: "kano-electricity",
        abbrev: "KEDCO",
        type: "ELECTRICITY",
        icon: "https://example.com",
    },
    {
        name: "Port Harcourt Electric",
        slug: "port-harcourt-electric",
        abbrev: "PHED",
        type: "ELECTRICITY",
        icon: "https://example.com",
    },
    {
        name: "Jos Electricity",
        slug: "jos-electricity",
        abbrev: "JED",
        type: "ELECTRICITY",
        icon: "https://example.com",
    },
    {
        name: "Ibadan Electricity",
        slug: "ibadan-electricity",
        abbrev: "IBEDC",
        type: "ELECTRICITY",
        icon: "https://example.com",
    },
    {
        name: "Kaduna Electric",
        slug: "kaduna-electric",
        abbrev: "KAEDCO",
        type: "ELECTRICITY",
        icon: "https://example.com",
    },
    {
        name: "Abuja Electric ",
        slug: "abuja-electric",
        abbrev: "AEDC",
        type: "ELECTRICITY",
        icon: "https://example.com",
    },
    {
        name: "Enugu Electric",
        slug: "enugu-electric",
        abbrev: "EEDC",
        type: "ELECTRICITY",
        icon: "https://example.com",
    },
    {
        name: "Benin Electric ",
        slug: "benin-electric",
        abbrev: "BEDC",
        type: "ELECTRICITY",
        icon: "https://example.com",
    },
    {
        name: "Aba Power",
        slug: "aba-power",
        abbrev: "AP",
        type: "ELECTRICITY",
        icon: "https://example.com",
    },
];

export const billServiceData = [
    ...airtime,
    ...data,
    ...cableTv,
    ...electricity,
];
