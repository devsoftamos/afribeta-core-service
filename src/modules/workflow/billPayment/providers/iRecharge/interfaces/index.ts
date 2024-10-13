export enum NonPowerService {
    //airtime
    MTN_AIRTIME = "mtn-airtime",
    AIRTEL_AIRTIME = "airtel-airtime",
    ETISALAT_AIRTIME = "etisalat-airtime",
    GLO_AIRTIME = "glo-airtime",

    //data
    MTN_DATA = "mtn-data",
    AIRTEL_DATA = "airtel-data",
    ETISALAT_DATA = "etisalat-data",
    GLO_DATA = "glo-data",

    //internet
    MTN_INTERNET = "mtn-internet",
    AIRTEL_INTERNET = "airtel-internet",
    ETISALAT_INTERNET = "etisalat-internet",
    GLO_INTERNET = "glo-internet",
    SMILE = "smile-internet",
    SPECTRANET = "spectranet-internet",

    //cabletv
    DSTV = "dstv",
    GOTV = "gotv",
    STARTIMES = "startimes",
}

type AirtimeSlug =
    | "mtn-airtime"
    | "airtel-airtime"
    | "etisalat-airtime"
    | "glo-airtime";
type DataSlug = "mtn-data" | "airtel-data" | "etisalat-data" | "glo-data";
type InternetSlug =
    | "mtn-internet"
    | "airtel-internet"
    | "etisalat-internet"
    | "glo-internet"
    | "smile-internet"
    | "spectranet-internet";
type CableTVSlug = "dstv" | "gotv" | "startimes";

export interface TNonPowerService {
    airtime: AirtimeSlug;
    data: DataSlug;
    internet: InternetSlug;
    tv: CableTVSlug;
}

export interface VendStatusParam {
    productSlug: any;
    access_token: string;
}
