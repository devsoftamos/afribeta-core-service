import { Prisma } from "@prisma/client";

const airtime: Prisma.BillServiceUncheckedCreateInput[] = [
    {
        name: "MTN Airtime",
        slug: "mtn-airtime",
        type: "AIRTIME",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/MTN.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Glo Airtime",
        slug: "glo-airtime",
        type: "AIRTIME",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/Glo.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "9 Mobile Airtime",
        slug: "etisalat-airtime",
        type: "AIRTIME",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/9mobile.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Airtel Airtime",
        slug: "airtel-airtime",
        type: "AIRTIME",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/airtel.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
];

const data: Prisma.BillServiceUncheckedCreateInput[] = [
    {
        name: "MTN Data",
        slug: "mtn-data",
        type: "DATA",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/MTN.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Glo Data",
        slug: "glo-data",
        type: "DATA",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/Glo.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "9 Mobile Data",
        slug: "etisalat-data",
        type: "DATA",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/9mobile.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Airtel Data",
        slug: "airtel-data",
        type: "DATA",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/airtel.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
];

const cableTv: Prisma.BillServiceUncheckedCreateInput[] = [
    {
        name: "DSTV",
        slug: "dstv",
        type: "CABLE_TV",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/dstv.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "GOTV",
        slug: "gotv",
        type: "CABLE_TV",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/GOTV.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Startimes",
        slug: "startimes",
        type: "CABLE_TV",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/startimes.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
];

const electricity: Prisma.BillServiceUncheckedCreateInput[] = [
    {
        name: "Ikeja Electric",
        slug: "ikeja-electric",
        abbrev: "IKEDC",
        type: "ELECTRICITY",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/ikedc.png",
        agentDefaultCommissionPercent: 1.6,
    },
    {
        name: "Eko Electricity",
        slug: "eko-electricity",
        abbrev: "EKEDC",
        type: "ELECTRICITY",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/EKEDC.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Kano Electricity",
        slug: "kano-electricity",
        abbrev: "KEDCO",
        type: "ELECTRICITY",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/KEDCO.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Port Harcourt Electric",
        slug: "port-harcourt-electric",
        abbrev: "PHED",
        type: "ELECTRICITY",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/ph.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Jos Electricity",
        slug: "jos-electricity",
        abbrev: "JEDC",
        type: "ELECTRICITY",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/JEDC.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Ibadan Electricity",
        slug: "ibadan-electricity",
        abbrev: "IBEDC",
        type: "ELECTRICITY",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/IBEDC.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Kaduna Electric",
        slug: "kaduna-electric",
        abbrev: "KAEDCO",
        type: "ELECTRICITY",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/kaduna.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Abuja Electric ",
        slug: "abuja-electric",
        abbrev: "AEDC",
        type: "ELECTRICITY",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/AEDC.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Enugu Electric",
        slug: "enugu-electric",
        abbrev: "EEDC",
        type: "ELECTRICITY",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/EEDS.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Benin Electric ",
        slug: "benin-electric",
        abbrev: "BEDC",
        type: "ELECTRICITY",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/BEDC.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Aba Power",
        slug: "aba-power",
        abbrev: "AP",
        type: "ELECTRICITY",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/aba.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
];

const internet: Prisma.BillServiceUncheckedCreateInput[] = [
    {
        name: "MTN Internet",
        slug: "mtn-internet",
        type: "INTERNET",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/MTN.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Glo Internet",
        slug: "glo-internet",
        type: "INTERNET",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/Glo.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "9 Mobile Internet",
        slug: "etisalat-internet",
        type: "INTERNET",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/etisalat.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Airtel Internet",
        slug: "airtel-internet",
        type: "INTERNET",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/airtel.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Smile",
        slug: "smile-internet",
        type: "INTERNET",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/Smile.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
    {
        name: "Spectranet",
        slug: "spectranet-internet",
        type: "INTERNET",
        icon: "https://afribeta.nyc3.digitaloceanspaces.com/icons/Spectranet.png",
        baseCommissionPercentage: 2,
        agentDefaultCommissionPercent: 1.5,
    },
];

export const billServiceData = [
    ...airtime,
    ...data,
    ...cableTv,
    ...electricity,
    ...internet,
];
