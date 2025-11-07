
export enum IconKey {
  INFO = 'INFO',
  CAPACITY = 'CAPACITY',
  PROCESS = 'PROCESS',
  TYPES = 'TYPES',
  LEARN = 'LEARN',
  TOOLS = 'TOOLS',
  LIFE = 'LIFE'
}

export type BulletPoint = { text: string };
export type PowerCard = { icon: string; title: string; description: string; };
export type NumberedStep = { title: string; description: string; };
export type ToolChip = { icon: string; name: string; };
export type Example = { trigger: string; result: string };

export interface SectionContent {
  bullets?: BulletPoint[];
  power_cards?: PowerCard[];
  example?: Example;
  numbered_steps?: NumberedStep[];
  tool_chips?: ToolChip[];
  summary?: string;
  final_list?: string[];
}

export interface Section {
  step: number;
  iconKey: IconKey;
  title: string;
  description?: string;
  content: SectionContent;
}

export interface ExplanationResponse {
  mainTitle: string;
  subtitle: string;
  topicEmoji: string;
  sections: Section[];
}