export interface CreateBusinessVirtualAccountOptions {
    customer_identifier: string;
    business_name: string;
    mobile_num: string;
    bvn: string;
    beneficiary_account: string;
}

export interface CreateBusinessVirtualAccountResponseData {
    first_name: string;
    last_name: string;
    bank_code: string;
    virtual_account_number: string;
    beneficiary_account: string;
    customer_identifier: string;
}
