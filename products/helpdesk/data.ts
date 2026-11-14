// Fake outside data for the Helpdesk Agent. Fixed values, so every run and screenshot matches.
// Shared tools in base.ts read accounts, invoices, and tickets.
// getStatusPage and getRefunds are NOT wired into any agent yet. A tenant can add a tool for them in features.tsx.

export type TenantId = "lumen" | "cedar";

export interface Account {
  id: string;
  name: string;
  email: string;
  plan: string;
  seats: number;
  status: "active" | "past due" | "canceled";
  renewsOn: string;
}

export interface Invoice {
  id: string;
  accountId: string;
  amount: number;
  issuedOn: string;
  dueOn: string;
  status: "paid" | "open" | "overdue";
}

export interface Refund {
  id: string;
  invoiceId: string;
  amount: number;
  status: "issued" | "pending" | "denied";
  date: string;
  reason: string;
}

export interface Incident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  impact: "minor" | "major";
  startedAt: string;
  lastUpdate: string;
  affected: string[];
}

export interface StatusPage {
  overall: string;
  components: { name: string; status: "operational" | "degraded" | "outage" }[];
  incidents: Incident[];
}

const ACCOUNTS: Record<TenantId, Account[]> = {
  lumen: [
    { id: "LUM-1001", name: "Harbor Bikes", email: "ops@harborbikes.example", plan: "Growth", seats: 25, status: "active", renewsOn: "2027-02-01" },
    { id: "LUM-1002", name: "Quill and Ink Studio", email: "admin@quillink.example", plan: "Starter", seats: 5, status: "past due", renewsOn: "2026-12-10" },
    { id: "LUM-1003", name: "Tidewater Foods", email: "data@tidewater.example", plan: "Enterprise", seats: 140, status: "active", renewsOn: "2027-06-30" },
  ],
  cedar: [
    { id: "CED-2001", name: "Maple Grove Family Clinic", email: "frontdesk@maplegrove.example", plan: "Clinic", seats: 12, status: "active", renewsOn: "2027-01-15" },
    { id: "CED-2002", name: "Riverbend Dental", email: "office@riverbend.example", plan: "Solo", seats: 3, status: "past due", renewsOn: "2026-11-30" },
    { id: "CED-2003", name: "Summitview Physical Therapy", email: "admin@summitview.example", plan: "Group", seats: 40, status: "active", renewsOn: "2027-04-01" },
  ],
};

const INVOICES: Record<TenantId, Invoice[]> = {
  lumen: [
    { id: "INV-2041", accountId: "LUM-1002", amount: 49, issuedOn: "2026-10-10", dueOn: "2026-10-24", status: "overdue" },
    { id: "INV-2042", accountId: "LUM-1001", amount: 625, issuedOn: "2026-11-01", dueOn: "2026-11-15", status: "open" },
    { id: "INV-2043", accountId: "LUM-1003", amount: 8400, issuedOn: "2026-10-01", dueOn: "2026-10-31", status: "paid" },
  ],
  cedar: [
    { id: "INV-7310", accountId: "CED-2002", amount: 89, issuedOn: "2026-10-30", dueOn: "2026-11-13", status: "overdue" },
    { id: "INV-7311", accountId: "CED-2001", amount: 420, issuedOn: "2026-11-01", dueOn: "2026-11-15", status: "open" },
    { id: "INV-7312", accountId: "CED-2003", amount: 1350, issuedOn: "2026-10-01", dueOn: "2026-10-15", status: "paid" },
  ],
};

const REFUNDS: Record<TenantId, Refund[]> = {
  lumen: [
    { id: "RF-501", invoiceId: "INV-2043", amount: 120, status: "issued", date: "2026-10-20", reason: "Seats removed mid cycle" },
    { id: "RF-502", invoiceId: "INV-2041", amount: 49, status: "pending", date: "2026-11-02", reason: "Charged after cancel request" },
  ],
  cedar: [
    { id: "RF-901", invoiceId: "INV-7312", amount: 75, status: "issued", date: "2026-10-18", reason: "Duplicate text message charges" },
    { id: "RF-902", invoiceId: "INV-7310", amount: 89, status: "denied", date: "2026-11-05", reason: "Outside the refund window" },
  ],
};

const STATUS_PAGES: Record<TenantId, StatusPage> = {
  lumen: {
    overall: "Partial degradation",
    components: [
      { name: "Dashboards", status: "degraded" },
      { name: "Data connectors", status: "operational" },
      { name: "Scheduled reports", status: "operational" },
      { name: "API", status: "operational" },
    ],
    incidents: [
      {
        id: "INC-318",
        title: "Dashboards load slowly in the EU region",
        status: "identified",
        impact: "minor",
        startedAt: "2026-11-14 08:20 UTC",
        lastUpdate: "We found a slow database node and are moving traffic off it. Next update by 11:00 UTC.",
        affected: ["Dashboards"],
      },
    ],
  },
  cedar: {
    overall: "Partial outage",
    components: [
      { name: "Online booking", status: "operational" },
      { name: "Text reminders", status: "outage" },
      { name: "Email reminders", status: "operational" },
      { name: "Patient portal", status: "operational" },
    ],
    incidents: [
      {
        id: "INC-552",
        title: "Appointment text reminders are not sending",
        status: "investigating",
        impact: "major",
        startedAt: "2026-11-14 07:45 UTC",
        lastUpdate: "Our text message provider is failing to deliver. Email reminders still work. Next update by 10:30 UTC.",
        affected: ["Text reminders"],
      },
    ],
  },
};

const norm = (s: string) => s.trim().toLowerCase();

export function findAccount(tenant: TenantId, query: string): Account | null {
  const q = norm(query);
  return ACCOUNTS[tenant].find((a) => norm(a.id) === q || norm(a.email) === q || norm(a.name).includes(q)) ?? null;
}

export function findInvoice(tenant: TenantId, invoiceId: string): Invoice | null {
  return INVOICES[tenant].find((i) => norm(i.id) === norm(invoiceId)) ?? null;
}

export function getRefunds(tenant: TenantId, invoiceId?: string): Refund[] {
  return REFUNDS[tenant].filter((r) => !invoiceId || norm(r.invoiceId) === norm(invoiceId));
}

export function getStatusPage(tenant: TenantId): StatusPage {
  return STATUS_PAGES[tenant];
}

// Tickets live in memory only. Nothing is sent anywhere.
let nextTicket = 4100;
export function openTicket(tenant: TenantId, subject: string, email?: string) {
  nextTicket += 1;
  return { id: `T-${nextTicket}`, tenant, subject, email: email ?? null, status: "open", reply: "A person replies within one business day." };
}
