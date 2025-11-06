import { GoogleGenAI, Type } from "@google/genai";
import type { ExplanationResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        mainTitle: { type: Type.STRING, description: "Main title of the explanation, based on the topic." },
        subtitle: { type: Type.STRING, description: "A short, friendly subtitle, like 'A simple guide for beginners'." },
        sections: {
            type: Type.ARRAY,
            description: "An array of 7 sections explaining the topic.",
            items: {
                type: Type.OBJECT,
                properties: {
                    step: { type: Type.INTEGER },
                    iconKey: { type: Type.STRING, enum: ['INFO', 'CAPACITY', 'PROCESS', 'TYPES', 'LEARN', 'TOOLS', 'LIFE'] },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING, description: "A short introductory sentence for the section. Optional." },
                    content: {
                        type: Type.OBJECT,
                        properties: {
                            bullets: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } } } },
                            power_cards: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { icon: { type: Type.STRING, description: "A single emoji" }, title: { type: Type.STRING }, description: { type: Type.STRING } } } },
                            example: { type: Type.OBJECT, properties: { trigger: { type: Type.STRING }, result: { type: Type.STRING } } },
                            numbered_steps: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } } } },
                            tool_chips: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { icon: { type: Type.STRING, description: "A single emoji" }, name: { type: Type.STRING } } } },
                            summary: { type: Type.STRING },
                            final_list: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                },
                required: ["step", "iconKey", "title", "content"]
            }
        }
    },
    required: ["mainTitle", "subtitle", "sections"]
};

export const generateExplanation = async (topic: string): Promise<ExplanationResponse> => {
    const prompt = `你是一位顶尖的知识讲解专家。你的任务是为初学者解释“${topic}”这个概念。请使用清晰、简洁、鼓励性的语言，让复杂的话题变得浅显易懂。

你需要生成一个结构化的 JSON 解释，严格遵守提供的 schema。这个解释要分为7个清晰的步骤。

**重要规则:**
1.  **语言**: 全程使用简体中文，语气要专业且平易近人。尽量避免使用专业术语，如果必须使用，请给出简单的解释。
2.  **表情符号**: 适度地使用相关的表情符号（emoji）来突出重点，增加可读性。
3.  **内容**: 解释要准确，但必须简化。专注于核心概念和基本原理，目标是为学习者打下坚实的理解基础。
4.  **格式**: 输出必须是严格遵循 'responseSchema' 的单个有效 JSON 对象。不要包含任何 markdown 标记，比如 \`\`\`json。
5.  **强调**: 如果需要强调某个关键词或短语，请使用 Markdown 的双星号格式，例如 **关键词**。这将在前端被正确加粗显示。

**这是我们的7步学习路径结构 (以“人工智能”为例):**
- 第1步 (INFO): 核心概念：它是什么？ (用3个简单的类比或定义来解释核心思想)
- 第2步 (CAPACITY): 关键能力：它能做什么？ (用3张能力卡片介绍其关键能力，并附上一个实际应用案例)
- 第3步 (PROCESS): 工作原理：它是如何工作的？ (用4个编号步骤，讲述一个它完成任务的简化流程)
- 第4步 (TYPES): 主要类型：有哪些不同种类？ (介绍2-3种常见的类型或分类)
- 第5步 (LEARN): 学习方式：它如何进步？ (用3个要点解释它的学习或训练方式，就像人学习新技能一样)
- 第6步 (TOOLS): 关键技术：涉及哪些技术？ (列出4-5个关键工具或技术，并总结它们的综合作用)
- 第7步 (LIFE): 现实应用：它被用在哪里？ (列出一些现实生活中的应用，展示其影响力)

现在，请为“${topic}”这个主题，创作一份给初学者的入门指南吧！`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.4,
            },
        });

        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText);
        return data as ExplanationResponse;
    } catch (error) {
        console.error("Error generating explanation:", error);
        throw new Error("抱歉，AI 在生成解释时遇到问题。请检查您的输入或稍后重试。");
    }
};