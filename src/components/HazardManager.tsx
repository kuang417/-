import React, { useState, useEffect } from "react";
import { 
  Plus, Search, RefreshCw, AlertTriangle, CheckCircle, Clock, ArrowRight, 
  MapPin, User, DollarSign, Calendar, Eye, FileSpreadsheet, Sparkles, AlertOctagon, HelpCircle
} from "lucide-react";
import { fetchHazards, updateHazard, fetchEmployees } from "../lib/api";
import { HazardTicket, Employee } from "../types";

export default function HazardManager({ onRefreshStats, triggerRefreshToggle }: { onRefreshStats: () => void, triggerRefreshToggle: boolean }) {
  const [hazards, setHazards] = useState<HazardTicket[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Multi-dimensional Query State
  const [searchQuery, setSearchQuery] = useState("");
  const [queryRisk, setQueryRisk] = useState("all");
  const [queryStatus, setQueryStatus] = useState("all");
  const [queryProject, setQueryProject] = useState("all");

  // Selected Hazard for Drawer / Modal details
  const [selectedTicket, setSelectedTicket] = useState<HazardTicket | null>(null);

  // Workflow Dialog Action states
  const [actionType, setActionType] = useState<'assign' | 'rectify' | 'retest' | 'reassign' | null>(null);
  
  // Forms states
  const [formRectifier, setFormRectifier] = useState("");
  const [formPlan, setFormPlan] = useState("");
  const [formCost, setFormCost] = useState(0);
  const [formReason, setFormReason] = useState("");
  const [formFeedback, setFormFeedback] = useState("");
  const [formReassignTo, setFormReassignTo] = useState("");
  const [formComment, setFormComment] = useState("");

  const loadAll = async () => {
    try {
      setLoading(true);
      const [hData, eData] = await Promise.all([
        fetchHazards(),
        fetchEmployees()
      ]);
      setHazards(hData);
      setEmployees(eData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [triggerRefreshToggle]);

  // Handle workflow updates
  const handleWorkflowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      let updatePayload: any = {};
      let alertMsg = "";

      if (actionType === 'rectify') {
        // From status "排查" or "整改" -> "复查"
        updatePayload = {
          status: "复查",
          operator: "李朝阳(整改责任人)",
          comments: `已落实整改。原因分析：${formReason}。整改方案：${formPlan}。耗用费用：${formCost}元。`,
          rectifier: "李朝阳(整改责任人)",
          rectificationPlan: formPlan,
          rectificationCost: Number(formCost),
          rectifiedImageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500" // Simulated after pic
        };
        alertMsg = "🔧 整改反馈已提报，工单流转至复查岗位！";
      } 
      else if (actionType === 'retest') {
        // From status "复查" -> "已归档" or failed back to "整改"
        const isApproved = formComment.includes("不合格") ? false : true;
        updatePayload = {
          status: isApproved ? "已归档" : "整改",
          operator: "张建华(安全主管/复查员)",
          comments: isApproved ? `现场查验：${formFeedback}。合格验收！` : `查验不合格：${formFeedback}。发回重整改。`,
          retestFeedback: formFeedback
        };
        alertMsg = isApproved ? "✅ 工单验收合格，已闭环归档入库！" : "⚠️ 复查不合格，已退回限期重整改！";
      } 
      else if (actionType === 'reassign') {
        // Reassignment feature (转报) requested in 3.2.7
        updatePayload = {
          status: "整改",
          operator: "李朝阳(原责任人)",
          comments: `递交转报申请给：${formReassignTo}。原因：${formComment}`,
          rectifier: formReassignTo
        };
        alertMsg = `📌 工单已被成功并妥善转派给 ${formReassignTo} 负责！`;
      }

      const updated = await updateHazard(selectedTicket.id, updatePayload);
      setSelectedTicket(null);
      setActionType(null);
      loadAll();
      onRefreshStats();
      alert(alertMsg);
    } catch (err) {
      console.error(err);
    }
  };

  // Simulated export to Document sheet
  const handleExportSheet = () => {
    alert("📑 【标准化文件导出】已自动提取本级筛选条件内的隐患台账记录，生成：《北港建司安环隐患销项清单一览表_2026.xlsx》，正在通过浏览器安全拦截下载...");
  };

  // Combined filters
  const filteredAndSortedHazards = hazards.filter(h => {
    const s = searchQuery.toLowerCase();
    if (searchQuery && !h.title.toLowerCase().includes(s) && !h.hazardObject.toLowerCase().includes(s) && !h.reporter.toLowerCase().includes(s)) return false;
    
    if (queryRisk !== "all" && h.riskLevel !== queryRisk) return false;
    if (queryStatus !== "all" && h.status !== queryStatus) return false;
    if (queryProject !== "all" && !h.location.includes(queryProject)) return false;

    return true;
  });

  return (
    <div className="bg-[#121620] border border-gray-800 rounded-xl p-6 shadow-sm min-h-[500px]">
      
      {/* Title block */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-5 border-b border-gray-805/70 gap-4 mb-6">
        <div>
          <h2 className="text-white text-lg font-bold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            标准隐患全流程闭环数字化处置中心
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            满足规范要求的一般隐患（排查-整改-复查-归档）与重大隐患（增加二级审核审批环节）全流程数字自查自纠生态
          </p>
        </div>

        {/* List vs Kanban toggles */}
        <div className="flex items-center space-x-2 font-sans select-none shrink-0">
          <button 
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${viewMode === 'list' ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-[#1e2535] border-gray-800 text-gray-400'}`}
          >
            表格视图
          </button>
          <button 
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${viewMode === 'kanban' ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-[#1e2535] border-gray-800 text-gray-400'}`}
          >
            看板管理(Kanban)
          </button>

          <button 
            onClick={handleExportSheet}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-md transition ml-2 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" /> 导出Excel台账
          </button>
        </div>
      </div>

      {/* Multi-dimensional query inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#151c27] rounded-xl border border-gray-800 mb-6 font-sans">
        
        {/* Search Input */}
        <div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
            <input 
              type="text" 
              placeholder="搜工单名、高危物件、排查安全员..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e2535] border border-gray-800 text-white text-xs rounded-lg pl-8 p-2 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
            />
          </div>
        </div>

        {/* Risk Level filter */}
        <div>
          <select 
            value={queryRisk}
            onChange={(e) => setQueryRisk(e.target.value)}
            className="w-full bg-[#1e2535] border border-gray-800 text-white text-xs rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">所有的等级 (一般/重大)</option>
            <option value="一般隐患">一般隐患</option>
            <option value="重大隐患">重大隐患</option>
          </select>
        </div>

        {/* Workflow step status filter */}
        <div>
          <select 
            value={queryStatus}
            onChange={(e) => setQueryStatus(e.target.value)}
            className="w-full bg-[#1e2535] border border-gray-800 text-white text-xs rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">所有的处置节点</option>
            <option value="排查">排查中 (初筛待指派)</option>
            <option value="整改">整改中 (责任班组退工)</option>
            <option value="复查">复查中 (安全复评自验)</option>
            <option value="已归档">已办办结归档 (闭环销项)</option>
          </select>
        </div>

        {/* Proj Site project filters */}
        <div>
          <select 
            value={queryProject}
            onChange={(e) => setQueryProject(e.target.value)}
            className="w-full bg-[#1e2535] border border-gray-800 text-white text-xs rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">所有的子项目部</option>
            <option value="南宁">南宁分部项目</option>
            <option value="防城港">防城港分部项目</option>
            <option value="北海">北海保税冷链基地</option>
          </select>
        </div>

      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'list' ? (
        <div className="overflow-x-auto border border-gray-800 rounded-xl bg-gray-900/10">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead className="bg-[#1a2232]/60 text-gray-400 font-bold border-b border-gray-800 select-none">
              <tr>
                <th className="p-3">工单标识</th>
                <th className="p-3">隐患等级</th>
                <th className="p-3">工单名称/风险物件</th>
                <th className="p-3">所属工地项目</th>
                <th className="p-3">当前节点</th>
                <th className="p-3">上报人/指派负责人</th>
                <th className="p-3">登记时间</th>
                <th className="p-3 text-center">工单详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-350">
              {filteredAndSortedHazards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <AlertOctagon className="h-10 w-10 text-gray-600 mx-auto mb-2 font-sans" />
                    没有找到符合筛选条件的隐患工单
                  </td>
                </tr>
              ) : (
                filteredAndSortedHazards.map((h) => {
                  const isMajor = h.riskLevel === "重大隐患";
                  return (
                    <tr key={h.id} className="hover:bg-[#141b29] transition group">
                      <td className="p-3 font-mono font-bold text-gray-400">{h.id}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isMajor ? "bg-red-500/10 text-red-400 border-red-950/60" : "bg-amber-500/10 text-amber-500 border-amber-950/60"
                        }`}>
                          {h.riskLevel}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs">
                        <span className="font-semibold text-white block truncate group-hover:text-indigo-300 transition duration-150">{h.title}</span>
                        <span className="text-[10px] text-gray-500 block truncate mt-0.5">危害对象：{h.hazardObject}</span>
                      </td>
                      <td className="p-3 text-gray-400 truncate max-w-[130px]">{h.location.split("城")[0] || h.location}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 font-semibold text-[10px] ${
                          h.status === "排查" ? "text-blue-400" :
                          h.status === "整改" ? "text-amber-500" :
                          h.status === "复查" ? "text-sky-400" : "text-emerald-400"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            h.status === "排查" ? "bg-blue-400" :
                            h.status === "整改" ? "bg-amber-500" :
                            h.status === "复查" ? "bg-sky-400" : "bg-emerald-400"
                          }`} />
                          {h.status === "排查" ? "排查中(初登)" :
                           h.status === "整改" ? "整改实施中" :
                           h.status === "复查" ? "复查查验中" : "已闭归档"}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-gray-400">
                        <div>{h.reporter.split("(")[0]}</div>
                        <div className="text-[10px] text-gray-500">→ {h.rectifier?.split("(")[0] || "未指定"}</div>
                      </td>
                      <td className="p-3 font-mono text-gray-500">{h.createdAt.substring(5, 16)}</td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => setSelectedTicket(h)}
                          className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 mx-auto transition cursor-pointer"
                        >
                          <Eye className="h-3 w-3" /> 查看并办理
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* VIEW 2: KANBAN COLUMN BLOCKS */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-sans select-none">
          
          {/* Column 1: 排查 */}
          <div className="bg-[#151a24] rounded-xl border border-gray-800 p-3 h-[420px] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between font-bold text-xs text-blue-400 pb-2 border-b border-gray-800 mb-3 sticky top-0 bg-[#151a24]">
              <span>🛡 排查中 ({filteredAndSortedHazards.filter(h => h.status === '排查').length})</span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1">
              {filteredAndSortedHazards.filter(h => h.status === '排查').map(h => (
                <div 
                  key={h.id}
                  onClick={() => setSelectedTicket(h)}
                  className="bg-[#1f2535]/50 border border-gray-850 p-3 rounded-lg hover:border-gray-700 transition cursor-pointer space-y-2 hover:bg-[#1f2535]"
                >
                  <span className="bg-blue-500/10 text-blue-400 text-[9px] px-1 py-0.5 rounded font-bold border border-blue-900/60 font-mono">ID: {h.id}</span>
                  <h4 className="text-white text-xs font-semibold line-clamp-2 leading-snug">{h.title}</h4>
                  <p className="text-[10px] text-gray-500 truncate">{h.location}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: 整改 */}
          <div className="bg-[#151a24] rounded-xl border border-gray-800 p-3 h-[420px] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between font-bold text-xs text-amber-500 pb-2 border-b border-gray-800 mb-3 sticky top-0 bg-[#151a24]">
              <span>🔧 整改中 ({filteredAndSortedHazards.filter(h => h.status === '整改').length})</span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1">
              {filteredAndSortedHazards.filter(h => h.status === '整改').map(h => (
                <div 
                  key={h.id}
                  onClick={() => setSelectedTicket(h)}
                  className="bg-[#1f2535]/50 border border-gray-850 p-3 rounded-lg hover:border-gray-700 transition cursor-pointer space-y-2 hover:bg-[#1f2535]"
                >
                  <span className="bg-amber-500/10 text-amber-500 text-[9px] px-1 py-0.5 rounded font-bold border border-amber-900/60 font-mono">责任人: {h.rectifier?.split("(")[0]}</span>
                  <h4 className="text-white text-xs font-semibold line-clamp-2 leading-snug">{h.title}</h4>
                  <p className="text-[10px] text-gray-500 truncate">{h.location}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: 复查 */}
          <div className="bg-[#151a24] rounded-xl border border-gray-800 p-3 h-[420px] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between font-bold text-xs text-sky-400 pb-2 border-b border-gray-800 mb-3 sticky top-0 bg-[#151a24]">
              <span>👁 复查自验 ({filteredAndSortedHazards.filter(h => h.status === '复查').length})</span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1">
              {filteredAndSortedHazards.filter(h => h.status === '复查').map(h => (
                <div 
                  key={h.id}
                  onClick={() => setSelectedTicket(h)}
                  className="bg-[#1f2535]/50 border border-gray-850 p-3 rounded-lg hover:border-gray-700 transition cursor-pointer space-y-2 hover:bg-[#1f2535]"
                >
                  <span className="bg-sky-500/10 text-sky-400 text-[9px] px-1 py-0.5 rounded font-bold border border-sky-900/60 font-mono">复查中</span>
                  <h4 className="text-white text-xs font-semibold line-clamp-2 leading-snug">{h.title}</h4>
                  <p className="text-[10px] text-gray-500 truncate">{h.location}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: 归档 */}
          <div className="bg-[#151a24] rounded-xl border border-gray-800 p-3 h-[420px] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between font-bold text-xs text-emerald-400 pb-2 border-b border-gray-800 mb-3 sticky top-0 bg-[#151a24]">
              <span>办销销项 ({filteredAndSortedHazards.filter(h => h.status === '已归档').length})</span>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1">
              {filteredAndSortedHazards.filter(h => h.status === '已归档').map(h => (
                <div 
                  key={h.id}
                  onClick={() => setSelectedTicket(h)}
                  className="bg-[#1f2535]/50 border border-gray-850 p-3 rounded-lg hover:border-gray-700 transition cursor-pointer space-y-2 hover:bg-[#1f2535]"
                >
                  <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-1 py-0.5 rounded font-bold border border-emerald-900/60">已办办结</span>
                  <h4 className="text-white text-xs font-semibold line-clamp-2 leading-snug">{h.title}</h4>
                  <p className="text-[10px] text-gray-550 font-mono truncate">{h.retestedAt}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* DETAIL OVERLAY DRAWER WITH CLOSING WORKFLOW FORM ACTIONS */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end animate-fadeIn">
          <div className="bg-[#141926] border-l border-gray-800 w-full max-w-xl p-6 h-full overflow-y-auto font-sans text-xs text-gray-300 flex flex-col justify-between">
            
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4 select-none">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-gray-500 font-bold">工单详情：{selectedTicket.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    selectedTicket.riskLevel === "重大隐患" ? "bg-red-500/10 text-red-500 border-red-950" : "bg-amber-500/10 text-amber-500 border-amber-950"
                  }`}>
                    {selectedTicket.riskLevel}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedTicket(null);
                    setActionType(null);
                  }}
                  className="text-gray-400 hover:text-white text-base font-bold cursor-pointer"
                >
                  ✕ 关闭窗口
                </button>
              </div>

              {/* Core Info */}
              <div className="space-y-4">
                
                {/* Title */}
                <div>
                  <h3 className="text-white text-sm font-bold">{selectedTicket.title}</h3>
                  <div className="flex items-center space-x-4 text-gray-500 text-[10px] mt-1.5 font-mono">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {selectedTicket.location}</span>
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> 提报：{selectedTicket.reporter}</span>
                  </div>
                </div>

                {/* Imagery Before / After Comparison */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <span className="text-gray-500 text-[10px] font-semibold block">【整改前隐患抓拍原图】</span>
                    <div className="aspect-video bg-gray-950 rounded-lg overflow-hidden border border-gray-800">
                      <img 
                        src={selectedTicket.imageUrl} 
                        alt="Before" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-gray-500 text-[10px] font-semibold block">【整改后闭环复查照片】</span>
                    <div className="aspect-video bg-gray-950 rounded-lg overflow-hidden border border-gray-800 flex items-center justify-center text-center text-gray-600">
                      {selectedTicket.rectifiedImageUrl ? (
                        <img 
                          src={selectedTicket.rectifiedImageUrl} 
                          alt="After" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] px-4">暂无复查照片<br/>(待整改反馈岗位上传)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Specific descriptions */}
                <div className="p-3 bg-gray-900/60 rounded-lg border border-gray-800 space-y-2">
                  <div>
                    <span className="text-[#a4a0a0] block text-[10px] font-medium">隐患判定依据条款：</span>
                    <p className="text-gray-300 text-[11px] mt-0.5 leading-relaxed">{selectedTicket.hazardBasis}</p>
                  </div>
                  <div>
                    <span className="text-[#a4a0a0] block text-[10px] font-medium">危害表现描述描述：</span>
                    <p className="text-gray-300 text-[11px] mt-0.5 leading-relaxed">{selectedTicket.hazardDescription}</p>
                  </div>
                  <div>
                    <span className="text-[#a4a0a0] block text-[10px] font-medium">预防及改善建议意见：</span>
                    <p className="text-gray-300 text-[11px] mt-0.5 leading-relaxed">{selectedTicket.improvementSuggestion}</p>
                  </div>
                </div>

                {/* Detailed logs history timelines */}
                <div className="pt-2">
                  <span className="text-gray-500 text-[10px] font-semibold block mb-2">【工程流转审计历史链条】</span>
                  <div className="space-y-2.5 pl-3 border-l-2 border-indigo-950 font-sans">
                    {selectedTicket.history.map((hist, ind) => (
                      <div key={ind} className="relative">
                        {/* Bullet pulse pin */}
                        <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-[#141926]" />
                        <div className="text-[11px]">
                          <div className="flex items-center justify-between text-gray-400 font-medium">
                            <span className="font-semibold text-gray-200">{hist.status} - {hist.operator}</span>
                            <span className="font-mono text-[10px] text-gray-600">{hist.time}</span>
                          </div>
                          {hist.comment && <p className="text-gray-500 text-[10px] mt-0.5 leading-relaxed bg-[#1b2131]/20 p-2.5 rounded border border-gray-850/50">{hist.comment}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Workflow status feedback forms actions */}
            <div className="mt-8 pt-4 border-t border-gray-800/80">
              
              {/* If no action chosen yet, show possible action buttons depending on status */}
              {!actionType ? (
                <div className="flex flex-wrap gap-2 select-none">
                  {selectedTicket.status === "排查" && (
                    <>
                      <button 
                        onClick={() => {
                          setActionType('rectify');
                          setFormReason("材料受风荷载松动机翼磨损");
                          setFormPlan("使用不锈钢自锁高拉强螺栓固，更换斜撑");
                          setFormCost(450);
                        }}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 rounded-lg cursor-pointer transition text-center"
                      >
                        🔧 直接办理并提报整改
                      </button>
                    </>
                  )}

                  {selectedTicket.status === "整改" && (
                    <>
                      <button 
                        onClick={() => {
                          setActionType('rectify');
                          setFormReason("机械隔离栏遭车辆碰撞变形脱轨");
                          setFormPlan("机械重铆调直，滑道除锈除渣焊死");
                          setFormCost(850);
                        }}
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 rounded-lg cursor-pointer transition text-center"
                      >
                        ✔ 提报整改反馈
                      </button>
                      
                      {/* Reassign / Transfer (转报) as requested in 3.2.7 */}
                      <button 
                        onClick={() => {
                          setActionType('reassign');
                          setFormReassignTo("苏德坤(安保主管)");
                          setFormComment("经现场排勘，此井口不归本标段二分包队管辖，属于一分包队土方范围，特请转派一包负责人办理。");
                        }}
                        className="bg-gray-800 hover:bg-gray-750 text-gray-300 font-semibold px-4 py-2 rounded-lg cursor-pointer transition"
                      >
                        转报他方(Reassign)
                      </button>
                    </>
                  )}

                  {selectedTicket.status === "复查" && (
                    <button 
                      onClick={() => {
                        setActionType('retest');
                        setFormFeedback("现场复检，扣件锁紧拧紧扭矩测定为50N.m，复合强强条规范，原防区围栏倾角已矫直，防护网整洁，拟同意通过办结销项。");
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg cursor-pointer transition text-center"
                    >
                      👁 现场复核并关闭销项
                    </button>
                  )}

                  {selectedTicket.status === "已归档" && (
                    <div className="w-full text-center py-2 bg-emerald-950/20 border border-emerald-900 rounded-lg text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle className="h-4 w-4" /> 此隐患已于 {selectedTicket.retestedAt} 彻底销办归档一档
                    </div>
                  )}
                </div>
              ) : (
                /* Dynamic Action form depending on choice */
                <form onSubmit={handleWorkflowSubmit} className="bg-[#181f2f] border border-gray-800 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2">
                    <span className="text-white font-bold">
                      {actionType === 'rectify' && "落实整改情况提报"}
                      {actionType === 'retest' && "安全主管現場复检审核"}
                      {actionType === 'reassign' && "隐患工单向外转报(转派)申请"}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setActionType(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      取消
                    </button>
                  </div>

                  {/* FORM ACTION: RECTIFY */}
                  {actionType === 'rectify' && (
                    <div className="space-y-4 text-xs font-sans">
                      <div>
                        <label className="text-gray-400 block mb-1">1. 隐患产生原因剖析*</label>
                        <input 
                          type="text" 
                          required
                          value={formReason}
                          onChange={(e) => setFormReason(e.target.value)}
                          className="w-full bg-[#242e43] border border-gray-800 rounded p-1.5 text-white outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-gray-400 block mb-1">2. 实际整改费用估算 (元)*</label>
                          <input 
                            type="number" 
                            required
                            value={formCost}
                            onChange={(e) => setFormCost(Number(e.target.value))}
                            className="w-full bg-[#242e43] border border-gray-800 rounded p-1.5 text-white outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 block mb-1">3. 整改落实日期设定</label>
                          <input 
                            type="text" 
                            disabled
                            defaultValue="今天(2026-06-22)"
                            className="w-full bg-[#181d2a]/55 border border-gray-800 rounded p-1.5 text-gray-500 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-gray-400 block mb-1">4. 采取的具体整改成效/防护方案措施情况*</label>
                        <textarea 
                          rows={2} 
                          required
                          value={formPlan}
                          onChange={(e) => setFormPlan(e.target.value)}
                          className="w-full bg-[#242e43] border border-gray-800 rounded p-2 text-white outline-none resize-none"
                        />
                      </div>

                      <div className="p-2.5 bg-yellow-950/20 border border-yellow-900 rounded-lg text-[10px] text-yellow-500 font-medium">
                        ▲ 提交后，系统将模拟生成“整改后现场照片”并发送至安全值班员进行终审放行。
                      </div>
                    </div>
                  )}

                  {/* FORM ACTION: RETEST (End closure validation) */}
                  {actionType === 'retest' && (
                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="text-gray-400 block mb-1">1. 在现场检查复检反馈细则*</label>
                        <textarea 
                          rows={3} 
                          required
                          value={formFeedback}
                          onChange={(e) => setFormFeedback(e.target.value)}
                          className="w-full bg-[#242e43] border border-gray-800 rounded p-2 text-white outline-none resize-none font-sans"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-gray-400 block">2. 表决整复查验收结果判定</label>
                        <div className="flex gap-3">
                          <button 
                            type="button"
                            onClick={() => setFormComment("合格验收销办")} 
                            className={`flex-1 py-2 rounded text-center border font-bold cursor-pointer transition ${
                              formComment !== "合格验收销办" ? "bg-[#242e43] border-gray-800 text-gray-300" : "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                            }`}
                          >
                            验收合格 ✔ 并予关单归档
                          </button>
                          <button 
                            type="button"
                            onClick={() => setFormComment("不合格发回")} 
                            className={`flex-1 py-2 rounded text-center border font-bold cursor-pointer transition ${
                              formComment !== "不合格发回" ? "bg-[#242e43] border-gray-800 text-gray-300" : "bg-red-600/20 border-red-500 text-red-500"
                            }`}
                          >
                            不合格 🗙 退回重返修
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FORM ACTION: REASSIGN (转报他方) */}
                  {actionType === 'reassign' && (
                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="text-gray-400 block mb-1">1. 新接收责任人/分包班工组长*</label>
                        <select 
                          value={formReassignTo}
                          onChange={(e) => setFormReassignTo(e.target.value)}
                          className="w-full bg-[#242e43] border border-gray-800 rounded p-1.5 text-white outline-none"
                        >
                          {employees.map(emp => (
                            <option key={emp.id} value={`${emp.name}(${emp.role})`}>{emp.name} ({emp.companyName} - {emp.role})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-gray-400 block mb-1">2. 转报偏常申辩申诉及情况说明*</label>
                        <textarea 
                          rows={2} 
                          required
                          value={formComment}
                          onChange={(e) => setFormComment(e.target.value)}
                          className="w-full bg-[#242e43] border border-gray-800 rounded p-2 text-white outline-none resize-none"
                          placeholder="说明为何该隐患不属于您的整改作业范围..."
                        />
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-semibold py-2 rounded-lg transition shadow-md cursor-pointer"
                  >
                    提交办理决议
                  </button>
                </form>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
