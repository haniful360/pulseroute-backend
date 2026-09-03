export interface IUpsertSettingPayload {
  key: string;
  value: string;
  description?: string;
}

export interface IUpdateSettingPayload {
  value: string;
  description?: string;
}
