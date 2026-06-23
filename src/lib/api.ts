import { HazardTicket, Camera, EdgeBox, WarningEvent, Announcement, Employee, OrgUnit, Position, SystemLog } from "../types";

export async function fetchStats() {
  const res = await fetch("/api/safety/stats");
  return res.json();
}

export async function fetchHazards(): Promise<HazardTicket[]> {
  const res = await fetch("/api/hazards");
  return res.json();
}

export async function createHazard(data: Partial<HazardTicket>): Promise<HazardTicket> {
  const res = await fetch("/api/hazards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateHazard(id: string, data: {
  status?: string;
  operator?: string;
  comments?: string;
  rectifier?: string;
  rectificationPlan?: string;
  rectificationCost?: number;
  rectifiedImageUrl?: string;
  retestFeedback?: string;
}): Promise<HazardTicket> {
  const res = await fetch(`/api/hazards/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchWarnings(): Promise<WarningEvent[]> {
  const res = await fetch("/api/warnings");
  return res.json();
}

export async function updateWarning(id: string, data: { status: string; ticketId?: string }): Promise<WarningEvent> {
  const res = await fetch(`/api/warnings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function simulateWarning(warningType: string, camId: string): Promise<WarningEvent> {
  const res = await fetch("/api/warnings/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ warningType, camId })
  });
  return res.json();
}

export async function fetchSmartPlans() {
  const res = await fetch("/api/smart-plans");
  return res.json();
}

export async function updateSmartPlans(plans: any) {
  const res = await fetch("/api/smart-plans", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plans)
  });
  return res.json();
}

export async function fetchCameras(): Promise<Camera[]> {
  const res = await fetch("/api/cameras");
  return res.json();
}

export async function createCamera(data: Partial<Camera>): Promise<Camera> {
  const res = await fetch("/api/cameras", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchEdgeBoxes(): Promise<EdgeBox[]> {
  const res = await fetch("/api/edge-boxes");
  return res.json();
}

export async function fetchOrgs(): Promise<OrgUnit[]> {
  const res = await fetch("/api/orgs");
  return res.json();
}

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch("/api/employees");
  return res.json();
}

export async function createEmployee(data: Partial<Employee>): Promise<Employee> {
  const res = await fetch("/api/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchPositions(): Promise<Position[]> {
  const res = await fetch("/api/positions");
  return res.json();
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await fetch("/api/announcements");
  return res.json();
}

export async function createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
  const res = await fetch("/api/announcements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchLogs(): Promise<SystemLog[]> {
  const res = await fetch("/api/logs");
  return res.json();
}

export async function analyzeImageWithAi(imageBase64: string, customPrompt?: string): Promise<{
  hazardObject: string;
  hazardDescription: string;
  hazardBasis: string;
  riskLevel: '一般隐患' | '重大隐患';
  improvementSuggestion: string;
  fallbackUsed?: boolean;
}> {
  const res = await fetch("/api/ai-analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, customPrompt })
  });
  
  if (!res.ok) {
    const errData = await res.json();
    if (errData.fallbackMock) {
      return { ...errData.fallbackMock, fallbackUsed: true };
    }
    throw new Error(errData.error || "AI analysis failed");
  }
  return res.json();
}
