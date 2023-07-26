export interface FormatCableTVNetworkInput {
    billProviderSlug: string;
    billServiceSlug: string;
    cableTVProvider: {
        name: string;
        icon: string;
    };
}

export interface FormatCableTVNetworkOutput {
    billProvider: string;
    billService: string;
    icon: string;
    name: string;
}
