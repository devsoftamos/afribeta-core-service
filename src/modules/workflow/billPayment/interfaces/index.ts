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
    accessToken: string;
    hash?: string;
    customer: {
        name: string;
        address: string;
        util: string;
        minimumAmount: number;
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
    MTN = "MTN",
    AIRTEL = "AIRTEL",
    ETISALAT = "ETISALAT",
    GLO = "GLO",
    SMILE = "SMILE",
    SPECTRANET = "SPECTRANET",
}

export interface GetDataBundleResponse {
    code: string;
    price: number;
    title: string;
    validity?: string;
    billProvider: string;
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
    vtuNetwork: NetworkDataProvider;
    vtuAmount: number;
    vtuEmail?: string;
    referenceId: string;
}

export interface VendAirtimeResponse {
    networkProviderReference: string;
    package: string;
}
