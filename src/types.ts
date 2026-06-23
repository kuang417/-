export interface HazardTicket {
  id: string;
  title: string;
  hazardObject: string;
  hazardDescription: string;
  hazardBasis: string;
  riskLevel: '一般隐患' | '重大隐患';
  improvementSuggestion: string;
  location: string;
  status: '排查' | '整改' | '复查' | '已归档';
  reporter: string;
  createdAt: string;
  
  // Rectification
  rectifier?: string;
  rectificationPlan?: string;
  rectificationCost?: number;
  rectifiedImageUrl?: string;
  rectificationReason?: string;
  rectifiedAt?: string;
  
  // Retest/Check
  retester?: string;
  retestFeedback?: string;
  retestedAt?: string;
  majorApprovedBy?: string; // Additional field for major hazard approval
  
  imageUrl?: string;
  isOverdue?: boolean;
  history: Array<{
    status: string;
    operator: string;
    time: string;
    comment?: string;
  }>;
}

export interface Camera {
  id: string;
  name: string;
  code: string;
  location: string;
  status: 'online' | 'offline';
  project: string;
  url?: string;
}

export interface EdgeBox {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline';
  capacity: string; // e.g. "8路"
  cpuLoad: number;
  memoryLoad: number;
  npuLoad: number;
}

export interface WarningEvent {
  id: string;
  deviceId: string;
  deviceName: string;
  time: string;
  warningType: string; // "未戴安全帽" | "吸烟" | "睡岗" | "火焰" | "烟雾" | "玩手机" | "区域闯入" 等
  targetType: '人员' | '车辆' | '物体';
  areaName: string;
  confidence: number;
  imageUrl: string;
  status: 'pending' | 'converted' | 'ignored';
  ticketId?: string; // Linked ticket if converted
}

export interface SystemLog {
  id: string;
  time: string;
  user: string;
  action: string;
  ip: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  sender: string;
  createdAt: string;
  status: '草稿' | '已下发';
  targets: string[]; // projects or departments
}

export interface OrgUnit {
  id: string;
  name: string;
  parentId?: string;
  children?: OrgUnit[];
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  departmentId: string;
  companyName: string;
  status: '在职' | '离职';
}

export interface Position {
  id: string;
  title: string;
  code: string;
  departmentId: string;
  companyName: string;
}
