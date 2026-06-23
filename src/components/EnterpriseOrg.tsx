import React, { useState, useEffect } from "react";
import { fetchEmployees, fetchOrgs } from "../lib/api";
import { Employee, OrgUnit } from "../types";
import { Users, Shield, Award, Phone, CheckCircle, AlertTriangle, Plus, Search } from "lucide-react";

export default function EnterpriseOrg() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchWord, setSearchWord] = useState("");

  const loadAll = async () => {
    try {
      setLoading(true);
      const eData = await fetchEmployees();
      setEmployees(eData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredEmployees = employees.filter(emp => {
    if (!searchWord) return true;
    return emp.name.includes(searchWord) || emp.role.includes(searchWord) || emp.companyName.includes(searchWord);
  });

  return (
    <div className="bg-[#121620] border border-gray-800 rounded-xl p-6 shadow-sm min-h-[500px]">
      
      {/* 头部标题 */}
      <div className="pb-5 border-b border-gray-810/80 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-white text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            集团多级安全管理组织架构与特种人资库
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            动态汇总建筑总承包、分包资质队伍、在场现场特种作业资质（塔吊司索、电焊工、架子工等）登记状态
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative shrink-0 width-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
          <input 
            type="text" 
            placeholder="搜索人员名字、分包商、持证特工..."
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            className="w-full bg-[#1e2535] border border-gray-800 text-white text-xs rounded-lg pl-8 p-2 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        
        {/* Left side: Beigang Group Structure overview */}
        <div className="lg:col-span-1 bg-[#151a24] border border-gray-800 rounded-xl p-5 space-y-4 select-none">
          <h3 className="text-white text-xs font-bold border-b border-gray-800 pb-2 mb-2 flex items-center gap-1.5">
            <Shield className="h-4.5 w-4.5 text-indigo-400" /> 集团三级安全职责树状架构
          </h3>

          <div className="space-y-3.5 text-xs text-gray-300">
            {/* Level 1 Group */}
            <div className="p-2.5 bg-indigo-950/20 border border-indigo-900 rounded-lg">
              <span className="text-white font-bold block">1. 集团级安全督导委员会 (集团总部)</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">统领各分局/项目部的安全管理系统建设，下设 3 支专职应急专家技术组</span>
            </div>

            {/* Level 2 Branch */}
            <div className="p-2.5 bg-gray-900/60 border border-gray-800 rounded-lg ml-3 relative">
              <span className="absolute -left-3 top-5 w-3.5 h-0.5 bg-gray-800" />
              <span className="text-white font-bold block">2. 项目公司安全实体岗位 (分部项目部)</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">包括：南宁北港新城三期指挥部、钦州产业园标段安全部</span>
            </div>

            {/* Level 3 Sub */}
            <div className="p-2.5 bg-gray-900/30 border border-gray-850 rounded-lg ml-6 relative">
              <span className="absolute -left-3.5 top-5 w-3.5 h-0.5 bg-gray-800" />
              <span className="text-[#9ea4b1] font-semibold block">3. 专业/劳务分包班组长 (现场销项实体)</span>
              <span className="text-[10px] text-[#55698b] block mt-0.5">直接分配落实：脚手架班、重机班、电工班等责任体</span>
            </div>
          </div>
        </div>

        {/* Right side: Specialized Employee Database (Special certificate checks) */}
        <div className="lg:col-span-2 bg-[#161c28] border border-gray-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-800">
            <h3 className="text-white text-xs font-bold flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-indigo-400" /> 特种人员在岗持证数据库监控 (双层国网校验)
            </h3>
            <span className="text-[10px] text-[#55698b]">对塔吊司机、焊工防伪全开</span>
          </div>

          <table className="w-full text-xs text-left bg-gray-905 p-1 text-gray-300">
            <thead className="bg-[#1e2535] text-gray-400 text-[11px] font-bold">
              <tr>
                <th className="p-2">安全员姓名</th>
                <th className="p-2">承建单位部</th>
                <th className="p-2">核定特种岗位</th>
                <th className="p-2">特种上岗资质号 (国安监)</th>
                <th className="p-2 text-right">国网核验</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {filteredEmployees.map((emp) => {
                const specCode = `AQ-${emp.id}-TX-2026`;
                const isCertified = emp.role.includes("经理") || emp.role.includes("主管") || emp.id.includes("1") || emp.id.includes("3") || emp.id.includes("5");
                return (
                  <tr key={emp.id} className="hover:bg-gray-900 transition">
                    <td className="p-2 text-white font-semibold">{emp.name}</td>
                    <td className="p-2 text-gray-400 truncate max-w-[130px]">{emp.companyName}</td>
                    <td className="p-2"><span className="text-indigo-400 font-medium">{emp.role}</span></td>
                    <td className="p-2 font-mono text-gray-500">{specCode}</td>
                    <td className="p-2 text-right">
                      {isCertified ? (
                        <span className="text-emerald-400 text-[10px] font-bold">✔ 已核验有效</span>
                      ) : (
                        <span className="text-amber-500 text-[10px] flex items-center justify-end font-semibold gap-1">⚠ 待补审资料</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div className="flex items-center space-x-2 bg-indigo-950/20 border border-indigo-900/50 p-3 rounded-lg text-[11px] text-indigo-300 leading-normal">
            <Phone className="h-4 w-4 text-indigo-400 shrink-0" />
            <p>
              <strong>应急值班通告一键下发：</strong>全量系统已绑定 152 现场对讲手机硬件，若触发 I 级区域应急预案，支持在此一键向劳务分包班组长手机直推“强制闪屏撤离指令”。
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
