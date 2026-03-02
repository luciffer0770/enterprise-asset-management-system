// Integration connector interfaces - stubs for ERP, CMMS, Directory, AIDC, IoT

export interface ERPConnector {
  syncPurchaseOrders(): Promise<{ count: number }>;
  syncVendors(): Promise<{ count: number }>;
  pushAssetCapitalization(assetId: string, amount: number): Promise<boolean>;
}

export interface CMMSConnector {
  pushWorkOrders(workOrderIds: string[]): Promise<{ synced: number }>;
  pullWorkOrderStatus(workOrderIds: string[]): Promise<Record<string, string>>;
}

export interface DirectoryConnector {
  oidcSignIn(redirectUri: string): string;
  scimProvision(user: unknown): Promise<boolean>;
  scimDeprovision(userId: string): Promise<boolean>;
}

export interface AIDCConnector {
  barcodeFormats(): string[];
  rfidReaderHealth(): Promise<{ status: string }>;
  encodeTag(assetTag: string): Promise<string>;
}

export interface IoTConnector {
  ingestTelemetry(assetId: string, payload: unknown): Promise<void>;
  computeConditionAlerts(): Promise<{ alerts: number }>;
}
