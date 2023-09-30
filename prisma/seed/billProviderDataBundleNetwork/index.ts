const iRecharge = [
    {
        billProviderSlug: "irecharge",
        billServiceSlug: "mtn-data",
    },
    {
        billProviderSlug: "irecharge",
        billServiceSlug: "glo-data",
    },
    {
        billProviderSlug: "irecharge",
        billServiceSlug: "airtel-data",
    },
    {
        billProviderSlug: "irecharge",
        billServiceSlug: "etisalat-data",
    },
];

const buyPower = [
    {
        billProviderSlug: "buypower",
        billServiceSlug: "mtn-data",
    },
    {
        billProviderSlug: "buypower",
        billServiceSlug: "glo-data",
    },
    {
        billProviderSlug: "buypower",
        billServiceSlug: "airtel-data",
    },
    {
        billProviderSlug: "buypower",
        billServiceSlug: "etisalat-data",
    },
];

export const billProviderDataBundleNetworks = [...iRecharge, ...buyPower];
