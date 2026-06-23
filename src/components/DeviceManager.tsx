import React, { useState, useEffect } from "react";
import { fetchCameras, fetchEdgeBoxes, fetchLogs } from "../lib/api";
import { Camera, EdgeBox } from "../types";
import { HardDrive, Server, Cpu, RefreshCw, Layers, Plus, ShieldCheck, ToggleLeft, ToggleRight, Radio } from "lucide-react";

export default function DeviceManager() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [boxes, setBoxes] = useState<EdgeBox[]>([]);
  const [loading, setLoading] = useState(false);

  // Linkage config states
  const [confirmPriorLinkage, setConfirmPriorLinkage] = useState(true);
  const [sprayLinkage, setSprayLinkage] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cData, bData] = await Promise.all([
        fetchCameras(),
        fetchEdgeBoxes()
      ]);
      setCameras(cData);
      setBoxes(bData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="bg-[#121620] border border-gray-800 rounded-xl p-6 shadow-sm min-h-[500px]">
      
      {/* 头部标题 */}
      <div className="pb-5 border-b border-gray-810/80 mb-6">
        <h2 className="text-white text-lg font-bold flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-indigo-400" />
          IoT设备物联网综合准入与联动中心
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          直连施工现场摄像头、NVR磁盘机、边缘计算AI算力箱、远置声光报警柱与现场电工闸门等基础I/O设施
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        
        {/* Box (算力边缘盒) Monitoring */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#151c27] border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-white text-sm font-semibold flex items-center gap-2">
              <Server className="h-4.5 w-4.5 text-indigo-400" /> 边缘计算算力AI控制箱监测 ({boxes.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boxes.map(box => (
                <div key={box.id} className="bg-gray-900/40 border border-gray-800 p-4 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-bold text-xs">{box.name}</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono block">IP：{box.ip} · 算力路数并发限控: {box.capacity}</span>
                  </div>

                  {/* Meters Load percentages */}
                  <div className="space-y-2 text-[10px] text-gray-400 font-mono">
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span>CPU 活性负载</span>
                        <span>{box.cpuLoad}%</span>
                      </div>
                      <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full" style={{ width: `${box.cpuLoad}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span>NPU AI加速负载</span>
                        <span>{box.npuLoad}%</span>
                      </div>
                      <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full" style={{ width: `${box.npuLoad}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Camera sensors monitoring list summary */}
          <div className="bg-[#151c27] border border-gray-800 rounded-xl p-5">
            <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-indigo-400" /> 各临时施工摄像头防区心跳概览
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs select-none">
              {cameras.map(c => (
                <div key={c.id} className="p-3 bg-gray-900/30 rounded-lg border border-gray-850 flex justify-between items-center">
                  <div>
                    <span className="text-gray-300 font-semibold block truncate max-w-[105px]">{c.name}</span>
                    <span className="text-[9px] text-[#55698b] block font-mono">{c.code}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    c.status === 'online' ? "bg-emerald-950/40 text-emerald-400" : "bg-gray-850 text-gray-500"
                  }`}>
                    {c.status === 'online' ? "ONLINE" : "OFF"}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Linkage Alarming trigger profile rule panel */}
        <div className="lg:col-span-1 bg-[#161c28] border border-gray-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-gray-800 pb-3">
            <h3 className="text-white text-sm font-bold flex items-center gap-1.5">
              <Radio className="h-4.5 w-4.5 text-red-400" />
              现场报警联动触发表
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5 font-sans">规则引擎：AI算力盒在监测后，针对危险源分贝和继强联动动作的锁定状态</p>
          </div>

          <div className="space-y-4 text-xs font-sans">
            
            <div className="p-3 bg-indigo-950/10 border border-indigo-900 rounded-lg space-y-1">
              <span className="text-indigo-300 font-bold block text-[11px]">【工业声光警报器物理锁联】</span>
              <p className="text-gray-400 text-[10px] leading-relaxed">
                视频捕获到安全帽缺失/明火后，自动发出开关量给电箱现场警报柱，声音达100分贝极速惊醒作业工友。
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 hover:bg-gray-900 rounded-lg transition">
                <div>
                  <span className="text-gray-200 block font-medium">1. 人工干预二次核实（双扣闭锁）</span>
                  <span className="text-[10px] text-gray-500 block">AI报错后，安全员在手机上确认真实性才会触发高爆扬声器。避免风吹造成的环境误报。</span>
                </div>
                <button 
                  onClick={() => setConfirmPriorLinkage(!confirmPriorLinkage)}
                  className="shrink-0 text-indigo-400"
                >
                  {confirmPriorLinkage ? <ToggleRight className="h-9 w-9 text-indigo-500" /> : <ToggleLeft className="h-9 w-9 text-gray-600" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-2 hover:bg-gray-900 rounded-lg transition">
                <div>
                  <span className="text-gray-200 block font-medium">2. 烟火联动自触发高压洒水/喷淋</span>
                  <span className="text-[10px] text-gray-500 block">一旦侦测到重烟重火点（置信度高且触发），在服务器无响应的0.1秒内自触发水阀灌沙锁。</span>
                </div>
                <button 
                  onClick={() => setSprayLinkage(!sprayLinkage)}
                  className="shrink-0 text-indigo-400"
                >
                  {sprayLinkage ? <ToggleRight className="h-9 w-9 text-indigo-500" /> : <ToggleLeft className="h-9 w-9 text-gray-600" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-red-950/20 border border-red-900 text-red-400 text-[10px] rounded space-y-1">
              <span className="font-bold flex items-center gap-1">🚨 集团消防演习联动保护声明</span>
              <p className="leading-relaxed opacity-85">
                此中控物联网开关出厂绑定在“北海分公司化学仓库特种喷头”，请在现场电工不驻留的情况下禁止测试高压联动灌水设备，以防污染防区存卷。
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
