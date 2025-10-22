import { PlatformAdapter, SendMessageResult } from "../types/types";

export abstract class BaseAdapter implements PlatformAdapter {
  constructor(protected config: any) {}

  abstract sendMessage(
    recipient: string,
    text: string
  ): Promise<SendMessageResult>;
  abstract handleWebhook(data: any): void;

  protected handleError(error: any): SendMessageResult {
    return {
      success: false,
      error:
        error.response?.data?.error?.message ||
        error.message ||
        "Unknown error",
    };
  }
}
