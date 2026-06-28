import type { ReportStatus, UrgencyLevel } from "@/types/domain";

export const locations = [
  { id: "loc-warehouse", area: "Warehouse", name: "Main Warehouse", defaultOwner: "Warehouse Supervisor" },
  { id: "loc-loading", area: "Logistics", name: "Loading Area", defaultOwner: "Logistics Supervisor" },
  { id: "loc-fabrication", area: "Production", name: "Fabrication Area", defaultOwner: "Fabrication Supervisor" },
  { id: "loc-paintshop", area: "Production", name: "Paintshop", defaultOwner: "Paintshop Supervisor" },
  { id: "loc-testing", area: "Production", name: "Testing Area", defaultOwner: "Testing Supervisor" },
  { id: "loc-office", area: "Office", name: "Office Area", defaultOwner: "Facilities Executive" },
  { id: "loc-guard", area: "Security", name: "Guard House", defaultOwner: "Security Supervisor" }
];

export const departments = [
  "EHS",
  "Maintenance",
  "Facilities",
  "Production",
  "Warehouse",
  "Logistics",
  "Security",
  "Engineering"
];

export const hazardCategories = [
  { name: "Housekeeping / Access", examples: "Blocked walkway, spill, poor storage", defaultUrgency: "medium" },
  { name: "Machine Safety", examples: "Missing guard, exposed moving part", defaultUrgency: "high" },
  { name: "Electrical Safety", examples: "Damaged plug, exposed cable, open panel", defaultUrgency: "high" },
  { name: "Chemical Safety", examples: "Unlabelled chemical, leak, poor storage", defaultUrgency: "high" },
  { name: "Working at Height", examples: "Unsafe ladder, missing edge protection", defaultUrgency: "high" },
  { name: "Material Handling", examples: "Unsafe stacking, pallet issue, lifting risk", defaultUrgency: "medium" },
  { name: "Fire / Emergency", examples: "Blocked extinguisher, blocked exit, alarm issue", defaultUrgency: "urgent" },
  { name: "PPE / Unsafe Act", examples: "No required PPE, unsafe behavior", defaultUrgency: "medium" },
  { name: "Environmental", examples: "Waste issue, spill to drain, emission concern", defaultUrgency: "medium" },
  { name: "Other", examples: "Hazard not covered by other categories", defaultUrgency: "medium" }
];

export const actionOwners = [
  { name: "Aiman Maintenance", department: "Maintenance", role: "Supervisor", email: "maintenance.supervisor@example.com" },
  { name: "Farah Facilities", department: "Facilities", role: "Executive", email: "facilities.executive@example.com" },
  { name: "Ravi Warehouse", department: "Warehouse", role: "Supervisor", email: "warehouse.supervisor@example.com" },
  { name: "Mei Production", department: "Production", role: "Manager", email: "production.manager@example.com" },
  { name: "Kumar Logistics", department: "Logistics", role: "Supervisor", email: "logistics.supervisor@example.com" }
];

export const ehsUsers = [
  { name: "EHS Admin", email: "ehs.admin@example.com", role: "ehs" },
  { name: "EHS Reviewer", email: "ehs.reviewer@example.com", role: "ehs" }
];

export const escalationRules = [
  { urgency: "urgent", reviewHours: 1, ownerDueDays: 1, escalateTo: "HOD + EHS Manager" },
  { urgency: "high", reviewHours: 4, ownerDueDays: 3, escalateTo: "Department HOD" },
  { urgency: "medium", reviewHours: 24, ownerDueDays: 7, escalateTo: "Department Manager" },
  { urgency: "low", reviewHours: 48, ownerDueDays: 14, escalateTo: "Department Supervisor" }
];

export const sampleReports: Array<{
  reportNo: string;
  location: string;
  summary: string;
  category: string;
  urgency: UrgencyLevel;
  status: ReportStatus;
  createdAt: string;
}> = [
  {
    reportNo: "HZ-2026-0001",
    location: "Loading Area",
    summary: "Pallet blocking pedestrian walkway",
    category: "Housekeeping / Access",
    urgency: "medium",
    status: "submitted",
    createdAt: "2026-06-28"
  },
  {
    reportNo: "HZ-2026-0002",
    location: "Paintshop",
    summary: "Chemical container without readable label",
    category: "Chemical Safety",
    urgency: "high",
    status: "ehs_review",
    createdAt: "2026-06-28"
  },
  {
    reportNo: "HZ-2026-0003",
    location: "Warehouse",
    summary: "Unsafe stacking near material staging zone",
    category: "Material Handling",
    urgency: "medium",
    status: "assigned",
    createdAt: "2026-06-27"
  }
];
