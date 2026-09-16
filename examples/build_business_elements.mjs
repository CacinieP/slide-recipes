import pptxgen from 'pptxgenjs';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createCommercialRecipe } from '../skills/themed-cn-pptx/recipes/recipe-commercial.mjs';
export function buildBusinessElements(pres, options = {}) {
 const r=createCommercialRecipe(pres,'editorial-proposal',{label:'商业元素库 · 内容与数据均为虚构示例',fontFace:process.env.PPT_FONT||'Microsoft YaHei',palette:'navy-teal',...options});
 r.executiveSummary({title:'先验证需求，再扩大投入',decision:'聚焦一个\n核心场景',evidence:['用户问题已经识别','方案仍需小范围验证','交付能力可以逐步复用'],nextStep:'下一步：产品负责人组织首轮验证，输出决策简报。',page:1});
 r.kpiDashboard({title:'用同一口径看业务健康度',items:[
  {label:'月活跃团队',value:'1,280',change:'环比 +12%',context:'示例 · 团队数'},
  {label:'30 天留存',value:'86%',change:'环比 +3 pp',context:'示例 · 新增队列'},
  {label:'平均交付周期',value:'8 天',change:'环比减少 2 天',context:'示例 · 已交付项目'},
 ],note:'虚构演示数据 · 2026 年 8 月 · 环比同口径；pp 为百分点',page:2});
 r.processFlow({title:'把交付过程变成明确的责任链',steps:[
  {title:'发现',body:'访谈与资料审阅'}, {title:'定义',body:'确认范围与指标'}, {title:'交付',body:'生成可编辑成果'}, {title:'复盘',body:'记录效果与改进'},
 ],note:'每阶段需要负责人、输出物和验收条件。',page:3});
 r.funnel({title:'先找到转化损失最大的阶段',stages:[{label:'访问',value:10000},{label:'注册',value:6400},{label:'激活',value:3200},{label:'付费',value:1200}],note:'虚构数据 · 同一队列 · 30 天 · 单位：人',page:4});
 r.gantt({title:'把依赖关系落实到时间计划',periods:['W1','W2','W3','W4','W5','W6'],tasks:[
  {label:'访谈 / 产品',start:0,end:1},{label:'原型 / 设计',start:1,end:2},{label:'开发 / 工程',start:2,end:4},{label:'验收 / 业务',start:4,end:5},
 ],note:'示例计划 · 一格为一周 · 依赖与负责人需在项目简报中明确',page:5});
 r.quadrant({title:'先做高影响、低成本的工作',xLabel:'投入成本：低 → 高',yLabel:'业务影响：低 → 高',points:[
  {label:'优化关键入口',x:.18,y:.78},{label:'统一指标口径',x:.32,y:.56},{label:'建设新平台',x:.82,y:.88},{label:'更新装饰素材',x:.22,y:.16},
 ],note:'示例主观评分 · 归一化 0–1 · 仅用于讨论优先级',page:6});
 r.swot({title:'把内部条件与外部变化分开看',strengths:['行业知识积累','交付流程可复用'],weaknesses:['团队规模有限','渠道覆盖不足'],opportunities:['客户需求集中','新技术降低成本'],threats:['竞争者降价','需求周期变化'],page:7});
 r.team({title:'让关键职责对应到具体的人',people:[
  {name:'林岚',initials:'LL',role:'项目负责人',bio:'范围、节奏与客户协同'},
  {name:'周宁',initials:'ZN',role:'设计负责人',bio:'视觉系统与内容表达'},
  {name:'陈序',initials:'CX',role:'技术负责人',bio:'实施、验证与交付质量'},
 ],note:'虚构角色 · 字母标识不代表真实头像；实际项目请替换为真实团队。',page:8});
 r.pricing({title:'按服务范围选择合适的方案',plans:[
  {name:'基础',price:'¥8,000',period:'每项目 · 示例价',features:['内容整理','一轮修改']},
  {name:'标准',price:'¥16,000',period:'每项目 · 示例价',recommended:true,features:['策略工作坊','视觉规范','两轮修改']},
  {name:'定制',price:'按需报价',period:'按书面范围确认',features:['复杂数据表达','交付培训']},
 ],note:'虚构报价 · 币种 CNY · 未含税与第三方素材；追加范围另议',page:9});
 r.testimonial({title:'让客户的原话支持价值主张',quote:'现在，我们能围绕同一份信息做决定。',author:'示例客户 / 林女士',role:'业务负责人（虚构人物）',source:'虚构证言，仅示范版式 · 正式交付需真实引文、来源与使用授权',page:10});
 return pres;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 const output=resolve(process.argv[2]||'examples/slides/output/business-elements.pptx');await mkdir(dirname(output),{recursive:true});
 const pres=new pptxgen();buildBusinessElements(pres);await pres.writeFile({fileName:output});console.log(output);
}
