import React, { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, Legend, CartesianGrid } from "recharts";
import { ShieldAlert, CheckCircle, Clock, AlertTriangle, Play, RefreshCw, Trophy, FileText, ArrowRight } from "lucide-react";
import { fetchStats } from "../lib/api";
import { WarningEvent } from "../types";

const COLORS = ["#EF4444", "#F59E0B", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899"];

interface DashboardProps {
  onNavigateToTab: (tab: string) => void;
  triggerRefreshToggle: boolean;
}

export default function Dashboard({ onNavigateToTab, triggerRefreshToggle }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fetchStats();
      setStats(data);
    } catch (e) {
      console.error("Error loading stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [triggerRefreshToggle]);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-500 mb-3" />
        <span className="text-sm font-mono">加载安防分析态势数据中...</span>
      </div>
    );
  }

  // Generate sample trend data
  const trendData = [
    { name: "06-16", 已整改: 5, 新增隐患: 4 },
    { name: "06-17", 已整改: 8, 新增隐患: 6 },
    { name: "06-18", 已整改: 12, 新增隐患: 10 },
    { name: "06-19", 已整改: 6, 新增隐患: 7 },
    { name: "06-20", 已整改: 15, 新增隐患: 14 },
    { name: "06-21", 已整改: 9, 新增隐患: stats.totalHazards + 2 },
    { name: "今天", 已整改: stats.resolvedHazards, 新增隐患: stats.totalHazards }
  ];

  return (
    <div className="space-y-6">
      
      {/* 实时告警滚动横幅 / AI Realtime Ticker */}
      <div className="bg-red-950/40 border border-red-900/60 rounded-xl px-4 py-3 flex items-center justify-between whitespace-nowrap overflow-hidden shadow-sm shadow-red-900/10 backdrop-blur-xs">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </div>
          <span className="text-red-400 font-medium text-sm flex items-center font-mono gap-1">
            <ShieldAlert className="h-4 w-4" /> 实时智能预警
          </span>
          <span className="text-red-700 font-semibold px-2">|</span>
        </div>
        
        <div className="flex-1 overflow-hidden px-4">
          <div className="animate-marquee inline-flex space-x-12 text-red-200/90 text-sm font-sans">
            {stats.activeWarningsTicker && stats.activeWarningsTicker.length > 0 ? (
              stats.activeWarningsTicker.map((w: WarningEvent) => (
                <span key={w.id} className="inline-flex items-center gap-2">
                  <span className="font-semibold text-amber-400 font-mono">[{w.time.split(" ")[1]}]</span>
                  <span>{w.deviceName}检测到</span>
                  <span className="bg-red-900/80 px-2 py-0.5 rounded text-xs text-red-100 font-semibold border border-red-700/50">{w.warningType}</span>
                  <span className="text-red-300 font-mono">(置信度: {w.confidence}%)</span>
                </span>
              ))
            ) : (
              <span>暂无活动中的AI未闭环风险高危警报</span>
            )}
          </div>
        </div>

        <button 
          onClick={() => onNavigateToTab("warning")}
          className="shrink-0 text-xs px-2.5 py-1 bg-red-900/40 hover:bg-red-900/80 text-red-200 rounded border border-red-700/50 flex items-center gap-1 transition ml-4 cursor-pointer"
        >
          查看告警 <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* KPI 卡片阵列 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-[#151b26] border border-gray-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-medium block mb-1">自建/AI累计风险隐患</span>
            <span className="text-3xl font-mono font-bold text-white tracking-tight">{stats.totalHazards}</span>
            <span className="text-xs text-gray-500 block mt-1">包含随手拍及视频拦截</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-[#151b26] border border-gray-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-medium block mb-1">正在落实整改数</span>
            <span className="text-3xl font-mono font-bold text-amber-500 tracking-tight">{stats.pendingRectification}</span>
            <span className="text-xs text-gray-500 block mt-1">限期整改反馈责任书</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="h-6 w-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-[#151b26] border border-gray-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-medium block mb-1">待复核审核数</span>
            <span className="text-3xl font-mono font-bold text-sky-400 tracking-tight">{stats.pendingReview}</span>
            <span className="text-xs text-gray-500 block mt-1">安全员开展闭环查验</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-[#151b26] border border-gray-800 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-gray-400 text-xs font-medium block mb-1">整改销项率</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-mono font-bold text-emerald-400 tracking-tight">{stats.resolutionRate}</span>
              <span className="text-emerald-500 text-lg font-bold">%</span>
            </div>
            <span className="text-xs text-gray-500 block mt-1">已办结销项 / 累计工单</span>
          </div>
          <div className="h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 图表分析与高频隐患 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Trend Line chart */}
        <div className="lg:col-span-2 bg-[#121620] border border-gray-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-semibold flex items-center gap-2">
              <span className="h-2.5 w-1 bg-indigo-500 rounded-full"></span> 风险隐患攀升与销项对冲走势
            </h3>
            <span className="text-gray-500 text-xs font-mono">数据刷新：实时</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px" }}
                  labelStyle={{ color: "#94a3b8", fontWeight: "bold" }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="新增隐患" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="已整改" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hazard Class Pie Chart */}
        <div className="bg-[#121620] border border-gray-800/80 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-white text-sm font-semibold flex items-center gap-2">
              <span className="h-2.5 w-1 bg-indigo-500 rounded-full"></span> 报警与随手拍隐患类型比重
            </h3>
          </div>
          <div className="h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.highFrequencyTypes}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.highFrequencyTypes.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Display count in the center */}
            <div className="absolute flex flex-col items-center">
              <span className="text-[22px] font-bold font-mono text-white leading-none">{stats.totalHazards}</span>
              <span className="text-[10px] text-gray-500 mt-1">总触发数</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mt-3 pt-2 border-t border-gray-800/60 max-h-24 overflow-y-auto font-sans">
            {stats.highFrequencyTypes.map((t: any, idx: number) => (
              <div key={idx} className="flex items-center space-x-1.5 truncate">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="truncate text-[11px] text-gray-400">{t.name}: {t.value}次</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 排查积极度与集团通告 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Safety Team Participation Ranking */}
        <div className="lg:col-span-1 bg-[#121620] border border-gray-800/80 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-white text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" /> 现场管理人员参与度积分榜
            </h3>
          </div>
          <div className="space-y-3 font-sans">
            {stats.ranking && stats.ranking.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-[#171d2b] rounded-lg border border-gray-800/40 hover:border-gray-800 hover:bg-[#1a2131] transition">
                <div className="flex items-center space-x-3">
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                    idx === 0 ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30" : 
                    idx === 1 ? "bg-gray-400/10 text-gray-300 border border-gray-400/30" :
                    idx === 2 ? "bg-amber-600/10 text-amber-600 border border-amber-600/30" :
                    "bg-[#242e42] text-gray-400"
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-white text-xs font-medium block">{item.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">爆料/落实销项: {item.count}次</span>
                  </div>
                </div>
                <div>
                  <span className="text-emerald-400 text-xs font-mono font-semibold block text-right">{item.score}分</span>
                  <span className="text-[9px] text-gray-600 block text-right">综合考评</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Construction Site Infrastructure Quick Watch */}
        <div className="lg:col-span-2 bg-[#121620] border border-gray-800/80 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                <span className="h-2.5 w-1 bg-indigo-500 rounded-full"></span> 北港建司各项目危险源防范基数
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-2">
              <div className="p-3 bg-[#171d2b] rounded-xl border border-gray-800 text-center">
                <span className="text-gray-400 text-[10px] block font-medium">塔吊双限位防护</span>
                <span className="text-lg font-bold font-mono text-white mt-1 block">4台在线</span>
                <span className="text-[9px] text-emerald-400 block mt-0.5">● 运转良好</span>
              </div>
              <div className="p-3 bg-[#171d2b] rounded-xl border border-gray-800 text-center">
                <span className="text-gray-400 text-[10px] block font-medium">深基坑壁沉降仪</span>
                <span className="text-lg font-bold font-mono text-white mt-1 block">12组覆盖</span>
                <span className="text-[9px] text-emerald-400 block mt-0.5">● 零预警偏色</span>
              </div>
              <div className="p-3 bg-[#171d2b] rounded-xl border border-gray-800 text-center">
                <span className="text-gray-400 text-[10px] block font-medium">临时箱漏保测报</span>
                <span className="text-lg font-bold font-mono text-white mt-1 block">24测点</span>
                <span className="text-[9px] text-amber-500 block mt-0.5">▲ B区微漏</span>
              </div>
              <div className="p-3 bg-[#171d2b] rounded-xl border border-gray-800 text-center">
                <span className="text-gray-400 text-[10px] block font-medium">工地人脸闸道</span>
                <span className="text-lg font-bold font-mono text-white mt-1 block">6个通道</span>
                <span className="text-[9px] text-emerald-400 block mt-0.5">● 全天纳管</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#1b2234] border border-indigo-950/50 rounded-xl mt-4 flex flex-col md:flex-row items-center justify-between text-xs gap-3">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <span className="text-indigo-200 font-semibold block">想要快速自检边缘监测算法吗？</span>
                <p className="text-indigo-400/80 text-[11px] mt-0.5">点击转到“AI视频预警”功能，支持一键人工模拟生成 17 种场景的边缘监控事件！</p>
              </div>
            </div>
            <button 
              onClick={() => onNavigateToTab("warning")}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-4 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition shrink-0 whitespace-nowrap"
            >
              <Play className="h-3 w-3 fill-white" /> 触发IoT模拟
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
