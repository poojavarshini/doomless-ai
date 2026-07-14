export interface StorageArea {
  get(keys?: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
  clear(): Promise<void>;
}

export interface RuntimeMessageSender { tab?: { id?: number } }
export type MessageListener = (
  message: unknown,
  sender: RuntimeMessageSender,
  sendResponse: (response: unknown) => void,
) => boolean | void;

interface ChromeLike {
  storage: { local: StorageArea };
  runtime: {
    sendMessage(message: unknown): Promise<unknown>;
    openOptionsPage(): Promise<void>;
    onMessage: { addListener(listener: MessageListener): void };
  };
}

export const chromeApi = (globalThis as unknown as { chrome: ChromeLike }).chrome;
