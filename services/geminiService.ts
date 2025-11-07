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
            description: "An array of 7 sections explaining the topic. Each section must follow the structure defined in the prompt.",
            items: {
                type: Type.OBJECT,
                properties: {
                    step: { type: Type.INTEGER },
                    iconKey: { type: Type.STRING, enum: ['INFO', 'CAPACITY', 'PROCESS', 'TYPES', 'LEARN', 'TOOLS', 'LIFE'] },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING, description: "A short introductory sentence for the section. Optional." },
                    content: {
                        type: Type.OBJECT,
                        description: "Contains the content for the section. Each step has a specific required structure as outlined in the main prompt.",
                        properties: {
                            bullets: {
                                type: Type.ARRAY,
                                description: "Use for Step 1 (INFO) & 5 (LEARN). A list of bullet points.",
                                items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } } }
                            },
                            power_cards: {
                                type: Type.ARRAY,
                                description: "Use for Step 2 (CAPACITY) & 4 (TYPES). Cards with an icon, title, and description.",
                                items: { type: Type.OBJECT, properties: { icon: { type: Type.STRING, description: "A single emoji" }, title: { type: Type.STRING }, description: { type: Type.STRING } } }
                            },
                            example: {
                                type: Type.OBJECT,
                                description: "Optional field to provide a concrete example. Can be used with power_cards.",
                                properties: { trigger: { type: Type.STRING }, result: { type: Type.STRING } }
                            },
                            numbered_steps: {
                                type: Type.ARRAY,
                                description: "Use for Step 3 (PROCESS). A list of numbered steps.",
                                items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } } }
                            },
                            tool_chips: {
                                type: Type.ARRAY,
                                description: "Use for Step 6 (TOOLS). A list of chips. MUST be accompanied by a 'summary'.",
                                items: { type: Type.OBJECT, properties: { icon: { type: Type.STRING, description: "A single emoji" }, name: { type: Type.STRING } } }
                            },
                            summary: {
                                type: Type.STRING,
                                description: "Use for Step 6 (TOOLS) along with 'tool_chips' to provide a summary."
                            },
                            final_list: {
                                type: Type.ARRAY,
                                description: "Use for Step 7 (LIFE). A simple list of strings for real-world applications.",
                                items: { type: Type.STRING }
                            }
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

**结构与 JSON 字段映射:**
请严格按照以下 7 个步骤的结构和指定的 JSON 字段来组织内容。每个步骤的 \`content\` 对象**只能使用**下面为其指定的字段。

- **第1步 (INFO): 核心概念**
  - **内容:** 用 2～3 个简短类比或定义说明核心思想。
  - **JSON 字段:** \`content: { "bullets": [...] }\`

- **第2步 (CAPACITY): 关键能力**
  - **内容:** 列出 3 张能力卡片，每张包含一个 emoji \`icon\`、\`title\` 和 \`description\`。
  - **JSON 字段:** \`content: { "power_cards": [...] }\`

- **第3步 (PROCESS): 工作原理**
  - **内容:** 用 4 个编号步骤描述简化流程，每个步骤包含 \`title\` 和 \`description\`。
  - **JSON 字段:** \`content: { "numbered_steps": [...] }\`

- **第4步 (TYPES): 主要类型**
  - **内容:** 介绍 2-3 种常见的类型或分类，使用能力卡片的形式。
  - **JSON 字段:** \`content: { "power_cards": [...] }\` (每张卡片代表一种类型)

- **第5步 (LEARN): 学习方式**
  - **内容:** 用 3 个要点说明它的学习或训练方式。
  - **JSON 字段:** \`content: { "bullets": [...] }\`

- **第6步 (TOOLS): 关键技术**
  - **内容:** 列出 4～5 个关键技术（每个包含 emoji \`icon\` 和 \`name\`），并用一个 \`summary\` 字段总结它们的作用。
  - **JSON 字段:** \`content: { "tool_chips": [...], "summary": "..." }\`

- **第7步 (LIFE): 现实应用**
  - **内容:** 举例说明 3～5 个现实生活场景。
  - **JSON 字段:** \`content: { "final_list": [...] }\`

现在，请为主题“${topic}”创作一份入门级讲解内容。`;

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