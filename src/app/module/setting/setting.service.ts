import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import {
  IUpdateSettingPayload,
  IUpsertSettingPayload,
} from "./setting.interface";

const PUBLIC_SETTING_KEYS = [
  "EMERGENCY_HOTLINE",
  "SEARCH_RADIUS_KM",
  "OFFER_EXPIRY_SECONDS",
  "MAINTENANCE_MODE",
  "PLATFORM_NAME",
  "SUPPORT_EMAIL",
  "SUPPORT_PHONE",
];

const getPublicSettings = async () => {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: PUBLIC_SETTING_KEYS },
    },
  });

  const settingMap: Record<string, string> = {
    EMERGENCY_HOTLINE: "999",
    SEARCH_RADIUS_KM: "15",
    OFFER_EXPIRY_SECONDS: "90",
    MAINTENANCE_MODE: "false",
    PLATFORM_NAME: "PulseRoute Emergency Dispatch",
    SUPPORT_EMAIL: "support@pulseroute.com",
    SUPPORT_PHONE: "+8801700000000",
  };

  for (const item of settings) {
    settingMap[item.key] = item.value;
  }

  return settingMap;
};

const getAllSettings = async () => {
  return prisma.systemSetting.findMany({
    orderBy: { key: "asc" },
  });
};

const getSettingByKey = async (key: string) => {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
  });

  if (!setting) {
    throw new AppError(httpStatus.NOT_FOUND, `Setting '${key}' not found`);
  }

  return setting;
};

const upsertSetting = async (payload: IUpsertSettingPayload) => {
  const setting = await prisma.systemSetting.upsert({
    where: { key: payload.key },
    update: {
      value: payload.value,
      description: payload.description,
    },
    create: {
      key: payload.key,
      value: payload.value,
      description: payload.description,
    },
  });

  return setting;
};

const updateSetting = async (key: string, payload: IUpdateSettingPayload) => {
  const existing = await prisma.systemSetting.findUnique({
    where: { key },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, `Setting '${key}' not found`);
  }

  const setting = await prisma.systemSetting.update({
    where: { key },
    data: {
      value: payload.value,
      description: payload.description !== undefined ? payload.description : existing.description,
    },
  });

  return setting;
};

const deleteSetting = async (key: string) => {
  const existing = await prisma.systemSetting.findUnique({
    where: { key },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, `Setting '${key}' not found`);
  }

  await prisma.systemSetting.delete({
    where: { key },
  });

  return { message: `Setting '${key}' deleted successfully` };
};

export const SettingService = {
  getPublicSettings,
  getAllSettings,
  getSettingByKey,
  upsertSetting,
  updateSetting,
  deleteSetting,
};

