export enum MeterType {
    PREPAID = "PREPAID",
    POSTPAID = "POSTPAID",
}

export type MeterAccountType = "MD" | "NMD";

export interface FormattedElectricDiscoData {
    discoType: string;
    meterType: MeterType;
    billProvider: string;
    code: string;
    minValue: number;
    maxValue: number;
}

export interface GetMeterInfoOptions {
    discoCode?: string;
    meterNumber: string;
    reference?: string;
    meterType?: MeterType;
}

export interface GetMeterResponse {
    accessToken?: string;
    meter: {
        meterAccountType?: MeterAccountType;
        minimumAmount: number;
        maximumAmount?: number;
    };
    customer: {
        name: string;
        address: string;
    };
}

export interface VendPowerOptions {
    accessToken?: string;
    discoCode?: string;
    accountId?: string;
    email?: string;
    referenceId: string;
    amount: number;
    meterNumber: string;
    meterType?: MeterType;
    meterAccountType?: MeterAccountType;
}

export interface VendPowerResponse {
    units?: string;
    meterToken?: string;
    demandCategory?: "MD" | "NMD";
    receiptNO: string;
    purchaseDate?: Date;
    walletBalance?: number;
    //
    sgc?: string;
    outstandingDebt?: number;
    vat?: number;
    remainingDebt?: number;
    orgName?: string;
    orgNumber?: string;
    costOfUnit?: number;
    fixedCharge?: number;
    rate?: number;
    penalty?: number;
    lor?: number;
    reconnectionFee?: number;
    installationFee?: number;
    administrativeCharge?: number;
    currentCharge?: number;
    meterCost?: number;
    tariffName?: string;
}

export enum NetworkDataProvider {
    MTN = "mtn-data",
    AIRTEL = "airtel-data",
    ETISALAT = "etisalat-data",
    GLO = "glo-data",
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

export type GetCableTVBouquetResponse = GetDataBundleResponse;

export interface VendDataOptions {
    vtuNumber: string;
    vtuNetwork: NetworkDataProvider;
    dataCode: string;
    referenceId: string;
    vtuEmail?: string;
    amount?: number;
}

export interface VendDataResponse {
    networkProviderReference: string;
    receiptNO: string;
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
    amount?: number;
    phone?: string;
    receiptNO: string;
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
    accessToken?: string;
    email?: string;
    smartCardNumber: string;
    amount?: number;
}

export interface VendCableTVResponse {
    vendRef: string;
    receiptNO: string;
}

export interface GetSmartCardInfoOptions {
    tvCode?: string;
    smartCardNumber: string;
    tvNetwork: CableTVProvider;
    reference?: string;
}

export interface GetSmartCardInfoResponse {
    accessToken?: string;
    customer: {
        name: string;
        address: string;
    };
}

export enum NetworkInternetProvider {
    MTN = "mtn-internet",
    AIRTEL = "airtel-internet",
    ETISALAT = "etisalat-internet",
    GLO = "glo-internet",
    SMILE = "smile-internet",
    SPECTRANET = "spectranet-internet",
}

export interface GetInternetBundleResponse {
    code: string;
    price: number;
    title: string;
}

export interface VendInternetOptions {
    vtuNumber: string;
    vtuNetwork: NetworkInternetProvider;
    internetCode: string;
    referenceId: string;
    vtuEmail?: string;
    amount?: number;
}

export interface VendInternetResponse {
    networkProviderReference: string;
    amount: number;
    receiver: string;
    receiptNO: string;
}

export interface getSmileDeviceInfoOptions {
    deviceId: string;
}

export type PowerBillPaymentWorkflow = {
    getMeterInfo(options: GetMeterInfoOptions): Promise<GetMeterResponse>;
    vendPower(options: VendPowerOptions): Promise<VendPowerResponse>;
};

export type BillPaymentWorkflow = {
    vendAirtime(options: VendAirtimeOptions): Promise<VendAirtimeResponse>;
    vendData(options: VendDataOptions): Promise<VendDataResponse>;
    vendInternet(options: VendInternetOptions): Promise<VendInternetResponse>;
    vendCableTV(options: VendTVOptions): Promise<VendCableTVResponse>;
    getCableTVBouquets(
        cableTVProvider: CableTVProvider
    ): Promise<GetDataBundleResponse[]>;
    getDataBundles(
        networkProvider: NetworkDataProvider
    ): Promise<GetDataBundleResponse[]>;
    getInternetBundles(
        networkProvider: NetworkInternetProvider
    ): Promise<GetInternetBundleResponse[]>;
    getSmartCardInfo(
        options: GetSmartCardInfoOptions
    ): Promise<GetSmartCardInfoResponse>;
    getWalletBalance(): Promise<number>;
} & PowerBillPaymentWorkflow;
