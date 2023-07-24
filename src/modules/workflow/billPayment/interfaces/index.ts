export enum MeterType {
    PREPAID = "PREPAID",
    POSTPAID = "POSTPAID",
}

export interface FormattedElectricDiscoData {
    discoType: string;
    meterType: MeterType;
    billProvider: string;
    code: string;
    minValue: number;
    maxValue: number;
}

export interface GetMeterInfoOptions {
    discoCode: string;
    meterNumber: string;
    reference: string;
}

export interface GetMeterResponse {
    accessToken?: string;
    customer: {
        name: string;
        address: string;
        minimumAmount?: number;
    };
}

export interface VendPowerOptions {
    accessToken: string;
    discoCode: string;
    accountId: string;
    email: string;
    referenceId: string;
    amount: number;
    meterNumber: string;
}

export interface VendPowerResponse {
    units: string;
    meterToken: string;
}

export enum NetworkDataProvider {
    MTN = "mtn-data",
    AIRTEL = "airtel-data",
    ETISALAT = "etisalat-data",
    GLO = "glo-data",
    SMILE = "smile-data",
    SPECTRANET = "spectranet-data",
}

export enum NetworkAirtimeProvider {
    MTN = "mtn-airtime",
    AIRTEL = "airtel-airtime",
    ETISALAT = "etisalat-airtime",
    GLO = "glo-airtime",
}

export interface GetDataBundleResponse {
    code: string;
    price: number;
    title: string;
    validity?: string;
}

export interface VendDataOptions {
    vtuNumber: string;
    vtuNetwork: NetworkDataProvider;
    dataCode: string;
    referenceId: string;
    vtuEmail?: string;
}

export interface VendDataResponse {
    networkProviderReference: string;
}

export interface VendAirtimeOptions {
    vtuNumber: string;
    vtuNetwork: NetworkAirtimeProvider;
    vtuAmount: number;
    vtuEmail?: string;
    referenceId: string;
}

export interface VendAirtimeResponse {
    networkProviderReference: string;
    package: string;
    amount: number;
    phone: string;
}

//TV
export interface GetCableTVSubscriptionResponse {
    code: string;
    price: number;
    title: string;
}

export enum CableTVProvider {
    DSTV = "dstv",
    GOTV = "gotv",
    STARTIMES = "startimes",
}

export interface VendTVOptions {
    phone: string;
    tvNetwork: CableTVProvider;
    tvCode: string;
    referenceId: string;
    accessToken: string;
    email?: string;
    smartCardNumber: string;
}

// export enum NetworkInternetProvider {
//     MTN = "mtn-data",
//     AIRTEL = "airtel-data",
//     ETISALAT = "etisalat-data",
//     GLO = "glo-data",
//     SMILE = "smile-data",
//     SPECTRANET = "spectranet-data",
// }
