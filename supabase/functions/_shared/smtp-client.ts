
import { SMTPClient } from "denomailer";

export class Mailer {
    private client: SMTPClient;
    private fromEmail: string;

    constructor() {
        const hostname = Deno.env.get("SMTP_HOST");
        const port = parseInt(Deno.env.get("SMTP_PORT") || "465");
        const username = Deno.env.get("SMTP_USER");
        const password = Deno.env.get("SMTP_PASS");
        this.fromEmail = Deno.env.get("SMTP_FROM") || username || "";

        if (!hostname || !username || !password) {
            console.warn("SMTP credentials missing. Email capabilities disabled.");
        }

        this.client = new SMTPClient({
            connection: {
                hostname: hostname!,
                port: port,
                tls: port === 465,
                auth: {
                    username: username!,
                    password: password!,
                },
            },
        });
    }

    async sendEmail(subject: string, content: string, isHtml = false) {
        if (!this.fromEmail) return;

        try {
            await this.client.send({
                from: this.fromEmail,
                to: this.fromEmail, // Sending to self as per request "send me mail"
                subject: subject,
                content: isHtml ? undefined : content,
                html: isHtml ? content : undefined,
            });
            console.log(`Email sent: ${subject}`);
        } catch (error) {
            console.error("Failed to send email:", error);
        }
    }

    async sendSuccess(functionName: string, details: any) {
        const subject = `[SUCCESS] Function: ${functionName}`;
        const content = `
      <h1>Function Executed Successfully</h1>
      <p><strong>Function:</strong> ${functionName}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <pre>${JSON.stringify(details, null, 2)}</pre>
    `;
        await this.sendEmail(subject, content, true);
    }

    async sendError(functionName: string, error: any) {
        const subject = `[ERROR] Function: ${functionName}`;
        const content = `
      <h1>Function Execution Failed</h1>
      <p><strong>Function:</strong> ${functionName}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>Error:</strong> ${error.message || error}</p>
      <pre>${JSON.stringify(error, null, 2)}</pre>
    `;
        await this.sendEmail(subject, content, true);
    }
}

export const mailer = new Mailer();
