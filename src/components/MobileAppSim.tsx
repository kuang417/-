import React, { useState } from "react";
import { 
  Camera, MapPin, Send, AlertTriangle, CheckCircle, Smartphone, 
  Sparkles, HelpCircle, User, Info, ArrowUpRight 
} from "lucide-react";
import { createHazard } from "../lib/api";

const MOCK_LOCAL_HAZARD_TEMPLATES = [
  { title: "3号楼脚手架扣件松脱滑丝", desc: "由于雨雪天生锈锈蚀，有滑落临边危险", basis: "建筑安全工程脚手架扣件防脱滑规定", image: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=500", loc: "3号楼施工层西侧临边" },
  { title: "高低配电室消防门被沙土杂物堆占", desc: "消防通道有障碍物堆砌，不符合畅通标准", basis: "中华人民共和国消防法通道保通条例", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500", loc: "配电室南向生命过道" }
];

export default function MobileAppSim({ onReportSuccess }: { onReportSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [riskLevel, setRiskLevel] = useState<'一般隐患' | '重大隐患'>('一般隐患');
  const [desc, setDesc] = useState("");
  const [basis, setBasis] = useState("");
  
  // Choose photo
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [reporting, setReporting] = useState(false);

  const handleTemplateSelect = (idx: number) => {
    const tmpl = MOCK_LOCAL_HAZARD_TEMPLATES[idx];
    setTitle(tmpl.title);
    setDesc(tmpl.desc);
    setBasis(tmpl.basis);
    setLocation(tmpl.loc);
    setSelectedPhotoIndex(idx);
  };

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location || !desc) {
      alert("请输入隐患名称、位置与危害事实详情！");
      return;
    }

    try {
      setReporting(true);
      const testImage = MOCK_LOCAL_HAZARD_TEMPLATES[selectedPhotoIndex].image;
      await createHazard({
        title,
        hazardObject: `${title}隐患部件`,
        hazardDescription: desc,
        hazardBasis: basis || "一期北港智慧建造通用标准规定",
        riskLevel,
        improvementSuggestion: "排专职电工进行绝缘矫直，阻绝泥水反酸，清理临边杂物堆砌，恢复绿色安防警网。",
        location,
        reporter: "李少坤(班组巡检安全员-微信随手拍)",
        imageUrl: testImage
      });

      alert("🎉 随手拍已实时接收！AI系统与总部安全大屏数据已动态同步联动，该工单将即刻推送给‘责任整改管理人’微信/钉钉处理！");
      
      // Reset form
      setTitle("");
      setDesc("");
      setBasis("");
      setLocation("");
      
      onReportSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="bg-[#121620] border border-gray-800 rounded-xl p-6 shadow-sm min-h-[500px]">
      
      {/* Platform Title */}
      <div className="pb-5 border-b border-gray-810/80 mb-6">
        <h2 className="text-white text-lg font-bold flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-indigo-400" />
          微信/钉钉移动微端随手拍仿真沙盒
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          真实模拟现场施工队人员、质监安全员使用智能手机现场抓拍、隐患上报、流转即办的小微协同端
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
        
        {/* Mock SmartPhone UI frame outer wrap */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-80 h-[560px] bg-black border-[10px] border-gray-850 rounded-[40px] shadow-2xl p-0 overflow-hidden flex flex-col justify-between">
            
            {/* Phone Speaker & Camera Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-5 bg-black rounded-b-2xl z-20 flex items-center justify-center space-x-2">
              <span className="w-16 h-1 bg-gray-800 rounded-full"></span>
              <span className="w-2 h-2 bg-gray-900 rounded-full"></span>
            </div>

            {/* Inner App Stream */}
            <div className="flex-1 bg-[#f4f6fa] pt-8 pb-4 px-3 overflow-y-auto space-y-3 flex flex-col justify-between">
              
              {/* DingTalk App header banner */}
              <div>
                <div className="flex items-center justify-between bg-indigo-600 p-3 rounded-xl text-white shadow-md">
                  <div>
                    <span className="text-[10px] opacity-75 block font-bold tracking-wider">北港建司 · 随手拍微应用</span>
                    <span className="text-xs font-semibold block mt-0.5">工地现场隐患快报端</span>
                  </div>
                  <Sparkles className="h-4 w-4 animate-spin" />
                </div>

                <form onSubmit={handleMobileSubmit} className="bg-white rounded-xl p-3 shadow-xs border border-gray-100 space-y-2.5 mt-3 text-gray-800">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5 font-bold">1. 隐患名称/类别 (选择建议快选台模板)</label>
                    <input 
                      type="text" 
                      placeholder="例：配电箱门漏接水"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs rounded p-1.5 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5 font-bold">2. 隐患发现点位/栋数防区</label>
                    <input 
                      type="text" 
                      placeholder="例：2号楼西侧施工电梯口"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs rounded p-1.5 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-0.5 font-bold">3. 判定隐患严重级</label>
                      <select 
                        value={riskLevel}
                        onChange={(e: any) => setRiskLevel(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-xs rounded p-1.5 outline-none"
                      >
                        <option value="一般隐患">一般隐患</option>
                        <option value="重大隐患">重大隐患</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 block mb-0.5 font-bold">4. 规范判定条款文</label>
                      <input 
                        type="text" 
                        placeholder="规范依据..."
                        value={basis}
                        onChange={(e) => setBasis(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-xs rounded p-1.5 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5 font-bold">5. 危害事实详情描述信息</label>
                    <textarea 
                      rows={2}
                      placeholder="文字阐明：高空临边缺防护网，施工工人冒险越线..."
                      required
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-xs rounded p-1.5 outline-none resize-none"
                    />
                  </div>

                  {/* Thumbnail simulation */}
                  <div>
                    <span className="text-[10px] text-gray-500 block mb-1 font-bold">6. 隐患实拍实录相机物证</span>
                    <div className="flex items-center space-x-2">
                      <div className="h-10 w-14 bg-gray-100 rounded border border-gray-200 overflow-hidden relative">
                        <img 
                          src={MOCK_LOCAL_HAZARD_TEMPLATES[selectedPhotoIndex].image} 
                          alt="preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[9px] text-[#55698b]">现场直拍照片联动({selectedPhotoIndex === 0 ? "3号楼脚手架" : "2号配电室"})</span>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={reporting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg transition tracking-wide flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Send className="h-3 w-3" />
                    {reporting ? "移动数据提交中..." : "上报隐患(派发PC及协同)"}
                  </button>

                </form>
              </div>

              {/* Status bar mock footer */}
              <div className="text-center font-sans">
                <span className="text-[9px] text-gray-400">数字北港建造安全部提供底层技术开发 · V1.4.2</span>
              </div>

            </div>

            {/* Bottom swipe-down home bar */}
            <div className="h-8 bg-black flex items-center justify-center">
              <span className="w-24 h-1 bg-gray-800 rounded-full"></span>
            </div>

          </div>
        </div>

        {/* Right side helper fast-templates to populate mock camera rolls */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#151a24] p-5 border border-gray-800 rounded-xl space-y-4">
            
            <div>
              <h3 className="text-white text-xs font-bold leading-normal flex items-center gap-1">
                <Info className="h-4.5 w-4.5 text-indigo-400" />
                第一步：快捷导入现场实勘模本 (快速预填仿真)
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">请任选一个工地实勘的抓拍情景，系统将一键将“实拍图片”、“判定理由”和“违章地址”注入手机中以自测流程！</p>
            </div>

            <div className="space-y-2.5 text-xs">
              {MOCK_LOCAL_HAZARD_TEMPLATES.map((tmpl, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleTemplateSelect(idx)}
                  className="p-3 bg-gray-900 hover:bg-[#1a2232] rounded-lg border border-gray-800 flex justify-between items-start cursor-pointer transition"
                >
                  <div className="space-y-1">
                    <span className="text-indigo-400 font-bold block">{tmpl.title}</span>
                    <p className="text-gray-400 text-[10px] leading-relaxed">{tmpl.desc}</p>
                    <span className="text-[9px] text-gray-500 font-mono block">防区定位：{tmpl.loc}</span>
                  </div>
                  <img 
                    src={tmpl.image} 
                    alt="sample" 
                    referrerPolicy="no-referrer"
                    className="w-12 h-10 object-cover rounded border border-gray-800 shrink-0 shadow-sm ml-2"
                  />
                </div>
              ))}
            </div>

            <div className="bg-[#1f2535]/30 p-3 rounded-lg border border-gray-800/80 text-[11px] text-gray-400 space-y-1.5 leading-relaxed font-sans">
              <span className="text-indigo-300 font-semibold block">📱 随手拍机制如何流转？</span>
              <p>1. 安全员现场自勘，挑选本级模板或手打内容并在手机端点击“上报”。</p>
              <p>2. 系统无延迟地将该隐患推送给“正式安全工单中心”台账列中。</p>
              <p>3. 责任班组将在微信/钉钉接收此隐患做就地整改并反馈。您可以切换到 PC tab “闭环处置中心”看到该随手拍并进行验收办理关闭！</p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
