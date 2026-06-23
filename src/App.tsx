import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, ShieldAlert, Tv, CheckCircle, Smartphone, HardDrive, 
  Users, Activity, Wifi, AlertTriangle, ShieldCheck, Battery, RefreshCw, Cpu 
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import WarningPlatform from "./components/WarningPlatform";
import VideoAggregator from "./components/VideoAggregator";
import HazardManager from "./components/HazardManager";
import MobileAppSim from "./components/MobileAppSim";
import DeviceManager from "./components/DeviceManager";
import EnterpriseOrg from "./components/EnterpriseOrg";
import { fetchStats } from "./lib/api";

type TabID = 'dashboard' | 'warning' | 'video' | 'hazard' | 'mobile' | 'device' | 'org';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabID>('dashboard');
  
  // Real-time synchronization token passing to keep state responsive on submissions
  const [stats, setStats] = useState({
    totalHazards: 0,
    rectifying: 0,
    retesting: 0,
    resolvedRate: 0,
    activeWarnings: 0,
    activeCameras: 0
  });

  const [triggerCount, setTriggerCount] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  const updateStats = async () => {
    try {
      const liveStats = await fetchStats();
      setStats(liveStats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    updateStats();
    // Start live clock ticking
    const clockInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleString("zh-CN", { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
      }));
    }, 1000);

    return () => clearInterval(clockInterval);
  }, [triggerCount]);

  const triggerGlobalStatsReload = () => {
    setTriggerCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#0b0e17] text-gray-200 flex flex-col font-sans select-none antialiased">
      
      {/* Executive Core Corporate Banner (北港建司集团标头架) */}
      <header className="bg-[#101422] border-b border-gray-800/80 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-40 shadow-md">
        
        {/* Brand details */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-md shadow-indigo-600/10">
            北建
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-white font-bold text-[14px] sm:text-base tracking-wide">北港建司安全管理系统</span>
              <span className="bg-red-500/15 border border-red-950 text-red-400 text-[9px] px-1.5 py-0.5 rounded font-bold animate-pulse font-mono flex items-center gap-0.5">
                ● H1 安全运行中
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              北港智能建造管理平台二期 · 依托AI智能视频分析及移动大闭环防护
            </p>
          </div>
        </div>

        {/* Real-time Telemetry state tags */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          
          {/* Active warnings state icon */}
          <div className="bg-[#181d2f]/80 px-2.5 py-1 rounded-md border border-gray-800 flex items-center space-x-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-505 bg-red-500 animate-ping"></span>
            <span className="text-gray-400 text-[10px]">实时告警:</span>
            <span className="text-red-400 font-bold">{stats.activeWarnings}件</span>
          </div>

          <div className="bg-[#181d2f]/80 px-2.5 py-1 rounded-md border border-gray-800 flex items-center space-x-1.5 hidden md:flex">
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-gray-400 text-[10px]">边缘AP NPU:</span>
            <span className="text-indigo-400 font-bold">18.5 TOPS 负载</span>
          </div>

          {/* Database synchronized status banner */}
          <div className="bg-[#181d2f]/80 px-2.5 py-1 rounded-md border border-gray-800 flex items-center space-x-1.5">
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-[10px] font-bold">已同步国网</span>
          </div>

          {/* Clock */}
          <div className="bg-[#151a2c] text-[#a0afc7] text-[11px] px-3 py-1 rounded-md font-bold border border-gray-800/60 shadow-inner">
            {currentTime || "获取中..."}
          </div>

        </div>

      </header>

      {/* Main layout container with full modular navigation */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        
        {/* Navigation row inside main area */}
        <div className="flex flex-wrap gap-2 pb-2 mr-2 select-none">
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition ${
              activeTab === 'dashboard' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-500 shadow-md shadow-indigo-600/10' 
                : 'bg-[#101422] border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            安全大屏仪表盘
          </button>

          <button 
            onClick={() => setActiveTab('warning')}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition ${
              activeTab === 'warning' 
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-500 shadow-md' 
                : 'bg-[#101422] border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            安全预警与AI模拟
          </button>

          <button 
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition ${
              activeTab === 'video' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-500 shadow-md' 
                : 'bg-[#101422] border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Tv className="h-4 w-4" />
            视频监控汇聚舱
          </button>

          <button 
            onClick={() => setActiveTab('hazard')}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition ${
              activeTab === 'hazard' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-500 shadow-md' 
                : 'bg-[#101422] border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            标准闭环处置中心
          </button>

          <button 
            onClick={() => setActiveTab('mobile')}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition ${
              activeTab === 'mobile' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-500 shadow-md' 
                : 'bg-[#101422] border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            移动端协同沙盒 (随手拍)
          </button>

          <button 
            onClick={() => setActiveTab('device')}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition ${
              activeTab === 'device' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-500 shadow-md' 
                : 'bg-[#101422] border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <HardDrive className="h-4 w-4" />
            IoT设备联动准入
          </button>

          <button 
            onClick={() => setActiveTab('org')}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition ${
              activeTab === 'org' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-500 shadow-md' 
                : 'bg-[#101422] border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            安全组织与特工持证库
          </button>

        </div>

        {/* View body render with dynamic transitions */}
        <div className="transition-opacity duration-200">
          
          {activeTab === 'dashboard' && (
            <Dashboard 
              triggerRefreshToggle={triggerCount % 2 === 0} 
              onNavigateToTab={(tab: any) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'warning' && (
            <WarningPlatform 
              onRefreshStats={triggerGlobalStatsReload} 
            />
          )}

          {activeTab === 'video' && (
            <VideoAggregator />
          )}

          {activeTab === 'hazard' && (
            <HazardManager 
              onRefreshStats={triggerGlobalStatsReload}
              triggerRefreshToggle={triggerCount % 2 === 0}
            />
          )}

          {activeTab === 'mobile' && (
            <MobileAppSim 
              onReportSuccess={triggerGlobalStatsReload}
            />
          )}

          {activeTab === 'device' && (
            <DeviceManager />
          )}

          {activeTab === 'org' && (
            <EnterpriseOrg />
          )}

        </div>

      </main>

      {/* Standard brand footer */}
      <footer className="bg-[#101422] border-t border-gray-800/80 px-6 py-4 mt-12 text-center text-[10px] text-gray-500 select-none">
        <p>© 2026 北港智能建造管理系统二期研发项目组 · 版权归北港建司所有</p>
        <p className="mt-1">
          符合国家安全防灾标准与《数字工地和劳务人员职业危险实时追查标准条规通用技术指南》
        </p>
      </footer>

    </div>
  );
}
