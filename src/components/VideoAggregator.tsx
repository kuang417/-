import React, { useState, useEffect, useRef } from "react";
import { 
  Grid, Play, Pause, Search, RefreshCw, AlertTriangle, ScreenShare, 
  Tv, VolumeX, Volume2, Maximize, Plus, Filter, HardDrive, LayoutGrid, LayoutGrid as LayoutGrid9
} from "lucide-react";
import { fetchCameras, createCamera, fetchOrgs } from "../lib/api";
import { Camera } from "../types";

const MOCK_CAM_VIDEO_LABELS = [
  "🚧 正在搬运：塔吊正在吊装预制墙板...",
  "🧤 监控中：脚手架扣件日常巡检中...",
  "🔒 危化库：正在严密警戒核心隔离区...",
  "🏗 钢筋棚：自动切割和重焊接生产中...",
  "🍽 生活区：食堂午餐卫生巡查全开...",
  "🧱 基础区：深基坑土石方自沉降侧位中..."
];

export default function VideoAggregator() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [gridSplit, setGridSplit] = useState<1 | 4 | 9 | 16>(4);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);

  // Video scrubber and play controls simulation
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackTime, setPlaybackTime] = useState("10:42:15");
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);
  const [scrubValue, setScrubValue] = useState(45);

  // New camera creation fields
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCamName, setNewCamName] = useState("");
  const [newCamCode, setNewCamCode] = useState("");
  const [newCamLoc, setNewCamLoc] = useState("");
  const [newCamProj, setNewCamProj] = useState("南宁北港智慧新城");

  const loadCameras = async () => {
    try {
      setLoading(true);
      const data = await fetchCameras();
      setCameras(data);
      if (data.length > 0) {
        setSelectedCameraId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCameras();
  }, []);

  const handleCreateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamName || !newCamLoc) return;
    try {
      await createCamera({
        name: newCamName,
        code: newCamCode || "CG-CG-MOCK",
        location: newCamLoc,
        project: newCamProj
      });
      setShowAddModal(false);
      setNewCamName("");
      setNewCamCode("");
      setNewCamLoc("");
      loadCameras();
      alert("🎉 新摄像头点位已全量接入总部视频汇聚大网物理登记！");
    } catch (e) {
      console.error(e);
    }
  };

  // Filtration logic
  const filteredCameras = cameras.filter(cam => {
    const s = searchQuery.toLowerCase();
    if (searchQuery && !cam.name.toLowerCase().includes(s) && !cam.code.toLowerCase().includes(s) && !cam.location.toLowerCase().includes(s)) return false;
    if (projectFilter !== "all" && cam.project !== projectFilter) return false;
    if (statusFilter !== "all" && cam.status !== statusFilter) return false;
    return true;
  });

  // Calculate grid list (duplicate up to standard slot requirements to show split-screen effects perfectly)
  const gridSlots = Array.from({ length: gridSplit }, (_, i) => {
    const cam = filteredCameras[i % filteredCameras.length];
    return { slotId: i, camera: cam };
  });

  return (
    <div className="bg-[#121620] border border-gray-800 rounded-xl p-6 shadow-sm min-h-[500px]">
      
      {/* 头部标题区 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-5 border-b border-gray-800 gap-4 mb-6">
        <div>
          <h2 className="text-white text-lg font-bold flex items-center gap-2">
            <Tv className="h-5 w-5 text-indigo-400" />
            施工现场视频监控集中汇聚监控舱
          </h2>
          <p className="text-xs text-gray-400 mt-1">支持摄像头统一集中配置纳管、集团级多网络多点位调流与自愈性分屏预览监控</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md transition"
          >
            <Plus className="h-4 w-4" /> 统一汇聚新摄像头点位
          </button>
        </div>
      </div>

      {/* 检索与多屏预览切换 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#151c27] rounded-xl border border-gray-800 mb-6 font-sans">
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="检索通道/编号/点位位置..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e2535] border border-gray-800 text-white text-xs rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
          />
        </div>

        {/* Project filtering option */}
        <div>
          <select 
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full bg-[#1e2535] border border-gray-800 text-white text-xs rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">所有施工区域/项目</option>
            <option value="南宁北港智慧新城">南宁北港智慧新城三期</option>
            <option value="防城港储煤码头">防城港储煤码头</option>
            <option value="北海保税冷链基地">北海保税冷链基地</option>
            <option value="钦州临港产业园">钦州临港产业园</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#1e2535] border border-gray-800 text-white text-xs rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">所有的在线状态</option>
            <option value="online">● 在线运行中</option>
            <option value="offline">○ 已停机或维护</option>
          </select>
        </div>

        {/* Layout screen selection buttons */}
        <div className="flex items-center justify-end space-x-2">
          <span className="text-xs text-gray-400 mr-2">画面分屏:</span>
          <button 
            onClick={() => setGridSplit(1)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${gridSplit === 1 ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-[#1e2535] border-gray-800 text-gray-400 hover:text-white'}`}
          >
            单屏
          </button>
          <button 
            onClick={() => setGridSplit(4)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${gridSplit === 4 ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-[#1e2535] border-gray-800 text-gray-400 hover:text-white'}`}
          >
            4画
          </button>
          <button 
            onClick={() => setGridSplit(9)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${gridSplit === 9 ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-[#1e2535] border-gray-800 text-gray-400 hover:text-white'}`}
          >
            9画
          </button>
          <button 
            onClick={() => setGridSplit(16)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer select-none transition ${gridSplit === 16 ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-[#1e2535] border-gray-800 text-gray-400 hover:text-white'}`}
          >
            16画
          </button>
        </div>

      </div>

      {/* 主屏视频栅格及播放控制拖动轴 */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left side: Cameras fast select list */}
        <div className="xl:col-span-1 bg-[#161c28] border border-gray-800 rounded-xl p-4 font-sans select-none max-h-[460px] overflow-y-auto">
          <div className="text-xs text-indigo-400 font-bold px-1.5 pb-2 border-b border-gray-800 mb-2">点位快捷列表 ({filteredCameras.length})</div>
          <div className="space-y-1">
            {filteredCameras.map((cam) => {
              const active = selectedCameraId === cam.id;
              return (
                <div 
                  key={cam.id}
                  onClick={() => {
                    if (cam.status === 'online') {
                      setSelectedCameraId(cam.id);
                    } else {
                      alert("⚠️ 【离线提示】该摄像头物理电源中断或断网故障，暂不支持单点拉流！");
                    }
                  }}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex items-center justify-between ${
                    active ? "bg-indigo-500/10 border-indigo-500 text-indigo-300" : "bg-[#1f2535]/40 border-gray-850 hover:border-gray-800 text-gray-400"
                  }`}
                >
                  <div className="max-w-[190px] truncate">
                    <span className="text-xs font-bold block truncate">{cam.name}</span>
                    <span className="text-[10px] text-gray-500 block truncate font-mono">{cam.code} · {cam.location}</span>
                  </div>
                  <span className={`h-2 w-2 rounded-full shrink-0 ${cam.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`}></span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side: Matrix screen blocks */}
        <div className="xl:col-span-3 space-y-4">
          
          <div className={`grid gap-3 transition-all duration-300 ${
            gridSplit === 1 ? "grid-cols-1 h-[360px]" : 
            gridSplit === 4 ? "grid-cols-2 h-[360px]" : 
            gridSplit === 9 ? "grid-cols-3 h-[380px]" : "grid-cols-4 h-[400px]"
          }`}>
            {gridSlots.map((slot) => {
              const cam = slot.camera;
              if (!cam) {
                return (
                  <div key={slot.slotId} className="bg-gray-950/80 rounded-xl border border-dashed border-gray-800 flex items-center justify-center text-gray-600 text-xs text-center">
                    通道未绑定
                  </div>
                );
              }

              const isOffline = cam.status === 'offline';
              const isFirstIndex = slot.slotId === 0;

              return (
                <div 
                  key={slot.slotId} 
                  className={`bg-black/90 rounded-xl border relative overflow-hidden flex flex-col justify-between p-3 select-none ${
                    selectedCameraId === cam.id ? "border-indigo-500 ring-1 ring-indigo-500/20" : "border-gray-800"
                  }`}
                >
                  {/* Floating labels name */}
                  <div className="z-10 bg-black/60 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-gray-300 font-mono flex items-center justify-between pointer-events-none">
                    <span className="truncate max-w-[120px] font-semibold">{cam.name}</span>
                    <span className="text-gray-500">{cam.code}</span>
                  </div>

                  {/* Simulated Camera live canvas display loop */}
                  {isOffline ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                      <AlertTriangle className="h-8 w-8 text-gray-600 mb-1" />
                      <span className="text-xs">【无视频源 / 极度断网】</span>
                      <span className="text-[10px] mt-0.5">请对 NVR、网闸接合处进行现场复位</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                      <div className="w-full text-center space-y-2">
                        {/* Dynamic overlay metrics */}
                        <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest animate-pulse font-mono">
                          ● LIVE FEED ACTIVE (60FPS)
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {MOCK_CAM_VIDEO_LABELS[slot.slotId % MOCK_CAM_VIDEO_LABELS.length]}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Safety overlays on corners */}
                  {!isOffline && (
                    <div className="z-10 flex items-center justify-between pointer-events-none">
                      <div className="bg-emerald-950/70 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider flex items-center gap-1">
                        <span>AI分析中</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {playbackTime}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time Scrubber timeline scrubber for playbacks (录像历史检索时间轴) */}
          <div className="bg-[#151a24] p-4 rounded-xl border border-gray-800 font-sans">
            <div className="flex flex-col sm:flex-row items-center justify-between text-xs gap-3 mb-2.5">
              <div className="flex items-center space-x-2.5">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition cursor-pointer"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5 fill-white" /> : <Play className="h-3.5 w-3.5 fill-white" />}
                </button>
                <button 
                  onClick={() => {
                    setIsPlaybackMode(!isPlaybackMode);
                    if(!isPlaybackMode) {
                      setPlaybackTime("10:15:30 (历史录像)");
                    } else {
                      setPlaybackTime("10:42:15");
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg border font-semibold text-[11px] transition cursor-pointer ${
                    isPlaybackMode ? "bg-indigo-500 text-white border-indigo-400" : "bg-gray-800 text-gray-300 hover:bg-gray-750 border-gray-700"
                  }`}
                >
                  {isPlaybackMode ? "已切入现场历史回放" : "切入单点历史视频轴"}
                </button>
              </div>

              <div className="flex items-center space-x-4 font-mono text-gray-400">
                <span className="text-[11px]">标出范围：00:00:00 —— 今天当前时间</span>
                <span className="text-[11px] bg-gray-800 text-white px-2 py-0.5 rounded font-bold">
                  {isPlaybackMode ? `回放帧：06-22 ${playbackTime}` : `当前帧：06-22 ${playbackTime}`}
                </span>
              </div>
            </div>

            {/* Simulated scrubber slider */}
            <div className="relative">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={scrubValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setScrubValue(val);
                  // Map back corresponding mock hours as output
                  const mockHour = Math.floor((val / 100) * 12) + 8;
                  const mockMin = Math.floor((val % 10) * 6);
                  setPlaybackTime(`${mockHour.toString().padStart(2, "0")}:${mockMin.toString().padStart(2, "0")}:15 (拖拽定位)`);
                }}
                className="w-full accent-indigo-500 h-1 bg-[#1e2535] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-600 font-mono mt-1 select-none pointer-events-none">
                <span>08:00 班前会</span>
                <span>10:30 主作业</span>
                <span>12:00 炊休防暴</span>
                <span>14:30 机械进出</span>
                <span>17:00 班后核算</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* DETAILED ADDMETA CAMERA MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 font-sans animate-fadeIn">
          <form onSubmit={handleCreateCamera} className="bg-[#181d2a] border border-gray-800 rounded-xl max-w-sm w-full p-6 text-xs text-gray-300 space-y-4">
            <div>
              <h3 className="text-white text-base font-bold flex items-center gap-1">
                <Tv className="h-5 w-5 text-indigo-400" />
                统一汇聚新摄像机参数设备
              </h3>
              <p className="text-gray-400 mt-1">登记新加装的现场临时摄像头流地址。</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-gray-400 block mb-1">设备通道名称*</label>
                <input 
                  type="text" 
                  required
                  placeholder="如：1号楼西侧施工梯门口"
                  value={newCamName}
                  onChange={(e) => setNewCamName(e.target.value)}
                  className="w-full bg-[#202737] border border-gray-800 rounded p-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">设备编码 (Code)*</label>
                <input 
                  type="text" 
                  required
                  placeholder="如：CG-SGT-08"
                  value={newCamCode}
                  onChange={(e) => setNewCamCode(e.target.value)}
                  className="w-full bg-[#202737] border border-gray-800 rounded p-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">安装位置/防区设定*</label>
                <input 
                  type="text" 
                  required
                  placeholder="如：2号楼梯前过道"
                  value={newCamLoc}
                  onChange={(e) => setNewCamLoc(e.target.value)}
                  className="w-full bg-[#202737] border border-gray-800 rounded p-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1">所属智慧工地项目部归类</label>
                <select 
                  value={newCamProj}
                  onChange={(e) => setNewCamProj(e.target.value)}
                  className="w-full bg-[#202737] border border-gray-800 rounded p-2 text-white outline-none"
                >
                  <option value="南宁北港智慧新城">南宁北港智慧新城三期</option>
                  <option value="防城港储煤码头">防城港储煤码头一期</option>
                  <option value="北海保税冷链基地">北海保税冷链基地</option>
                  <option value="钦州临港产业园">钦州临港产业园</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-800/80">
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="bg-gray-800 hover:bg-gray-750 text-gray-300 px-4 py-2 rounded font-semibold cursor-pointer"
              >
                取消
              </button>
              <button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded font-semibold cursor-pointer"
              >
                开始注册纳管
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
