import { PlatformAdapter, SendMessageResult, Message } from '../types/types';

export abstract class BaseAdapter implements PlatformAdapter {
  constructor(protected config: unknown) {}

  abstract sendMessage(recipient: string, text: string): Promise<SendMessageResult>;
  abstract handleWebhook(data: unknown): void;

  protected handleError(error: unknown): SendMessageResult {
    const responseMessage =
      (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
        ?.message;
    const directMessage = (error as { message?: string }).message;
    return {
      success: false,
      error: responseMessage || directMessage || 'Unknown error',
    };
  }

  public setEmitter(emit: (message: Message) => void): void {
    // Assign the protected method from within the class to preserve visibility
    (this as unknown as { emitMessage: (message: Message) => void }).emitMessage = emit;
  }
}
