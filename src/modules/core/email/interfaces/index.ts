export type EmailProvider = "sendinblue";

export interface Receiver {
    email: string;
}
export interface SendOptions<Params = Record<string, any>> {
    to: Receiver | Receiver[];
    subject: string;
    provider: EmailProvider;
    params?: Params;
    templateId?: string | number;
    textContent?: string;
    htmlContent?: string;
}
