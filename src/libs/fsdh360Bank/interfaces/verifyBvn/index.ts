export interface BvnVerificationOptions {
    bvn: string;
}

export interface BvnVerificationResponse {
    bvn: string;
    firstName: string;
    middleName: string;
    lastName: string;
    dateOfBirth: string;
    registrationDate: string;
    enrollmentBank: string;
    responseCode: string;
    enrollmentBranch: string;
}
