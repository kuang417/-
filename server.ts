import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { HazardTicket, Camera, EdgeBox, WarningEvent, Announcement, Employee, OrgUnit, Position, SystemLog } from "./src/types";

// Database storage file path (simple robust filesystem persistence)
const DB_FILE = path.join(process.cwd(), "db_state.json");

// Define system presets
const DEFAULT_CAMERAS: Camera[] = [
  { id: "cam-01", name: "1号楼南侧塔吊", code: "CG-TD-001", location: "1号楼楼顶南侧", status: "online", project: "南宁北港智慧新城" },
  { id: "cam-02", name: "2号井主井口监控", code: "CG-JK-002", location: "2号井井道口", status: "online", project: "防城港储煤码头" },
  { id: "cam-03", name: "危化品室出入口", code: "CG-WH-003", location: "B区危化材料库门口", status: "online", project: "北海保税冷链基地" },
  { id: "cam-04", name: "钢筋加工棚西面", code: "CG-GJ-004", location: "西侧钢筋棚", status: "online", project: "钦州临港产业园" },
  { id: "cam-05", name: "生活区食堂南侧", code: "CG-食堂", location: "食堂正门", status: "online", project: "南宁北港智慧新城" },
  { id: "cam-06", name: "3号楼周界东段", code: "CG-WJ-006", location: "东侧围墙", status: "offline", project: "南宁北港智慧新城" }
];

const DEFAULT_EDGE_BOXES: EdgeBox[] = [
  { id: "box-01", name: "总部一期AI边缘算力盒", ip: "10.128.45.12", status: "online", capacity: "16路", cpuLoad: 42, memoryLoad: 58, npuLoad: 65 },
  { id: "box-02", name: "防城港项目便携式检测盒", ip: "10.134.12.99", status: "online", capacity: "8路", cpuLoad: 18, memoryLoad: 41, npuLoad: 25 }
];

const DEFAULT_WARNINGS: WarningEvent[] = [
  {
    id: "warn-01",
    deviceId: "cam-01",
    deviceName: "1号楼南侧塔吊",
    time: "2026-06-22 09:12:04",
    warningType: "未戴安全帽",
    targetType: "人员",
    areaName: "1号楼南侧作业面",
    confidence: 94.2,
    imageUrl: "https://images.unsplash.com/photo-1589793907316-f9401552840c?w=500",
    status: "pending"
  },
  {
    id: "warn-02",
    deviceId: "cam-03",
    deviceName: "危化品室出入口",
    time: "2026-06-22 10:04:15",
    warningType: "吸烟",
    targetType: "人员",
    areaName: "B区危化材料库",
    confidence: 91.5,
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500",
    status: "pending"
  },
  {
    id: "warn-03",
    deviceId: "cam-02",
    deviceName: "2号井主井口监控",
    time: "2026-06-21 14:22:50",
    warningType: "区域闯入",
    targetType: "人员",
    areaName: "主井口危险管控区",
    confidence: 97.8,
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500",
    status: "converted",
    ticketId: "hz-02"
  },
  {
    id: "warn-04",
    deviceId: "cam-04",
    deviceName: "钢筋加工棚西面",
    time: "2026-06-22 10:30:11",
    warningType: "温度异常/烟火",
    targetType: "物体",
    areaName: "西侧钢筋棚配电箱",
    confidence: 88.6,
    imageUrl: "https://images.unsplash.com/photo-1486520299386-6d106b22014b?w=500",
    status: "ignored"
  }
];

const DEFAULT_HAZARDS: HazardTicket[] = [
  {
    id: "hz-01",
    title: "1号楼南侧通道发现脚手架扣件松脱与倾斜",
    hazardObject: "南侧挑檐安全扣及悬挑脚手架",
    hazardDescription: "1号楼南侧三层悬挑脚手架局部出现横向水平杆件扣件锁紧力不足（松脱），导致护身栏杆有微幅倾斜，构成高空坠落潜在风险。",
    hazardBasis: "《建筑施工扣件式钢管脚手架安全技术规范》JGJ 130-2011 第7.3款：扣件螺栓拧紧转矩不应小于40N·m，且不应大于65N·m。",
    riskLevel: "一般隐患",
    improvementSuggestion: "安排专业架子工对问题段扣件逐一紧固，并重新调平护身栏杆；紧固完成后由安全主管在班前检查中予以闭环复核。",
    location: "南宁北港智慧新城三期1号楼南侧",
    status: "排查",
    reporter: "张建华(安全员)",
    createdAt: "2026-06-22 08:30:00",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500",
    history: [
      { status: "排查", operator: "张建华(安全员)", time: "2026-06-22 08:30:00", comment: "现场日常巡检时手动拍照上传，系统自动提取隐患性质并匹配标准依据。" }
    ]
  },
  {
    id: "hz-02",
    title: "2号井井口限入隔离栏受损，存在人员盲目闯入隐患",
    hazardObject: "2号井主井口机械防断链隔离网栏",
    hazardDescription: "主井口南侧的临时隔离红黄防护栏被人为拉开，且底部滑道脱轨。AI视频监控于2026-06-21 14:22侦测到区域闯入异常并触发此次工单。",
    hazardBasis: "《建设工程施工现场消防安全技术规范》GB 50720与《建筑施工安全检查标准》JGJ 59-2011 第五条 临边防护规定：电梯井口、井道必须设高度不低于1.2m的固定防护门。",
    riskLevel: "重大隐患",
    improvementSuggestion: "立即采取断电限行措施，指派机组责任人对脱轨的限速防护网进行槽位清理并烧焊加固；加强AI视频监控算法的夜间联动现场警报声光。",
    location: "防城港储煤码头2号井道口",
    status: "整改",
    reporter: "井口视频算法(AI自动告警)",
    createdAt: "2026-06-21 14:25:00",
    rectifier: "李朝阳(整改责任人)",
    rectificationPlan: "拆卸废弃合页，重新在骨架立柱上加装两道角铁加强撑，并换用重型自锁防撬锁闭块。",
    rectificationCost: 850,
    rectifiedImageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500",
    history: [
      { status: "排查", operator: "AI视频平台", time: "2026-06-21 14:25:00", comment: "检测到非法人员在非作业时间闯入，隔离栏处于变形脱位状况，系统自动生成红单。" },
      { status: "整改", operator: "系统自动指派", time: "2026-06-21 15:00:00", comment: "限期2天。责任人李朝阳已接单，并提供初步方案、拟购加固材料清单。" }
    ]
  },
  {
    id: "hz-03",
    title: "B区危化材料库前作业现场工人未正确佩戴安全帽",
    hazardObject: "B区危化品存放仓库南侧过道",
    hazardDescription: "作业现场地面有零星吊装及脚手架作业，一名第三方外协工人在未正确系好下颚带、且将安全帽拿在手上的状态下在吊装辐射带内穿行。",
    hazardBasis: "《安全生产法》第四十五条规定，生产经营单位必须为从业人员提供符合国家标准或者行业标准的劳动防护用品，并监督、教育从业人员按照使用规则佩戴、使用。",
    riskLevel: "一般隐患",
    improvementSuggestion: "现场安全值班员应当即予以高声喝止、令其纠正，并依外协分包安全合同条款对该班组处以首犯通报教育。",
    location: "北海保税冷链基地危化品室前",
    status: "已归档",
    reporter: "肖敏(项目经理)",
    createdAt: "2026-06-20 09:15:00",
    rectifier: "张浩(班组长)",
    rectificationPlan: "现场立即责令该名工人规范系紧安全帽下颚带，并在全班组开展5分钟班前班后安全宣誓与典型照片通报。",
    rectificationCost: 0,
    rectifiedAt: "2026-06-20 10:10:00",
    retester: "肖敏(项目经理)",
    retestFeedback: "已对班组教育台账进行了审核。该名违规人员下颚带已规范系上，复查合格予以关单归档。",
    retestedAt: "2026-06-20 11:30:00",
    history: [
      { status: "排查", operator: "肖敏(项目经理)", time: "2026-06-20 09:15:00", comment: "手机拍摄上传。" },
      { status: "整改", operator: "张浩(班组长)", time: "2026-06-20 10:10:00", comment: "已落实即查即改，将施工队通报签字件上传。" },
      { status: "复查", operator: "肖敏(项目经理)", time: "2026-06-20 11:30:00", comment: "现场对班组全员安全帽防坠系扣进行二次核实，同意归档盖章。" }
    ]
  }
];

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  { id: "ann-01", title: "关于开展“安全生产月”施工现场重大风险联合大排查的紧急公告", content: "各子公司、项目部：为切实落实集团夏季安全工作部署，从即日起由安保部牵头，会同各智慧工地总包单位，依托AI边缘计算分析平台开展针对“高空防护、临时用电、密闭空间”等三大主项的安全生产大巡检大整治，各隐患限期48小时整改到位...", sender: "集团安保部", createdAt: "2026-06-15 09:00:00", status: "已下发", targets: ["南宁北港智慧新城", "防城港储煤码头", "北海保税冷链基地"] },
  { id: "ann-02", title: "北港建司随手拍隐患有奖激励办法（试行版）通知", content: "全体工友、职员：为提升全员随手拍隐患管理参与度，集团即日起对通过‘AI随手拍’小程序上报获批通过一般隐患、重大隐患的爆料人，分别给予10元、100元的微信积分商城抵用红包，鼓励全员变被动为主动防护，不放过任何一个螺丝和松扣...", sender: "北港安全管理办公室", createdAt: "2026-06-18 10:30:00", status: "已下发", targets: ["全员"] }
];

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: "emp-01", name: "张建华", phone: "13977110023", role: "安全员", departmentId: "dept-sec", companyName: "南宁分公司", status: "在职" },
  { id: "emp-02", name: "李朝阳", phone: "13507718872", role: "整改责任人", departmentId: "dept-prod", companyName: "防城港项目部", status: "在职" },
  { id: "emp-03", name: "肖敏", phone: "18977122340", role: "项目经理", departmentId: "dept-mgt", companyName: "北海分公司", status: "在职" },
  { id: "emp-04", name: "张浩", phone: "15978166543", role: "施工现场责任人", departmentId: "dept-prod", companyName: "外协二公司", status: "在职" },
  { id: "emp-05", name: "苏德坤", phone: "17777134321", role: "安全总监", departmentId: "dept-sec", companyName: "集团总部", status: "在职" }
];

const DEFAULT_ORGS: OrgUnit[] = [
  {
    id: "grp-01",
    name: "北部湾集团有限公司",
    children: [
      { id: "comp-01", name: "南宁分公司", parentId: "grp-01" },
      { id: "comp-02", name: "防城港分公司", parentId: "grp-01" },
      { id: "comp-03", name: "北海保税冷链分部", parentId: "grp-01" },
      { id: "comp-04", name: "钦州港建司", parentId: "grp-01" }
    ]
  }
];

const DEFAULT_POSITIONS: Position[] = [
  { id: "pos-01", title: "安全总监", code: "DIR-SEC", departmentId: "dept-sec", companyName: "集团总部" },
  { id: "pos-02", title: "专职安全员", code: "SPEC-SEC", departmentId: "dept-sec", companyName: "南宁分公司" },
  { id: "pos-03", title: "现场工长", code: "ENG-PROD", departmentId: "dept-prod", companyName: "防城港项目部" },
  { id: "pos-04", title: "仓管负责", code: "MAT-MGT", departmentId: "dept-mat", companyName: "北海分公司" }
];

const DEFAULT_SYSTEM_LOGS: SystemLog[] = [
  { id: "log-01", time: "2026-06-22 10:10:04", user: "张建华(安全员)", action: "上报了一般隐患工单 (ID: hz-01)", ip: "192.168.1.102" },
  { id: "log-02", time: "2026-06-22 10:12:04", user: "System(AI分析箱)", action: "检测并推送摄像头[cam-01]未戴安全帽告警记录", ip: "10.128.45.12" },
  { id: "log-03", time: "2026-06-21 15:00:00", user: "管理审核员(苏德坤)", action: "指派重大安全工单给整改责任人李朝阳", ip: "192.168.1.5" }
];

// Load or Initialize file storage DB state
let state: {
  hazards: HazardTicket[];
  cameras: Camera[];
  edgeBoxes: EdgeBox[];
  warnings: WarningEvent[];
  announcements: Announcement[];
  employees: Employee[];
  organizations: OrgUnit[];
  positions: Position[];
  logs: SystemLog[];
  smartPlans: any;
} = {
  hazards: DEFAULT_HAZARDS,
  cameras: DEFAULT_CAMERAS,
  edgeBoxes: DEFAULT_EDGE_BOXES,
  warnings: DEFAULT_WARNINGS,
  announcements: DEFAULT_ANNOUNCEMENTS,
  employees: DEFAULT_EMPLOYEES,
  organizations: DEFAULT_ORGS,
  positions: DEFAULT_POSITIONS,
  logs: DEFAULT_SYSTEM_LOGS,
  smartPlans: {
    activeAlgorithms: ["未戴安全帽", "区域闯入", "温度异常/烟火", "吸烟", "睡岗", "人脸比对"],
    confidenceThreshold: 0.85,
    nightAlgorithms: ["区域闯入", "温度异常/烟火"],
    linkageOutput: true,
    speakerWarnLevel: "一般隐患",
    warningReceivers: ["安全总监", "专职安全员"]
  }
};

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      state = { ...state, ...parsed };
    }
  } catch (err) {
    console.error("Error reading database file state, fallback in-memory:", err);
  }
}

function writeDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// Read database at launch
readDb();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // Helper logger
  const addLog = (user: string, action: string, ip: string = "127.0.0.1") => {
    const newLog: SystemLog = {
      id: "log-" + Date.now(),
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user,
      action,
      ip
    };
    state.logs.unshift(newLog);
    if (state.logs.length > 100) state.logs.pop();
    writeDb();
  };

  // --- REST APIS ---

  // Safety Cockpit stats API
  app.get("/api/safety/stats", (req, res) => {
    const totalHazards = state.hazards.length;
    const resolvedHazards = state.hazards.filter(h => h.status === "已归档").length;
    const pendingRectification = state.hazards.filter(h => h.status === "整改").length;
    const pendingReview = state.hazards.filter(h => h.status === "复查").length;
    const unresolved = totalHazards - resolvedHazards;
    const resolutionRate = totalHazards > 0 ? Number(((resolvedHazards / totalHazards) * 100).toFixed(1)) : 100.0;
    
    // Type distributions
    const countsByType: Record<string, number> = {};
    state.hazards.forEach(h => {
      // Extract general types from description keywords or title
      let category = "高空防护类";
      if (h.hazardObject.includes("电缆") || h.hazardObject.includes("配电")) category = "临时用电类";
      if (h.hazardObject.includes("机械") || h.hazardObject.includes("机械设备") || h.hazardObject.includes("井口")) category = "起重吊装机械类";
      if (h.hazardObject.includes("安全帽") || h.hazardObject.includes("工装") || h.hazardObject.includes("人员")) category = "违规着装日常类";
      if (h.hazardObject.includes("危化") || h.hazardObject.includes("消防")) category = "消防防爆类";
      
      countsByType[category] = (countsByType[category] || 0) + 1;
    });

    const highFrequencyTypes = Object.entries(countsByType).map(([name, value]) => ({ name, value }));

    // Ranking safety logs
    const ranking = [
      { name: "张建华(安全员)", count: state.hazards.filter(h => h.reporter.includes("张建华")).length || 2, score: 95 },
      { name: "肖敏(项目经理)", count: state.hazards.filter(h => h.reporter.includes("肖敏")).length || 1, score: 88 },
      { name: "李朝阳(整改责任人)", count: state.hazards.filter(h => h.rectifier?.includes("李朝阳")).length || 2, score: 92 },
      { name: "苏德坤(安环主管)", count: 3, score: 100 }
    ];

    res.json({
      totalHazards,
      resolvedHazards,
      pendingRectification,
      pendingReview,
      unresolved,
      resolutionRate,
      highFrequencyTypes,
      ranking,
      activeWarningsTicker: state.warnings.slice(0, 5)
    });
  });

  // REST API: Hazards (Tickets)
  app.get("/api/hazards", (req, res) => {
    res.json(state.hazards);
  });

  app.post("/api/hazards", (req, res) => {
    const { title, hazardObject, hazardDescription, hazardBasis, riskLevel, improvementSuggestion, location, reporter, imageUrl } = req.body;
    
    const newHazard: HazardTicket = {
      id: "hz-" + Date.now().toString().slice(-6),
      title: title || "随手拍隐患工单及安全核准",
      hazardObject: hazardObject || "施工现场物件",
      hazardDescription: hazardDescription || "",
      hazardBasis: hazardBasis || "GB50720相关标准",
      riskLevel: riskLevel || "一般隐患",
      improvementSuggestion: improvementSuggestion || "",
      location: location || "南宁总部一标段",
      status: "排查", // starts in check/pending verification phase
      reporter: reporter || "张建华(安全员)",
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500",
      history: [
        {
          status: "排查",
          operator: reporter || "施工工友",
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          comment: "由移动随手拍或手动提交录入，智能描述生成毕"
        }
      ]
    };

    state.hazards.unshift(newHazard);
    addLog(newHazard.reporter, `提交了新隐患工单: ${newHazard.title}`);
    writeDb();
    res.status(201).json(newHazard);
  });

  // Update Hazard (Workflow Status)
  app.put("/api/hazards/:id", (req, res) => {
    const { id } = req.params;
    const index = state.hazards.findIndex(h => h.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "工单未找到" });
    }

    const currentTicket = state.hazards[index];
    const { status, operator, comments, rectifier, rectificationPlan, rectificationCost, verifiedAt, retestFeedback, rectifiedImageUrl } = req.body;

    let updatedProperties: Partial<HazardTicket> = {};

    // Standard states: 排查 -> 整改 -> 复查 -> 已归档
    if (status) {
      updatedProperties.status = status;
    }

    if (comments) {
      currentTicket.history.push({
        status: status || currentTicket.status,
        operator: operator || "系统管理员",
        time: new Date().toISOString().replace('T', ' ').substring(0, 19),
        comment: comments
      });
    }

    if (rectifier) updatedProperties.rectifier = rectifier;
    if (rectificationPlan) updatedProperties.rectificationPlan = rectificationPlan;
    if (rectificationCost !== undefined) updatedProperties.rectificationCost = Number(rectificationCost);
    if (rectifiedImageUrl) updatedProperties.rectifiedImageUrl = rectifiedImageUrl;
    if (retestFeedback) updatedProperties.retestFeedback = retestFeedback;

    if (status === "整改") {
      // assigned to rectifier
    } else if (status === "复查") {
      updatedProperties.rectifiedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    } else if (status === "已归档") {
      updatedProperties.retestedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      updatedProperties.retester = operator || "复查安全员";
    }

    state.hazards[index] = { ...currentTicket, ...updatedProperties };
    addLog(operator || "管理员", `变更工单 [${id}] 状态为 ${status || currentTicket.status}`);
    writeDb();
    res.json(state.hazards[index]);
  });

  // REST API: Warnings and AI Box configuration
  app.get("/api/warnings", (req, res) => {
    res.json(state.warnings);
  });

  app.put("/api/warnings/:id", (req, res) => {
    const { id } = req.params;
    const { status, ticketId } = req.body;
    const idx = state.warnings.findIndex(w => w.id === id);
    if (idx !== -1) {
      state.warnings[idx].status = status;
      if (ticketId) state.warnings[idx].ticketId = ticketId;
      addLog("System", `安全预警告警 [${id}] 加工为 ${status}`);
      writeDb();
      res.json(state.warnings[idx]);
    } else {
      res.status(404).json({ error: "告警未找到" });
    }
  });

  // Triggering simulated alert (IoT simulation from edge)
  app.post("/api/warnings/simulate", (req, res) => {
    const { warningType, camId } = req.body;
    const cam = state.cameras.find(c => c.id === camId) || state.cameras[0];
    
    let mockImg = "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500";
    if (warningType === "未戴安全帽") mockImg = "https://images.unsplash.com/photo-1589793907316-f9401552840c?w=500";
    if (warningType === "区域闯入") mockImg = "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500";
    if (warningType === "火焰" || warningType === "烟雾" || warningType === "温度异常/烟火") mockImg = "https://images.unsplash.com/photo-1486520299386-6d106b22014b?w=500";

    const newWarning: WarningEvent = {
      id: "warn-" + Date.now().toString().slice(-4),
      deviceId: cam.id,
      deviceName: cam.name,
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      warningType: warningType || "未戴安全帽",
      targetType: warningType === "火焰" || warningType === "温度异常/烟火" ? "物体" : "人员",
      areaName: cam.location + " 安全监控区",
      confidence: Number((85 + Math.random() * 14).toFixed(1)),
      imageUrl: mockImg,
      status: "pending"
    };

    state.warnings.unshift(newWarning);
    addLog("AI边缘盒子", `在 ${cam.name} 检测到 [${warningType}] 事件，置信度 ${newWarning.confidence}%`);
    writeDb();
    res.json(newWarning);
  });

  app.get("/api/smart-plans", (req, res) => {
    res.json(state.smartPlans);
  });

  app.put("/api/smart-plans", (req, res) => {
    state.smartPlans = { ...state.smartPlans, ...req.body };
    addLog("管理员", "更新边缘计算盒子智能策略规则配置");
    writeDb();
    res.json({ success: true, payload: state.smartPlans });
  });

  // REST API: Devices
  app.get("/api/cameras", (req, res) => {
    res.json(state.cameras);
  });

  app.post("/api/cameras", (req, res) => {
    const newCam: Camera = {
      id: "cam-" + Date.now().toString().slice(-4),
      name: req.body.name || "新增摄像机点位",
      code: req.body.code || "CG-CG-NEW",
      location: req.body.location || "一标段大门边",
      status: "online",
      project: req.body.project || "南宁北港智慧新城"
    };
    state.cameras.push(newCam);
    addLog("管理员", `添加了新视频点位: ${newCam.name}`);
    writeDb();
    res.json(newCam);
  });

  app.get("/api/edge-boxes", (req, res) => {
    res.json(state.edgeBoxes);
  });

  // REST API: Enterprise Org, Positions, Employees
  app.get("/api/orgs", (req, res) => {
    res.json(state.organizations);
  });

  app.get("/api/employees", (req, res) => {
    res.json(state.employees);
  });

  app.post("/api/employees", (req, res) => {
    const newEmp: Employee = {
      id: "emp-" + Date.now().toString().slice(-4),
      name: req.body.name,
      phone: req.body.phone,
      role: req.body.role || "普通职工",
      departmentId: req.body.departmentId || "dept-prod",
      companyName: req.body.companyName || "南宁分公司",
      status: "在职"
    };
    state.employees.push(newEmp);
    addLog("管理员", `添加了工友/职工: ${newEmp.name}`);
    writeDb();
    res.json(newEmp);
  });

  app.get("/api/positions", (req, res) => {
    res.json(state.positions);
  });

  // Announcements
  app.get("/api/announcements", (req, res) => {
    res.json(state.announcements);
  });

  app.post("/api/announcements", (req, res) => {
    const newAnn: Announcement = {
      id: "ann-" + Date.now().toString().slice(-4),
      title: req.body.title,
      content: req.body.content,
      sender: req.body.sender || "集团安防科",
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: req.body.status || "已下发",
      targets: req.body.targets || ["全员"]
    };
    state.announcements.unshift(newAnn);
    addLog("管理员", `发布通知公告: ${newAnn.title}`);
    writeDb();
    res.json(newAnn);
  });

  // REST API: Logs
  app.get("/api/logs", (req, res) => {
    res.json(state.logs);
  });

  // --- MULTIMODAL AI SUI-SHOU-PAI ANALYZE ROUTE ---
  // Large Model safety parsing route using clean server-side @google/genai
  app.post("/api/ai-analyze", async (req, res) => {
    const { imageBase64, customPrompt } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing image content" });
    }

    addLog("移动随手拍", "启动多模态安全智能大模型分析中...");

    // Check if key is available, or fallback to mock simulation
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.log("No valid GEMINI_API_KEY found, running realistic sandbox simulation.");
      
      // Simulate analysis depending on prompt or custom prompt to be extremely accurate
      const textPrompt = (customPrompt || "").toLowerCase();
      let simulatedResult = {
        hazardObject: "脚手架/临边防护栏杆",
        hazardDescription: "作业区主架体扣件出现断裂与锈蚀，下倾角超标15度，底座防滑木垫板缺损，周边散落松散碎石且防护吊袋未捆扎紧密。",
        hazardBasis: "《建筑施工安全检查标准》JGJ 59-2011 第五临边与洞口防护条目，以及《安全生产法》第45条关于劳保设施和设备点面巡查标准。",
        riskLevel: "重大隐患",
        improvementSuggestion: "立即拉设警戒警戒带，封锁斜道，搭设加固撑杆或重新调紧钢丝绳拉杆、排干基坑底部滞水，并在24小时内调派持证架子工进行重装验收。"
      };

      if (textPrompt.includes("消防") || textPrompt.includes("灭火")) {
        simulatedResult = {
          hazardObject: "消防通道及高危仓储库区灭火器配置",
          hazardDescription: "仓库南侧主安全通道交叉口通道内杂乱堆放了大木枋及破损安全网，导致消防主通道净宽窄于1.2米，两个干粉灭火器过期欠压，且缺损吊牌。",
          hazardBasis: "《建设工程施工现场消防安全技术规范》GB 50720 第5.1.2条：高危险作业区消防通道净宽不得小于3.5米，并保障全天候畅通无遮挡。",
          riskLevel: "重大隐患",
          improvementSuggestion: "迅速组织班组长对堆置杂物开展一次清理，保障疏散标志可见；同时对欠压灭火器做批量充装换新，并在移动端工单附巡检月挂卡拍照。"
        };
      } else if (textPrompt.includes("用电") || textPrompt.includes("电线") || textPrompt.includes("电")) {
        simulatedResult = {
          hazardObject: "现场级配电箱及一箱一端漏电保护",
          hazardDescription: "二级配电箱舱门把手生锈脱扣、没有防护挂锁，箱门内有一股非橡胶护套多色电线在未经防水穿管的状况下顺地敷设，存在直触水沟导致群伤危险。",
          hazardBasis: "《施工现场临时用电安全技术规范》JGJ 46-2005 第8.1.3条：配电箱、开关箱应装设端正、牢固。现场移动式箱具下底面需距地大于1.4米并做接地保护。",
          riskLevel: "重大隐患",
          improvementSuggestion: "电工组长在1小时内对箱体加锁防碰、将拖地飞线悬空架设并选用PVC防护重包导管，实行‘一机、一闸、一漏、一箱’强硬规范。"
        };
      } else if (textPrompt.includes("安全帽") || textPrompt.includes("人")) {
        simulatedResult = {
          hazardObject: "施工现场劳保穿戴(工人未系安全帽带)",
          hazardDescription: "工人攀登高空操作架在搬运短钢管，虽佩戴了黄色安全帽，但为了方便通气未解系防坠下鄂绳，且操作中重心偏移。",
          hazardBasis: "《安全生产法》第四十二条，及工程集团《现场全员合规及着装通报细则》：进入施工作业边界不服从穿戴约束者作警告。首犯进行当面整训教育。",
          riskLevel: "一般隐患",
          improvementSuggestion: "安排专职安全员张建华进行现场喊话，要求工人暂停手头工序，解松帽子防坠下颚拉到安全位置拉紧后方可准予继续进行。"
        };
      }

      // Add delay to show natural model execution speed (expect <15s per prompt)
      await new Promise(resolve => setTimeout(resolve, 1500));
      addLog("移动随手拍", `AI 沙盘模拟大模型识别完成 (置信度 92%)`);
      return res.json(simulatedResult);
    }

    try {
      console.log("Initializing Gemini Client...");
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      console.log("Preparing prompt parts...");
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      
      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      };

      const customPromptText = customPrompt ? `\n附加要求：重点关注：${customPrompt}` : "";
      
      const systemPrompt = `你是一位专门对建筑施工现场进行安全检查的多模态智能专家。
请仔细评估拍摄到的隐藏安全隐患图片（可能包含：未佩戴安全帽/反光背心等工人违规、攀爬脚手架、消防栓遮挡损坏、飞线拉扯私接、钢筋裸露未加防护、吊装边界无警戒、深基坑未护壁、高空网洞破损、睡岗等）。
找出图中最主要的1个安全隐患，按照要求以高度清晰、专业和富有针对性的语言生成中文报告，并依照指定的JSON结构精确返回对应的属性。`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          imagePart,
          { text: `分析这幅施工画面中有何安全隐患。请务必使用中文详细回答。${customPromptText}` }
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hazardObject: {
                type: Type.STRING,
                description: "隐患对象：指出图片中存在风险的具体目标物（如：配电箱、脚手架、施工升降机拉栏、工人头部等）"
              },
              hazardDescription: {
                type: Type.STRING,
                description: "隐患描述：用专业、精准的自然语言清晰描述图片中呈现的人员违规、环境异常或设备隐患情况"
              },
              hazardBasis: {
                type: Type.STRING,
                description: "隐患判断依据：参照国家现行安全法律法规、项目施工规范或行业标准条款（如《JGJ 59-2011》、行业强条条文条目）"
              },
              riskLevel: {
                type: Type.STRING,
                description: "风险等级：必须是'一般隐患'或者是'重大隐患'"
              },
              improvementSuggestion: {
                type: Type.STRING,
                description: "改善建议：提供针对此隐患极具可操作性的纠正、整改手段、日常教育或防护加固意见"
              }
            },
            required: ["hazardObject", "hazardDescription", "hazardBasis", "riskLevel", "improvementSuggestion"]
          }
        }
      });

      console.log("Gemini API call success.");
      const resultText = response.text || "";
      const resultObj = JSON.parse(resultText.trim());
      
      addLog("移动随手拍", `AI 大模型成功解析图片，识别对象: ${resultObj.hazardObject}`);
      return res.json(resultObj);

    } catch (e: any) {
      console.error("Gemini Multi-modal Analyzer error:", e);
      addLog("移动随手拍", `AI 智能引擎解析出错 fallback: ${e.message || e}`);
      return res.status(500).json({
        error: "AI 识别失败：" + (e.message || "未知多模态大模型错误"),
        fallbackMock: {
          hazardObject: "施工现场临近交叉口",
          hazardDescription: "图像加载或AI分析解析超时。现场提示：可能存在安全帽系带、通道未畅等综合风险，请核准后再登记入单。",
          hazardBasis: "《安全生产法》及施工管理规范",
          riskLevel: "一般隐患",
          improvementSuggestion: "请现场安检管理人员进行口头叮嘱、现场整改并在系统补登。"
        }
      });
    }
  });

  // --- VITE MIDDLEWARE OR STATIC SERVING ---

  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Production static serving config active.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booted successfully on port ${PORT}`);
    console.log(`Open preview at http://localhost:${PORT}`);
  });
}

startServer();
