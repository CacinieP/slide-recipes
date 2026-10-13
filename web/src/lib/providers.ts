import type { ModelConfig } from "./types";

export interface ProviderPreset {
  id: string;
  name: string;
  badge: string;
  baseUrl: string;
  defaultModel: string;
  models: { id: string; name: string; desc?: string }[];
  keyPlaceholder: string;
  docUrl: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "modelbest",
    name: "ModelBest (面壁智能)",
    badge: "MiniCPM",
    baseUrl: "https://api.modelbest.cn/v1",
    defaultModel: "MiniCPM-V-4.7-35B-A3B",
    models: [
      { id: "MiniCPM-V-4.7-35B-A3B", name: "MiniCPM-V-4.7-35B-A3B", desc: "高性价比、结构化规划精准" },
      { id: "MiniCPM-4-35B-A3B", name: "MiniCPM-4-35B-A3B", desc: "35B 密集推理" },
    ],
    keyPlaceholder: "sk-live-...",
    docUrl: "https://modelbest.cn",
  },
  {
    id: "stepfun",
    name: "StepFun (阶跃星辰)",
    badge: "Step",
    baseUrl: "https://api.stepfun.com/v1",
    defaultModel: "step-2-16k",
    models: [
      { id: "step-2-16k", name: "step-2-16k", desc: "旗舰商业多任务" },
      { id: "step-1-8k", name: "step-1-8k", desc: "高效快速生成" },
      { id: "step-1-flash", name: "step-1-flash", desc: "极速低延迟响应" },
    ],
    keyPlaceholder: "sk-...",
    docUrl: "https://platform.stepfun.com",
  },
  {
    id: "kimi",
    name: "Moonshot AI (Kimi)",
    badge: "Kimi",
    baseUrl: "https://api.moonshot.cn/v1",
    defaultModel: "moonshot-v1-8k",
    models: [
      { id: "moonshot-v1-8k", name: "moonshot-v1-8k", desc: "标准长文商业分析" },
      { id: "moonshot-v1-32k", name: "moonshot-v1-32k", desc: "中长文档大纲提炼" },
      { id: "moonshot-v1-128k", name: "moonshot-v1-128k", desc: "超长报告与材料总结" },
    ],
    keyPlaceholder: "sk-...",
    docUrl: "https://platform.moonshot.cn",
  },
  {
    id: "zhipu",
    name: "Zhipu AI (智谱清言)",
    badge: "GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-4-plus",
    models: [
      { id: "glm-4-plus", name: "glm-4-plus", desc: "旗舰高智商分析" },
      { id: "glm-4-air", name: "glm-4-air", desc: "高性价比快速响应" },
      { id: "glm-4-flash", name: "glm-4-flash", desc: "免费高吞吐版" },
    ],
    keyPlaceholder: "your-zhipu-api-key",
    docUrl: "https://open.bigmodel.cn",
  },
  {
    id: "minimax",
    name: "MiniMax (稀宇科技)",
    badge: "abab",
    baseUrl: "https://api.minimax.chat/v1",
    defaultModel: "abab6.5s-chat",
    models: [
      { id: "abab6.5s-chat", name: "abab6.5s-chat", desc: "高性价比商业逻辑规划" },
      { id: "abab6.5-chat", name: "abab6.5-chat", desc: "旗舰大语言模型" },
    ],
    keyPlaceholder: "sk-api-...",
    docUrl: "https://api.minimax.chat",
  },
  {
    id: "qwen",
    name: "Alibaba Cloud (通义千问 / 百炼)",
    badge: "Qwen",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen-max",
    models: [
      { id: "qwen-max", name: "qwen-max", desc: "百炼千亿级旗舰认知" },
      { id: "qwen-plus", name: "qwen-plus", desc: "商业咨询与分析主力" },
      { id: "qwen-turbo", name: "qwen-turbo", desc: "毫秒级响应极速版" },
      { id: "qwen2.5-72b-instruct", name: "qwen2.5-72b-instruct", desc: "开源旗舰开源版" },
    ],
    keyPlaceholder: "sk-...",
    docUrl: "https://bailian.console.aliyun.com",
  },
  {
    id: "openai",
    name: "OpenAI / 兼容中转",
    badge: "GPT",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    models: [
      { id: "gpt-4o", name: "gpt-4o", desc: "多模态旗舰级推理" },
      { id: "gpt-4o-mini", name: "gpt-4o-mini", desc: "轻量高速商业模型" },
    ],
    keyPlaceholder: "sk-...",
    docUrl: "https://platform.openai.com",
  },
  {
    id: "custom",
    name: "Custom (自定义 Endpoint)",
    badge: "Self-Host",
    baseUrl: "",
    defaultModel: "",
    models: [],
    keyPlaceholder: "sk-...",
    docUrl: "",
  },
];

export const DEFAULT_PROVIDER_ID = "modelbest";
