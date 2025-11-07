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
    const prompt = `你是一位世界级的知识讲解专家，专注于把复杂概念讲得通俗易懂。你的任务是为初学者解释“${topic}”这个概念。请用清晰、自然、鼓励性的语言，让学习者一看就能理解。

请输出一个**严格符合 responseSchema 的 JSON 对象**，包含 7 个部分（steps），每个部分依次对应学习路径中的一个步骤。

**输出要求:**
1. **语言风格**：全程使用简体中文。语气友好、专业、鼓励，不要生硬或学术化。
2. **可读性**：每步都应包含简洁的句子，逻辑清晰。适度使用相关表情符号（emoji）来增强趣味性和层次感。
3. **专业词解释**：如必须使用术语，请在括号中给出简短解释。
4. **加粗关键词**：如需强调，请使用 Markdown 的双星号格式（例如：**神经网络**）。
5. **禁止格式**：不要输出任何 Markdown 标记（如\`\`\`json），只返回一个有效 JSON。
6. **完整性**：所有 7 个步骤必须齐全，不得省略。每步内容要丰富但不过长，适合小白快速理解。
7. **字段完整性**：对于每个步骤，请确保其 \`content\` 对象中包含模板所要求的全部核心字段。例如，第 6 步必须同时包含 \`tool_chips\` 和 \`summary\`。

**结构模板 (请严格遵循每个步骤要求的数据填充方式):**
- 第1步 (INFO): 核心概念：它是什么？ (内容填充到 \`content.bullets\` 字段，包含 2～3 个点)
- 第2步 (CAPACITY): 关键能力：它能做什么？ (内容填充到 \`content.power_cards\`，包含 3 张卡片。如果合适，可以在 \`content.example\` 中提供一个例子)
- 第3步 (PROCESS): 工作原理：它是如何工作的？ (内容填充到 \`content.numbered_steps\`，包含 4 个步骤)
- 第4步 (TYPES): 主要类型：有哪些不同种类？ (内容填充到 \`content.bullets\`，介绍 2-3 种主要类型)
- 第5步 (LEARN): 学习方式：它如何进步？ (内容填充到 \`content.bullets\`，包含 3 个要点)
- 第6步 (TOOLS): 关键技术：涉及哪些技术？ (技术列表填充到 \`content.tool_chips\`，**必须**同时在 \`content.summary\` 字段中对它们的作用进行总结)
- 第7步 (LIFE): 现实应用：它被用在哪里？ (内容填充到 \`content.final_list\`，列出 3-5 个现实生活场景)

现在，请为主题“${topic}”创作一份入门级讲解内容。`;

    let jsonText = '';
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

        jsonText = response.text.trim();
        const data = JSON.parse(jsonText);
        return data as ExplanationResponse;
    } catch (error) {
        console.error("生成或解析解释时出错:", error);
        if (jsonText) {
            console.error("导致错误的原始文本:", jsonText);
        }
        throw new Error("抱歉，AI 在生成解释时遇到问题。请检查您的输入或稍后重试。");
    }
};
