import type { ERPConnector } from "./types";

export const erpStub: ERPConnector = {
  async syncPurchaseOrders() {
    return { count: 0 };
  },
  async syncVendors() {
    return { count: 0 };
  },
  async pushAssetCapitalization() {
    return true;
  },
};
