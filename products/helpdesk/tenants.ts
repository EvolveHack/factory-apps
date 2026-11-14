// Static import map of every customer's own files. Shared code reads customers only through here.
import type { ToolSet } from "ai";
import type { ReactNode } from "react";
import type { TenantId } from "./data";

import lumenConfig from "./tenants/lumen/config.json";
import lumenFlags from "./tenants/lumen/flags.json";
import * as lumenFeatures from "./tenants/lumen/features";
import cedarConfig from "./tenants/cedar/config.json";
import cedarFlags from "./tenants/cedar/flags.json";
import * as cedarFeatures from "./tenants/cedar/features";

export interface TenantConfig {
  company: string;
  product: string;
  agentName: string;
  accent: string;
  tone: string;
  greeting: string;
  policies: string[];
  suggestedQuestions: string[];
}

export interface TenantFlags {
  showToolBadges: boolean;
  showSuggestedQuestions: boolean;
}

export interface TenantFeatures {
  tools: ToolSet;
  rules: string[];
  ExtraPanel: () => ReactNode;
}

export interface Tenant {
  id: TenantId;
  config: TenantConfig;
  flags: TenantFlags;
  features: TenantFeatures;
}

export const TENANTS: Record<TenantId, Tenant> = {
  lumen: { id: "lumen", config: lumenConfig, flags: lumenFlags, features: lumenFeatures },
  cedar: { id: "cedar", config: cedarConfig, flags: cedarFlags, features: cedarFeatures },
};

export function getTenant(id: string): Tenant | null {
  return id in TENANTS ? TENANTS[id as TenantId] : null;
}
