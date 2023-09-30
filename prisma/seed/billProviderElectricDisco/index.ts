const iRecharge = [
    {
        billProviderSlug: "irecharge",
        billServiceSlug: "eko-electricity",
        prepaidMeterCode: "Eko_Prepaid",
        postpaidMeterCode: "Eko_Postpaid", //Eko
    },
    {
        billProviderSlug: "irecharge",
        billServiceSlug: "ibadan-electricity",
        prepaidMeterCode: "Ibadan_Disco_Prepaid",
        postpaidMeterCode: "Ibadan_Disco_Postpaid", //Ibadan
    },
    {
        billProviderSlug: "irecharge",
        billServiceSlug: "kano-electricity",
        prepaidMeterCode: "Kano_Electricity_Disco",
        postpaidMeterCode: "Kano_Electricity_Disco_Postpaid", //Kano
    },
    {
        billProviderSlug: "irecharge",
        billServiceSlug: "port-harcourt-electric",
        prepaidMeterCode: "PhED_Electricity",
        postpaidMeterCode: "PH_Disco", //Port Harcourt
    },
    {
        billProviderSlug: "irecharge",
        billServiceSlug: "jos-electricity",
        prepaidMeterCode: "Jos_Disco",
        postpaidMeterCode: "Jos_Disco_Postpaid", //Jos
    },
    {
        billProviderSlug: "irecharge",
        billServiceSlug: "kaduna-electric",
        prepaidMeterCode: "Kaduna_Electricity_Disco",
        postpaidMeterCode: "Kaduna_Electricity_Disco_Postpaid", //Kaduna
    },
    {
        billProviderSlug: "irecharge",
        billServiceSlug: "abuja-electric",
        prepaidMeterCode: "AEDC",
        postpaidMeterCode: "AEDC_Postpaid", //Abuja
    },
    {
        billProviderSlug: "irecharge",
        billServiceSlug: "enugu-electric",
        prepaidMeterCode: "Enugu_Electricity_Distribution_Prepaid",
        postpaidMeterCode: "Enugu_Electricity_Distribution_Postpaid", //Enugu
    },
    {
        billProviderSlug: "irecharge",
        billServiceSlug: "benin-electric",
        prepaidMeterCode: "BEDC",
        postpaidMeterCode: "BEDC_Postpaid", //Benin
    },
    {
        billProviderSlug: "irecharge",
        billServiceSlug: "aba-power",
        prepaidMeterCode: "Aba_Power_Prepaid",
        postpaidMeterCode: "Aba_Power_Postpaid", //Aba
    },
];

const buyPower = [
    {
        billProviderSlug: "buypower",
        billServiceSlug: "abuja-electric",
        prepaidMeterCode: "ABUJA",
        postpaidMeterCode: "ABUJA", //Abuja
    },
    {
        billProviderSlug: "buypower",
        billServiceSlug: "eko-electricity",
        prepaidMeterCode: "EKO",
        postpaidMeterCode: "EKO", //Eko
    },
    {
        billProviderSlug: "buypower",
        billServiceSlug: "ibadan-electricity",
        prepaidMeterCode: "IBADAN",
        postpaidMeterCode: "IBADAN", //Ibadan
    },
    {
        billProviderSlug: "buypower",
        billServiceSlug: "enugu-electric",
        prepaidMeterCode: "ENUGU",
        postpaidMeterCode: "ENUGU", //Abuja
    },
    {
        billProviderSlug: "buypower",
        billServiceSlug: "port-harcourt-electric",
        prepaidMeterCode: "PH",
        postpaidMeterCode: "PH", //port harcourt
    },
    {
        billProviderSlug: "buypower",
        billServiceSlug: "jos-electricity",
        prepaidMeterCode: "JOS",
        postpaidMeterCode: "JOS", //Jos
    },
    {
        billProviderSlug: "buypower",
        billServiceSlug: "kaduna-electric",
        prepaidMeterCode: "KADUNA",
        postpaidMeterCode: "KADUNA", //Kaduna
    },
    {
        billProviderSlug: "buypower",
        billServiceSlug: "kano-electricity",
        prepaidMeterCode: "KANO",
        postpaidMeterCode: "KANO", //Jos
    },
];

export const billProviderElectricDiscos = [...iRecharge, ...buyPower];
