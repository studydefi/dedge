import { EventEmitter } from "events";

interface Provider extends EventEmitter {
  send(method: String, params?: Array<any>): Promise<any>;
}

declare global {
  interface Window {
    ethereum: Provider | undefined;
    toastProvider: any;
    analytics: any;
  }
}
