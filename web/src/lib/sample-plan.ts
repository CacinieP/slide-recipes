import type { DeckPlan } from "./types";

/**
 * A believable seeded deck used by the "载入示例" path so first-time visitors
 * can preview, edit and export a real PPTX without any API key.
 * Content is illustrative and labeled as such in the UI.
 */
export const SAMPLE_PLAN: DeckPlan = {
  title: "山雾咖啡 · 2027 年度经营规划",
  slides: [
    {
      type: "cover",
      title: "山雾咖啡 2027 年度经营规划",
      bullets: ["从区域连锁到城市精品品牌的三年路径", "战略与运营联席会 · 示例大纲"],
    },
    {
      type: "executiveSummary",
      title: "核心决策：聚焦单店模型，再谈扩张",
      decision: "2027 年放缓开店节奏，把资源集中到单店盈利模型与会员复购。",
      evidence: [
        "现有 12 家门店中 8 家实现月度盈亏平衡",
        "会员 90 天复购率 41%，高于行业均值约 15 个百分点",
        "新店爬坡期平均 7.5 个月，现金流压力显著",
      ],
      nextStep: "Q1 完成单店模型手册，Q2 评审后再定开店数量",
    },
    {
      type: "kpiDashboard",
      title: "2026 关键指标回顾",
      items: [
        { label: "年度营收", value: "¥4,860 万", change: "+23%", context: "同比" },
        { label: "会员复购率", value: "41%", change: "+6pt", context: "90 天口径" },
        { label: "单店月均利润", value: "¥3.2 万", change: "+18%", context: "平衡门店" },
        { label: "客单价", value: "¥38.5", change: "-2%", context: "受促销影响" },
      ],
      note: "数据来源：门店 POS 与会员系统（示例数据）",
    },
    {
      type: "processFlow",
      title: "单店模型打磨路径",
      steps: [
        { title: "诊断", body: "逐店拆解成本结构与高峰时段产能" },
        { title: "标准化", body: "出品、排班、采购三套 SOP 落到门店" },
        { title: "验证", body: "3 家试点店跑通 90 天利润目标" },
        { title: "复制", body: "形成手册后再启动新店选址评审" },
      ],
    },
    {
      type: "comparison",
      title: "扩张节奏：两种方案对比",
      columns: ["激进扩张", "模型优先"],
      rows: [
        { label: "2027 新店数", values: ["8 家", "3 家"] },
        { label: "资金峰值压力", values: ["高", "可控"] },
        { label: "品牌稀释风险", values: ["较高", "低"] },
        { label: "长期复利", values: ["依赖融资", "依赖复购"] },
      ],
      verdict: "建议采用模型优先方案，保留 Q3 一次加速窗口",
    },
    {
      type: "milestoneTimeline",
      title: "2027 里程碑",
      milestones: [
        { date: "Q1", title: "单店模型手册 v1", status: "doing" },
        { date: "Q2", title: "3 家试点店验证", status: "todo" },
        { date: "Q3", title: "会员体系 2.0 上线", status: "todo" },
        { date: "Q4", title: "年度复盘与扩张评审", status: "todo" },
      ],
    },
    {
      type: "closing",
      title: "下一步：确认模型优先路线",
      action: "本周内确认试点门店名单与预算上限",
      contact: "战略组 · strategy@shanwu.example",
    },
  ],
};