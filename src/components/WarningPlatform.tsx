import React, { useState, useEffect, useRef } from "react";
import { 
  Play, ShieldAlert, Sliders, Database, Cpu, Image, Camera as CameraIcon, 
  Trash2, Plus, Check, Settings, ShieldCheck, HelpCircle, HardDrive, 
  RefreshCw, CheckCircle, AlertOctagon, RefreshCcw, BellRing, PhoneCall, Volume2, Users, FileBarChart, Clock
} from "lucide-react";
import { 
  fetchWarnings, updateWarning, simulateWarning, fetchSmartPlans, 
  updateSmartPlans, fetchCameras, createHazard, fetchLogs
} from "../lib/api";
import { WarningEvent, Camera, SystemLog } from "../types";

const ALL_ALGORITHMS = [
  { id: "helmet", name: "未佩戴安全帽", desc: "施工进场工人头部劳保自核", category: "人员安全违规" },
  { id: "vest", name: "未系反光背心", desc: "高能见度工装穿着自动评估", category: "人员安全违规" },
  { id: "smoke", name: "吸烟识别", desc: "高危罐区与禁用烟火过道巡检", category: "防火安全防爆" },
  { id: "sleep", name: "岗哨睡岗识别", desc: "中控室、大门保安睡岗脱岗监控", category: "岗位合规自控" },
  { id: "phone", name: "玩手机/打电话", desc: "特种移动作业时看手机警示", category: "岗位合规自控" },
  { id: "fire", name: "明火/火焰识别", desc: "废料加工区及材料仓火迹实时追踪", category: "大环境灾害防预" },
  { id: "smoke_env", name: "烟雾产生检测", desc: "区域重型火点早期警讯拉闸联动", category: "大环境灾害防预" },
  { id: "gate_intrusion", name: "区域闯入识别", desc: "深夜基坑及高压试验室越界阻断", category: "越界与高空安全" },
  { id: "climb_over", name: "跨越围墙/攀爬", desc: "危险点防范周界及围网翻过警报", category: "越界与高空安全" },
  { id: "barrier_cross", name: "跨越栏杆识别", desc: "塔吊防滑斜道临边通道不规范跨栏", category: "越界与高空安全" },
  { id: "extinguisher", name: "未配灭火器识别", desc: "动火现场缺少灭火防护箱自动预警", category: "防火安全防爆" },
  { id: "overcrowd", name: "区域人数超限", desc: "受限空间或脚手吊盘承载量越边界", category: "综合容量自控" },
  { id: "mask", name: "口罩未戴识别", desc: "无尘油漆加工车间防护呼吸网拦截", category: "人员安全违规" },
  { id: "fall", name: "人员摔倒检测", desc: "现场及生活区老人吊钩人员滑倒拉闸", category: "综合容量自控" }
];

export default function WarningPlatform({ onRefreshStats }: { onRefreshStats: () => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'realtime' | 'smart_config' | 'resources' | 'system_admin'>('realtime');
  
  // States for Realtime
  const [warnings, setWarnings] = useState<WarningEvent[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterProject, setFilterProject] = useState("all");
  const [filterType, setFilterType] = useState("all");
  
  // Custom dialog state for converting warnings to Hazard Work Tickets
  const [showConvertModal, setShowConvertModal] = useState<WarningEvent | null>(null);
  const [convertTitle, setConvertTitle] = useState("");
  const [convertLocation, setConvertLocation] = useState("");
  const [convertRisk, setConvertRisk] = useState<'一般隐患' | '重大隐患'>('一般隐患');
  const [convertRec, setConvertRec] = useState("");

  // States for IoT simulator
  const [selectedSimType, setSelectedSimType] = useState("未戴安全帽");
  const [selectedSimCamId, setSelectedSimCamId] = useState("");
  const [simulationLoading, setSimulationLoading] = useState(false);

  // States for Intelligent Config
  const [smartPlans, setSmartPlans] = useState<any>(null);
  const [smartSaveSuccess, setSmartSaveSuccess] = useState(false);

  // States for Resource Management (8 second-menu tabs)
  const [resourceSubTab, setResourceSubTab] = useState<number>(0); // 0 to 7
  const [mockFiles, setMockFiles] = useState<Array<{name: string, size: string, uploadTime: string}>>([
    { name: "禁止吸烟区域中控播报.mp3", size: "1.4 MB", uploadTime: "2026-06-18 10:20" },
    { name: "塔吊闯入高声警告防坠.mp3", size: "940 KB", uploadTime: "2026-06-20 15:44" }
  ]);
  const [mockClothes, setMockClothes] = useState([
    { id: "c-01", type: "普通劳务蓝色工服", verifiedCount: 142, status: "已绑定测试" },
    { id: "c-02", type: "吊装红黄色警示带", verifiedCount: 38, status: "已绑定测试" }
  ]);
  const [mockWrongEvents, setMockWrongEvents] = useState([
    { id: "wb-1", device: "1号楼南侧塔吊", time: "2026-06-15 14:10", type: "反光背心", reason: "强光反射金属网被误认为衣服" },
    { id: "wb-2", device: "危化品室出入口", time: "2026-06-19 11:42", type: "吸烟识别", reason: "工人吃冰棍产生的白气误判" }
  ]);

  // States for System Admin View
  const [sysLogs, setSysLogs] = useState<SystemLog[]>([]);

  // Sound linkage simulation
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [warnsData, camsData, plansData, logsData] = await Promise.all([
        fetchWarnings(),
        fetchCameras(),
        fetchSmartPlans(),
        fetchLogs()
      ]);
      setWarnings(warnsData);
      setCameras(camsData);
      setSmartPlans(plansData);
      setSysLogs(logsData);
      if (camsData.length > 0) {
        setSelectedSimCamId(camsData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // IoT Simulation handler
  const handleTriggerSimulation = async () => {
    if (!selectedSimCamId || !selectedSimType) return;
    try {
      setSimulationLoading(true);
      const newWarning = await simulateWarning(selectedSimType, selectedSimCamId);
      // Immediately reload warnings and logs
      const [warnsData, logsData] = await Promise.all([
        fetchWarnings(),
        fetchLogs()
      ]);
      setWarnings(warnsData);
      setSysLogs(logsData);
      onRefreshStats(); // update parent metrics
      
      // Simulate audio play popup if configuration linkage is active
      if (smartPlans?.linkageOutput) {
        alert(`🚨 【现场边缘扬声器联动报警】\n监测防区：${newWarning.areaName}\n现场广播触发语音：\"正在进行AI抓拍！请立即纠正——[${newWarning.warningType}]！\"`);
      }
    } catch (e) {
      console.error("Simulation error", e);
    } finally {
      setSimulationLoading(false);
    }
  };

  // Convert warning event to a formal Hazard process工单
  const openConvertModal = (w: WarningEvent) => {
    setConvertTitle(`AI视频拦截：[${w.warningType}]隐患联动现场排查`);
    setConvertLocation(w.areaName);
    setConvertRisk(w.warningType === "温度异常/烟火" || w.warningType === "区域闯入" ? "重大隐患" : "一般隐患");
    setConvertRec(`经边缘盒子抓拍触发：${w.deviceName}在${w.time}拦截到[${w.warningType}]，图像识别置信度${w.confidence}%。需班组长立刻前往该点核查工服、保护设施，落实即查即改。`);
    setShowConvertModal(w);
  };

  const handleCreateConvertedHazard = async () => {
    if (!showConvertModal) return;
    try {
      await createHazard({
        title: convertTitle,
        hazardObject: `${showConvertModal.warningType}行为体`,
        hazardDescription: convertRec,
        hazardBasis: `国家规范及北港建司安全控制强条。AI设备标识为：${showConvertModal.deviceId}`,
        riskLevel: convertRisk,
        improvementSuggestion: "纠正现场人员高危行为，重设警示网面标志，通过上传工况整改后照片进行退工挂单。",
        location: convertLocation,
        reporter: "AI视频监控分机",
        imageUrl: showConvertModal.imageUrl
      });

      // Update warning status in database
      await updateWarning(showConvertModal.id, { status: 'converted' });
      
      // Reload warnings & logs
      const [warnsData, logsData] = await Promise.all([
        fetchWarnings(),
        fetchLogs()
      ]);
      setWarnings(warnsData);
      setSysLogs(logsData);
      
      setShowConvertModal(null);
      onRefreshStats();
      alert("🎉 隐患工单派发成功！即将流转至PC端及钉钉移动端‘整改流程责任人’手头进行闭环处理。");
    } catch (e) {
      console.error(e);
    }
  };

  const handleIgnoreWarning = async (w: WarningEvent) => {
    if (!window.confirm("确定要忽略或解除该条AI抓拍摄像报警吗？这将在日志中被归类。")) return;
    try {
      await updateWarning(w.id, { status: "ignored" });
      const warnsData = await fetchWarnings();
      setWarnings(warnsData);
      onRefreshStats();
    } catch (e) {
      console.error(e);
    }
  };

  // Update Config Plans
  const handleSaveSmartPlans = async () => {
    try {
      await updateSmartPlans(smartPlans);
      setSmartSaveSuccess(true);
      setTimeout(() => setSmartSaveSuccess(false), 3000);
      onRefreshStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMockFile = () => {
    const fn = prompt("请输入上传的防突播报音频文件名(.mp3/.wav):", "临边高危越界喊话.mp3");
    if (fn) {
      setMockFiles([...mockFiles, { name: fn, size: "1.1 MB", uploadTime: "今天刚上传" }]);
    }
  };

  const handlePlayMockAudio = (name: string) => {
    if (audioPreviewPlaying === name) {
      setAudioPreviewPlaying(null);
    } else {
      setAudioPreviewPlaying(name);
      setTimeout(() => setAudioPreviewPlaying(null), 3000);
    }
  };

  // Filtering warning list
  const filteredWarnings = warnings.filter(w => {
    if (filterType !== "all" && w.warningType !== filterType) return false;
    return true;
  });

  return (
    <div className="bg-[#121620] border border-gray-800 rounded-xl p-6 shadow-sm min-h-[500px]">
      
      {/* 预警平台顶部标题与导航 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-5 border-b border-gray-800 gap-4 mb-6">
        <div>
          <h2 className="text-white text-lg font-bold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" /> 
            安全预警与智能分析平台
          </h2>
          <p className="text-xs text-gray-400 mt-1">依托边缘计算AI盒子实现14+高频建筑工地危险源多并发实时辨析与联动预警体系</p>
        </div>

        {/* 导航按钮 */}
        <div className="flex flex-wrap gap-1.5 bg-[#171c2a] p-1 rounded-lg border border-gray-800/80">
          <button 
            onClick={() => setActiveSubTab('realtime')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition ${activeSubTab === 'realtime' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            实时预览 & IoT模拟
          </button>
          <button 
            onClick={() => setActiveSubTab('smart_config')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition ${activeSubTab === 'smart_config' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            智能联动配置
          </button>
          <button 
            onClick={() => setActiveSubTab('resources')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition ${activeSubTab === 'resources' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            边缘资源管理(8)
          </button>
          <button 
            onClick={() => setActiveSubTab('system_admin')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition ${activeSubTab === 'system_admin' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            系统运维审计
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ONLINE PREVIEW & IOT SIMULATION */}
      {activeSubTab === 'realtime' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Left panel: Simulated camera alerts controller (IoT Simulator) */}
          <div className="xl:col-span-1 bg-[#161c28] border border-gray-800/80 rounded-xl p-4 font-sans">
            <div className="border-b border-gray-800 pb-3 mb-4">
              <span className="text-indigo-400 font-bold block text-xs tracking-wider uppercase mb-1">IoT 边缘计算自检工具</span>
              <h3 className="text-white text-sm font-semibold">17类AI识别事件现场调试</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs block mb-1.5 font-medium">1. 选择被测场景算法</label>
                <select 
                  value={selectedSimType}
                  onChange={(e) => setSelectedSimType(e.target.value)}
                  className="w-full bg-[#1e2535] border border-gray-800 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="未戴安全帽">未配戴安全帽 (人员未戴安全帽识别)</option>
                  <option value="未系反光背心">未系反光背心 (人员进入区域未穿背心)</option>
                  <option value="吸烟">吸烟行为 (高危禁烟区/易燃材料库)</option>
                  <option value="睡岗">睡岗识别 (保安岗值班状态识别)</option>
                  <option value="玩手机">玩手机行为识别</option>
                  <option value="打电话">打电话行为识别</option>
                  <option value="火焰">基于视觉的火焰识别 (机房/废料堆)</option>
                  <option value="烟雾">基于视觉的浓烟烟雾识别</option>
                  <option value="区域闯入">区域闯入 (防范电子栅网入侵检测)</option>
                  <option value="攀爬">人员攀爬行为检测</option>
                  <option value="跨越栏杆">跨越栏杆行为识别</option>
                  <option value="跨越围墙">跨越围墙攀爬检测</option>
                  <option value="消防通道占用">消防通道占用识别 (通道口车辆/建材堆放)</option>
                  <option value="灭火器识别">区域灭火器缺配警示</option>
                  <option value="超人数识别">区域作业超限定人数检测</option>
                  <option value="人员摔倒识别">施工高危人员摔倒检测</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs block mb-1.5 font-medium">2. 关联被测试视频机</label>
                <select 
                  value={selectedSimCamId}
                  onChange={(e) => setSelectedSimCamId(e.target.value)}
                  className="w-full bg-[#1e2535] border border-gray-800 text-white text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  {cameras.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.location})</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-[#1d2434] rounded-lg border border-dashed border-indigo-950 text-[11px] text-gray-400 space-y-1.5">
                <span className="text-indigo-300 font-semibold block">自测反馈模式说明：</span>
                <p>点击按钮后，边缘AI算力盒将接收虚拟测试流，即时向安全系统投射抓拍记录。若激活下方联动声光，系统也会在主视界面联动反应。</p>
              </div>

              <button 
                onClick={handleTriggerSimulation}
                disabled={simulationLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {simulationLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-white" />}
                提交现场事件自测预警
              </button>
            </div>
          </div>

          {/* Right panel: Active evidence logging list */}
          <div className="xl:col-span-3 space-y-4">
            
            {/* Filter bar */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-[#151c27] p-3 rounded-lg border border-gray-800 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">分类检索:</span>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-[#1e2535] border border-gray-800 text-white text-xs rounded-md px-2 py-1 outline-none"
                >
                  <option value="all">所有预警类别</option>
                  <option value="未戴安全帽">未戴安全帽</option>
                  <option value="吸烟">吸烟行为</option>
                  <option value="区域闯入">越界闯入</option>
                  <option value="温度异常/烟火">火焰与烟雾</option>
                </select>
              </div>

              <span className="text-xs text-indigo-400 font-mono font-medium">当前查询范围内共侦测到 {filteredWarnings.length} 件AI拦截物证</span>
            </div>

            {/* Grid of alarms cards */}
            {filteredWarnings.length === 0 ? (
              <div className="text-center py-16 text-gray-500 border border-dashed border-gray-800 rounded-xl">
                <AlertOctagon className="h-10 w-10 text-gray-600 mx-auto mb-2" />
                <p className="text-sm">没有匹配此查询分类的未处理警告物证</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                {filteredWarnings.map((w) => (
                  <div key={w.id} className="bg-[#151a24] border border-gray-800 rounded-xl overflow-hidden shadow-xs hover:border-gray-700 transition flex flex-col md:flex-row">
                    <div className="md:w-1/3 h-36 md:h-auto bg-gray-900 relative shrink-0">
                      <img 
                        src={w.imageUrl} 
                        alt="Evidence Capture" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-red-600 text-[10px] font-bold text-white px-2 py-0.5 rounded border border-red-500 shadow-sm font-mono">
                        置信 {w.confidence}%
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="bg-red-505/10 text-red-400 text-xs font-bold border border-red-900/60 px-2 py-0.5 rounded-sm">
                            {w.warningType}
                          </span>
                          <span className="text-gray-500 text-[10px] font-mono">{w.time}</span>
                        </div>
                        <h4 className="text-white text-xs font-semibold mb-1 truncate">{w.deviceName}</h4>
                        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">捕捉区域：{w.areaName}。抓拍到疑似{w.warningType}高危行为标志物，边缘算力机已标记防突证据。</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-850/60 flex items-center justify-between">
                        <div>
                          {w.status === "pending" && <span className="text-amber-500 text-[10px] flex items-center font-semibold gap-1">● 待审核</span>}
                          {w.status === "converted" && <span className="text-emerald-400 text-[10px] flex items-center font-semibold gap-1">✔ 已流转工单</span>}
                          {w.status === "ignored" && <span className="text-gray-500 text-[10px] flex items-center font-semibold gap-1">● 已忽略</span>}
                        </div>

                        <div className="flex space-x-1.5">
                          {w.status === "pending" && (
                            <>
                              <button 
                                onClick={() => handleIgnoreWarning(w)}
                                className="px-2 py-1 text-gray-400 hover:text-red-400 bg-gray-800 rounded text-[10px] font-semibold transition cursor-pointer"
                              >
                                忽略/误报
                              </button>
                              <button 
                                onClick={() => openConvertModal(w)}
                                className="px-2 py-1 bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white rounded text-[10px] font-semibold border border-red-700/60 transition cursor-pointer flex items-center gap-0.5"
                              >
                                派发闭环工单 →
                              </button>
                            </>
                          )}
                          {w.status === "converted" && (
                            <span className="text-[10px] text-indigo-400 font-semibold font-mono">
                              工单: {w.ticketId || "已挂起流水"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-TAB 2: INTELLIGENT LINKAGE SCHEDULE CONFIG */}
      {activeSubTab === 'smart_config' && smartPlans && (
        <div className="space-y-6 max-w-4xl mx-auto font-sans">
          
          <div className="bg-[#161c28] border border-gray-800 rounded-xl p-5">
            <h3 className="text-white text-sm font-semibold mb-4 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-400" /> 远程置信度与模型热加载控制中心
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-300 font-medium">全场景统一告警过滤置信度阈值 (Confidence Threshold)</span>
                  <span className="text-sm font-mono font-bold text-indigo-400">{(smartPlans.confidenceThreshold * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="0.95" 
                  step="0.05"
                  value={smartPlans.confidenceThreshold}
                  onChange={(e) => setSmartPlans({...smartPlans, confidenceThreshold: parseFloat(e.target.value)})}
                  className="w-full accent-indigo-500 h-1 bg-[#1e2535] rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">增加置信度可以减少大环境阴天带来的光学误报，降低置信度有助于提升高遮挡高危行为下的捕捉精度。</span>
              </div>

              {/* Toggle algorithms enabled */}
              <div>
                <span className="text-xs text-gray-300 font-medium block mb-2">14类边缘盒子集成场景模型启停配置 (支持远程无感热加载)</span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ALL_ALGORITHMS.map(algo => {
                    const active = smartPlans.activeAlgorithms.includes(algo.name);
                    return (
                      <div 
                        key={algo.id} 
                        onClick={() => {
                          let updated = [...smartPlans.activeAlgorithms];
                          if (active) {
                            updated = updated.filter((x: string) => x !== algo.name);
                          } else {
                            updated.push(algo.name);
                          }
                          setSmartPlans({...smartPlans, activeAlgorithms: updated});
                        }}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition select-none flex items-center justify-between ${
                          active ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-200" : "bg-[#1d2435] border-gray-800 hover:border-gray-700 text-gray-400"
                        }`}
                      >
                        <div>
                          <span className="text-[11px] font-bold block">{algo.name}</span>
                          <span className="text-[9px] opacity-70 block truncate max-w-[150px]">{algo.desc}</span>
                        </div>
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${active ? "bg-indigo-500 border-indigo-400 text-white" : "border-gray-700"}`}>
                          {active && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Time arming and linkage config */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#161c28] border border-gray-800 rounded-xl p-5">
              <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" /> 昼夜生效生效时间策略窗口
              </h3>
              
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-[#1e2535] rounded-xl border border-gray-800">
                  <span className="text-white font-medium block mb-1">【白天计划】(06:00 - 18:00)全功能防空</span>
                  <p className="text-gray-400 text-[10px]">加载人员违装、未戴安全帽、未系背心、吸烟、打电话等全部日常行为合规分析模型，由集团中控轮询跟催。</p>
                </div>

                <div className="p-3 bg-[#1e2535] rounded-xl border border-gray-800">
                  <span className="text-white font-medium block mb-1">【夜间防御计划】(18:00 - 次日06:00)</span>
                  <p className="text-gray-400 text-[10px]">自动热缩减日常行为算法，挂起周界入侵、攀爬围栏、火焰检测，启动无人值守自闭环声光驱逐联动，保障空档期安全。</p>
                </div>
              </div>
            </div>

            <div className="bg-[#161c28] border border-gray-800 rounded-xl p-5">
              <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <BellRing className="h-4 w-4 text-indigo-400" /> AI预警联动触发自动执行机制
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded hover:bg-[#1e2535]/30">
                  <div>
                    <span className="text-xs text-gray-200 font-medium block">一键触发联轴现场防护声光报警</span>
                    <span className="text-[10px] text-gray-500 block">AI触发后，防段路网扬声器自动喊话，红黄警示闪烁 15s</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={smartPlans.linkageOutput}
                    onChange={(e) => setSmartPlans({...smartPlans, linkageOutput: e.target.checked})}
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded hover:bg-[#1e2535]/30">
                  <div>
                    <span className="text-xs text-gray-200 font-medium block">关联断网或非法喷淋设备开关量开关</span>
                    <span className="text-[10px] text-gray-500 block">自动将火痕识别判定发送给配电房的物理闭锁干涉</span>
                  </div>
                  <input 
                    type="checkbox" 
                    defaultChecked={true}
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded hover:bg-[#1e2535]/30">
                  <div>
                    <span className="text-xs text-gray-200 font-medium block">双层钉钉移动工单逐级推顶</span>
                    <span className="text-[10px] text-gray-500 block">超时15分钟不看报警时通过短信进行群发警示催办</span>
                  </div>
                  <input 
                    type="checkbox" 
                    defaultChecked={true}
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleSaveSmartPlans}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-6 py-2 rounded-lg transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              保存并热加载至AI边缘盒子组件
            </button>
          </div>

          {smartSaveSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-900/60 p-3 rounded-lg text-emerald-400 text-center text-xs">
              ✔ 边缘计算规则配置文件已保存并动态热更新到 CPU/NPU 缓存池，分析引擎无须关断即刻生效。
            </div>
          )}

        </div>
      )}

      {/* SUB-TAB 3: EDGE RESOURCES DATABASE (8二级功能) */}
      {activeSubTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-sans">
          
          {/* Sub menu selector for resources */}
          <div className="md:col-span-1 bg-[#151a24] border border-gray-800/80 rounded-xl p-3 shrink-0">
            <div className="text-xs text-indigo-400 font-bold px-2 py-1 mb-2">二级功能库 (共八项子业务)</div>
            <div className="space-y-1">
              {[
                "人员管理 (白/黑人脸库)",
                "工服库管理 (合规检验)",
                "设备管理 (相机监测配表)",
                "算法仓管理 (启停器盒)",
                "授权管理 (路数流管控)",
                "容器管理 (算力配额网)",
                "文件管理 (音频对讲库)",
                "误报库管理 (真实性剔除)"
              ].map((name, index) => (
                <button 
                  key={index}
                  onClick={() => setResourceSubTab(index)}
                  className={`w-full text-left p-2 rounded-lg text-xs font-medium cursor-pointer transition ${
                    resourceSubTab === index ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500" : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Sub menu details body */}
          <div className="md:col-span-3 bg-[#161c28] border border-gray-800 rounded-xl p-5 min-h-[300px]">
            
            {/* Tab 0: 人员管理 */}
            {resourceSubTab === 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white text-xs font-bold">白名单及黑名单动态人脸数据库</h4>
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer">
                    <Plus className="h-3 w-3" /> 新增比对肖像
                  </button>
                </div>
                
                <table className="w-full text-left text-xs bg-gray-900/40 rounded-lg overflow-hidden border border-gray-800">
                  <thead className="bg-[#1f293d]/50 text-gray-400">
                    <tr>
                      <th className="p-2.5">类别</th>
                      <th className="p-2.5">人像姓名</th>
                      <th className="p-2.5">识别特征/黑名单原因</th>
                      <th className="p-2.5">在线状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-gray-300 font-sans">
                    <tr>
                      <td className="p-2.5"><span className="bg-emerald-500/10 border border-emerald-950 text-emerald-400 px-1 py-0.5 rounded text-[10px]">白名单</span></td>
                      <td className="p-2.5">苏德坤</td>
                      <td className="p-2.5">集团总部专职安全主管（直通过卡免帽报警）</td>
                      <td className="p-2.5 text-emerald-400">活跃在场</td>
                    </tr>
                    <tr>
                      <td className="p-2.5"><span className="bg-red-500/10 border border-red-950 text-red-400 px-1 py-0.5 rounded text-[10px]">黑名单</span></td>
                      <td className="p-2.5">吴金海</td>
                      <td className="p-2.5">无操作资质禁入高压室（AI自动报警越界）</td>
                      <td className="p-2.5 text-gray-500">外部未入</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 1: 工服库管理 */}
            {resourceSubTab === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white text-xs font-bold">工服合规穿样本库管理</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">支持各施工队在边缘AI机上自注册合规范本</p>
                  </div>
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer">
                    <Plus className="h-3 w-3" /> 自主绑定新工装样
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {mockClothes.map((c, i) => (
                    <div key={i} className="p-3 bg-gray-900/40 rounded-lg border border-gray-800 flex justify-between items-center">
                      <div>
                        <span className="text-white font-medium text-xs block">{c.type}</span>
                        <span className="text-[10px] text-gray-500 font-mono block mt-1">深度学习合规比对样本数: {c.verifiedCount}张</span>
                      </div>
                      <span className="bg-[#1f293d] text-indigo-400 text-[10px] px-2 py-0.5 rounded font-medium">{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: 设备管理 */}
            {resourceSubTab === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white text-xs font-bold">接入相机自适应点位与参数绑定</h4>
                  <span className="text-[10px] text-gray-500">动态监控IP冲突与网络抓包诊断</span>
                </div>
                <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-lg text-xs space-y-2">
                  <div className="flex justify-between pb-2 border-b border-gray-800 text-gray-400">
                    <span>摄像点位名称</span>
                    <span>解析流通道RTMP/RTSP</span>
                    <span>设备响应延迟</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">1号楼南侧塔吊</span>
                    <span className="font-mono text-gray-500">rtsp://10.128.45.12/stream1</span>
                    <span className="text-emerald-400 font-mono">15ms (优)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white">B区材料库门口</span>
                    <span className="font-mono text-gray-500">rtsp://10.128.45.12/stream3</span>
                    <span className="text-emerald-400 font-mono">22ms (普)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: 算法仓管理 */}
            {resourceSubTab === 3 && (
              <div className="space-y-4">
                <h4 className="text-white text-xs font-bold">算法仓隔离容器启停(Hot Loading)</h4>
                <div className="space-y-3 font-sans">
                  <div className="flex items-center justify-between p-2.5 bg-gray-900/50 rounded-lg border border-gray-800">
                    <div>
                      <span className="text-white text-xs font-bold block">helmet-analytics-pkg (安全帽分析包)</span>
                      <span className="text-[10px] text-gray-500 block font-mono">v3.4.1 · 运行于 8路 通配并发</span>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-950 font-semibold">运行中</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-gray-900/50 rounded-lg border border-gray-800">
                    <div>
                      <span className="text-white text-xs font-bold block">fire-smoke-detect-heavy (重度防火烟分析包)</span>
                      <span className="text-[10px] text-gray-500 block font-mono">v1.2.0 · 运行于 4路 隔离防区</span>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-950 font-semibold">运行中</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-gray-900/50 rounded-lg border border-gray-800">
                    <div>
                      <span className="text-white text-xs font-bold block">mask-health-detector (防尘口罩识别)</span>
                      <span className="text-[10px] text-gray-500 block font-mono">v1.0.5 · 热休眠模式已锁</span>
                    </div>
                    <button className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-[10px] px-2 py-1 rounded cursor-pointer">开启算法容器</button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: 授权管理 */}
            {resourceSubTab === 4 && (
              <div className="space-y-4">
                <h4 className="text-white text-xs font-bold">边缘硬件算力流授权与最大点位路数限制</h4>
                <div className="p-4 bg-gray-900/40 rounded-xl border border-gray-800 text-xs">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                    <div className="border border-gray-800 p-3 rounded-lg bg-[#141822]">
                      <span className="text-gray-500 text-[10px] block">算力分析路数限额</span>
                      <span className="text-lg font-bold font-mono text-white mt-1 block">16 路</span>
                    </div>
                    <div className="border border-gray-800 p-3 rounded-lg bg-[#141822]">
                      <span className="text-gray-500 text-[10px] block font-medium">已激活并发调流</span>
                      <span className="text-lg font-bold font-mono text-indigo-400 mt-1 block">12 路</span>
                    </div>
                    <div className="border border-gray-800 p-3 rounded-lg bg-[#141822]">
                      <span className="text-gray-500 text-[10px] block">授权许可证状态</span>
                      <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">永久白银商授权</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: 容器管理 */}
            {resourceSubTab === 5 && (
              <div className="space-y-4 text-xs select-none">
                <h4 className="text-white text-xs font-bold">算法微服务 Docker 隔离容器资源分配</h4>
                <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-lg space-y-3 font-mono">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Docker01 (人员行为分析容器) CPU配额</span>
                      <span>35% / 70% Limit</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-850 rounded overflow-hidden">
                      <div className="bg-indigo-500 h-full w-[45%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Docker02 (环境烟火重灾容器) NPU算力分配</span>
                      <span>42NPU / 64NPU Top</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-850 rounded overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[65%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 6: 文件管理 (音频对讲) */}
            {resourceSubTab === 6 && (
              <div className="space-y-4 font-sans">
                <div className="flex items-center justify-between">
                  <h4 className="text-white text-xs font-bold">音讯及现场声光对讲音频大库</h4>
                  <button 
                    onClick={handleAddMockFile}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> 上传防暴MP3对讲
                  </button>
                </div>

                <div className="space-y-2">
                  {mockFiles.map((f, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-gray-900/40 rounded border border-gray-800 text-xs">
                      <div className="flex items-center space-x-2">
                        <Volume2 className="h-4 w-4 text-indigo-400" />
                        <div>
                          <span className="text-white font-medium block">{f.name}</span>
                          <span className="text-[10px] text-gray-500 block">大小: {f.size} · 上传日期: {f.uploadTime}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handlePlayMockAudio(f.name)}
                        className={`text-[10px] px-2.5 py-1 rounded font-semibold cursor-pointer transition ${
                          audioPreviewPlaying === f.name ? "bg-red-500 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-750"
                        }`}
                      >
                        {audioPreviewPlaying === f.name ? "播放仿真拦截中..." : "测听音频文件"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 7: 误报库管理 */}
            {resourceSubTab === 7 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white text-xs font-bold">误报数据库纠偏自迭代管理</h4>
                  <span className="text-[10px] text-indigo-400">用于本地模型增量调试反向迭代</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  {mockWrongEvents.map((w, index) => (
                    <div key={index} className="p-3 bg-gray-900/40 border border-gray-800 rounded-lg flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-bold">{w.device}</span>
                          <span className="text-gray-500 text-[10px] font-mono">{w.time}</span>
                        </div>
                        <p className="text-gray-400 text-[11px]">误报模型: <span className="text-amber-400 font-semibold">{w.type}</span> · 偏离归因: {w.reason}</p>
                      </div>
                      <span className="text-[10px] text-gray-600 block">已剔除纠偏</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* SUB-TAB 4: SYSTEM ADMIN AUDIT EVENTS */}
      {activeSubTab === 'system_admin' && (
        <div className="space-y-6 max-w-4xl mx-auto font-mono text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box general system config */}
            <div className="bg-[#161c28] border border-gray-800 rounded-xl p-4 md:col-span-1 space-y-4">
              <h3 className="text-white text-xs font-bold border-b border-gray-800 pb-2 flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-indigo-400" /> NTP时间基准同步
              </h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-gray-500 text-[11px] block">NTP授时服务器IP</span>
                  <input type="text" defaultValue="time.beigang.com.cn" className="w-full bg-[#1e2535] border border-gray-800 text-white rounded p-1.5 mt-1 outline-none font-mono" />
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block">同步周期</span>
                  <select defaultValue="hourly" className="w-full bg-[#1e2535] border border-gray-800 text-white rounded p-1.5 mt-1 outline-none">
                    <option value="hourly">每小时定期对时</option>
                    <option value="daily">每天凌晨 00:00</option>
                  </select>
                </div>
                <div className="p-2 bg-emerald-950/20 border border-emerald-900 text-emerald-400 text-[10px] rounded">
                  ✔ 时钟源信号绑定：南宁总部28所高密GPS原子钟
                </div>
              </div>

              <h3 className="text-white text-xs font-bold border-b border-gray-800 pt-2 pb-2 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-400" /> 第三方系统联动数据推送
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-500 text-[11px] block">上推推送协议方式</span>
                  <select defaultValue="websocket" className="w-full bg-[#1e2535] border border-gray-800 text-white rounded p-1.5 mt-1 outline-none">
                    <option value="websocket">WebSocket 实时双工数据流</option>
                    <option value="http">HTTP WEBHOOK 回调流</option>
                    <option value="gb">GB/T 28181 视频汇聚级</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Run logs & System self-healing metrics */}
            <div className="bg-[#161c28] border border-gray-800 rounded-xl p-4 md:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <h3 className="text-white text-xs font-bold flex items-center gap-1.5">
                  <FileBarChart className="h-4 w-4 text-indigo-400" /> 边缘计算盒子运行系统日志审计 (100条限制)
                </h3>
                <span className="text-[10px] text-[#55698b] font-mono">等级: INFO / ERROR</span>
              </div>

              {/* Logs visualizer console */}
              <div className="h-64 overflow-y-auto bg-gray-950/80 rounded-lg p-3 space-y-2 border border-gray-800 text-[11px] font-mono leading-relaxed max-w-full">
                {sysLogs.map((l, index) => (
                  <div key={index} className="flex justify-between hover:bg-gray-900 p-1 rounded">
                    <span className="text-indigo-400 shrink-0 select-none">[{l.time.substring(11)}]</span>
                    <span className="text-gray-400 flex-1 px-2 overflow-x-hidden text-ellipsis">{l.action}</span>
                    <span className="text-[#a4a0a0] font-mono shrink-0 select-none">{l.user}</span>
                  </div>
                ))}
              </div>

              {/* Diagnostics CPU meters */}
              <div className="flex justify-between gap-4 text-center mt-3 bg-gray-900 p-2.5 rounded-lg border border-gray-800 text-[11px]">
                <div>
                  <span className="text-gray-500 block">算力量一期可用 (CPU)</span>
                  <span className="text-white font-bold block mt-0.5">48.2%</span>
                </div>
                <div>
                  <span className="text-gray-500 block">算力量二期预留 (NPU)</span>
                  <span className="text-indigo-400 font-bold block mt-0.5 font-mono">18.5 Tops 活性</span>
                </div>
                <div>
                  <span className="text-gray-500 block">智能极速断自愈机制</span>
                  <span className="text-emerald-400 font-bold block mt-0.5 animate-pulse">● 毫秒级故障自动热恢复</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MODAL: PREFILL TICKETS INTEGRATOR FOR AI ALARMS */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
          <div className="bg-[#181d2a] border border-gray-800 rounded-xl max-w-lg w-full p-6 text-xs text-gray-300">
            <h3 className="text-white text-base font-bold flex items-center gap-1.5 mb-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              将AI智能拦截事件转办正式安全工单
            </h3>
            <p className="text-gray-400 mb-4 text-[11px]">您正在根据边缘盒捕获的预警切片正式指派和派发限期排查查办单。</p>

            <div className="space-y-4">
              <div>
                <label className="text-gray-400 block mb-1">1. 隐患工单标题名</label>
                <input 
                  type="text" 
                  value={convertTitle}
                  onChange={(e) => setConvertTitle(e.target.value)}
                  className="w-full bg-[#202737] border border-gray-800 rounded p-2 text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1">2. 高危发生防区/位置描述</label>
                  <input 
                    type="text" 
                    value={convertLocation}
                    onChange={(e) => setConvertLocation(e.target.value)}
                    className="w-full bg-[#202737] border border-gray-800 rounded p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">3. 安全风险严重等级划分</label>
                  <select 
                    value={convertRisk}
                    onChange={(e: any) => setConvertRisk(e.target.value)}
                    className="w-full bg-[#202737] border border-gray-800 rounded p-2 text-white outline-none"
                  >
                    <option value="一般隐患">一般隐患 (限期2-3日纠错并闭环)</option>
                    <option value="重大隐患">重大隐患 (增加复查审核并联通停限)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">4. 随手拍/物证描述与现场改善任务安排自填</label>
                <textarea 
                  rows={3} 
                  value={convertRec}
                  onChange={(e) => setConvertRec(e.target.value)}
                  className="w-full bg-[#202737] border border-gray-800 rounded p-2 text-white outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-sans"
                />
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-900 rounded-lg flex items-center space-x-3">
                <img 
                  src={showConvertModal.imageUrl} 
                  alt="Pre-analysis" 
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 object-cover rounded border border-gray-800 shrink-0"
                />
                <p className="text-indigo-300 text-[11px] leading-relaxed">系统已经自动将AI计算分析捕获到事故第一幅图片证据关联。责任班组长可在移动端/钉钉接收此证据做参照！</p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-800/80">
                <button 
                  onClick={() => setShowConvertModal(null)}
                  className="bg-gray-800 hover:bg-gray-750 text-gray-300 px-4 py-2 rounded font-semibold cursor-pointer"
                >
                  取消取消
                </button>
                <button 
                  onClick={handleCreateConvertedHazard}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded font-semibold cursor-pointer"
                >
                  确认并派发工单
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
