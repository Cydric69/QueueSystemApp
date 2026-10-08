// src/lib/sms.ts

interface IProgSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  messageStatusLink?: string;
}

interface IProgSMSStatusResponse {
  success: boolean;
  status?: string;
  error?: string;
}

const IPROG_SMS_ENDPOINT = "https://sms.iprogtech.com/api/v1/sms_messages";
const IPROG_SMS_STATUS_ENDPOINT =
  "https://sms.iprogtech.com/api/v1/sms_messages/status";

function formatPhoneForSMS(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.startsWith("63") && cleanPhone.length === 12) {
    return "0" + cleanPhone.substring(2);
  } else if (cleanPhone.startsWith("9") && cleanPhone.length === 10) {
    return "0" + cleanPhone;
  }

  return cleanPhone;
}

export async function sendSMS(
  phoneNumber: string,
  message: string,
): Promise<IProgSMSResponse> {
  try {
    const formattedPhone = formatPhoneForSMS(phoneNumber);

    const IPROG_API_TOKEN = process.env.IPROG_API_TOKEN;

    if (!IPROG_API_TOKEN) {
      console.error("IPROG_API_TOKEN not configured");
      return { success: false, error: "SMS service not configured" };
    }

    const requestBody = {
      api_token: IPROG_API_TOKEN,
      phone_number: formattedPhone,
      message,
    };

    const response = await fetch(IPROG_SMS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data) {
      console.error("IPROG SMS API error:", response.status, data);
      return {
        success: false,
        error: `Failed to send SMS (${response.status})`,
      };
    }

    const isSuccess = data.status === 200 || data.status === "success";

    if (!isSuccess) {
      console.error("IPROG SMS API returned error:", data.message);
      return { success: false, error: data.message || "SMS send failed" };
    }

    return {
      success: true,
      messageId: data.message_id,
      messageStatusLink: data.message_status_link,
    };
  } catch (error: any) {
    console.error("Error sending SMS:", error);

    if (error?.cause?.code === "ENOTFOUND") {
      return {
        success: false,
        error: `SMS service hostname not found: ${error.cause.hostname}`,
      };
    }

    return { success: false, error: "Failed to send SMS" };
  }
}

export async function checkSMSStatus(
  messageId: string,
): Promise<IProgSMSStatusResponse> {
  try {
    const IPROG_API_TOKEN = process.env.IPROG_API_TOKEN;

    if (!IPROG_API_TOKEN) {
      return { success: false, error: "SMS service not configured" };
    }

    const statusUrl = `${IPROG_SMS_STATUS_ENDPOINT}?api_token=${IPROG_API_TOKEN}&message_id=${messageId}`;

    const response = await fetch(statusUrl, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data) {
      return { success: false, error: "Failed to check SMS status" };
    }

    return {
      success: true,
      status: data.status || data.message_status || data.delivery_status,
    };
  } catch (error) {
    console.error("Error checking SMS status:", error);
    return { success: false, error: "Failed to check SMS status" };
  }
}

export async function sendDocumentRequestSMS(
  phoneNumber: string,
  studentName: string,
  requestId: string,
  documentTypeLabel: string,
  status: string,
  remarks?: string,
): Promise<void> {
  try {
    if (!phoneNumber) {
      console.log("No phone number provided for SMS notification");
      return;
    }

    let message = "";

    switch (status) {
      case "submitted":
        message = `BCC Document Request: Hi ${studentName}, your request ${requestId} for ${documentTypeLabel} is PENDING. We'll text you again once there's an update.`;
        break;
      case "processing":
        message = `BCC Document Request: Hi ${studentName}, your request ${requestId} for ${documentTypeLabel} is now being processed.`;
        break;
      case "ready-for-pickup":
        message = `BCC Document Request: Hi ${studentName}, your request ${requestId} for ${documentTypeLabel} is ready for pickup at the Registrar's Office.`;
        break;
      case "released":
        message = `BCC Document Request: Hi ${studentName}, your request ${requestId} for ${documentTypeLabel} has been released. Thank you!`;
        break;
      case "rejected":
        message = `BCC Document Request: Hi ${studentName}, your request ${requestId} for ${documentTypeLabel} was rejected${remarks ? `: ${remarks}` : ""}. Please visit the Registrar's Office for more information.`;
        break;
      default:
        message = `BCC Document Request: Hi ${studentName}, your request ${requestId} status has been updated to ${status}.`;
    }

    if (message.length > 160) {
      message = message.substring(0, 157) + "...";
    }

    const result = await sendSMS(phoneNumber, message);

    if (!result.success) {
      console.error("Failed to send SMS notification:", result.error);
    } else {
      console.log(`SMS sent to ${phoneNumber}, messageId: ${result.messageId}`);
    }
  } catch (error) {
    console.error("Error in sendDocumentRequestSMS:", error);
  }
}

export async function sendTicketNotificationSMS(
  phoneNumber: string,
  studentName: string,
  ticketNumber: string,
  transactionType: string,
  status: string,
  queuePosition?: number,
  staffName?: string,
): Promise<void> {
  try {
    if (!phoneNumber) return;

    const transactionLabel = transactionType
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());

    let message = "";

    switch (status) {
      case "submitted":
        message = `BCC Queue: Hi ${studentName}, your ticket ${ticketNumber} for ${transactionLabel} is PENDING. Position: ${queuePosition || 1}. We'll notify you when it's your turn.`;
        break;
      case "serving":
        message = `BCC Queue: Hi ${studentName}, your ticket ${ticketNumber} for ${transactionLabel} is now being served${staffName ? ` by ${staffName}` : ""}. Please proceed to the counter.`;
        break;
      case "next":
        message = `BCC Queue: Hi ${studentName}, you're next in line! Ticket ${ticketNumber} for ${transactionLabel} will be served soon. Please be ready.`;
        break;
      case "reminder":
        message = `BCC Queue: Hi ${studentName}, your ticket ${ticketNumber} for ${transactionLabel} is in position ${queuePosition || 2}. Please wait for your turn.`;
        break;
      case "skipped":
      case "cancelled":
        message = `BCC Queue: Hi ${studentName}, your ticket ${ticketNumber} for ${transactionLabel} was cancelled. Please visit the cashier for assistance.`;
        break;
      case "completed":
        message = `BCC Queue: Hi ${studentName}, your ticket ${ticketNumber} for ${transactionLabel} has been completed. Thank you!`;
        break;
      case "waiting":
        message = `BCC Queue: Hi ${studentName}, your ticket ${ticketNumber} for ${transactionLabel} is in position ${queuePosition || 1}. Please wait for your turn.`;
        break;
      default:
        message = `BCC Queue: Hi ${studentName}, your ticket ${ticketNumber} status has been updated to ${status}.`;
    }

    if (message.length > 160) {
      message = message.substring(0, 157) + "...";
    }

    const result = await sendSMS(phoneNumber, message);

    if (!result.success) {
      console.error("Failed to send ticket SMS notification:", result.error);
    } else {
      console.log(
        `Ticket SMS sent to ${phoneNumber}, messageId: ${result.messageId}`,
      );
    }
  } catch (error) {
    console.error("Error in sendTicketNotificationSMS:", error);
  }
}
