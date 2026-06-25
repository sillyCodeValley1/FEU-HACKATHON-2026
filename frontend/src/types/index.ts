export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  bom?: any[];
  missing_components?: any[];
  plan?: any[];
  hasProposedChanges?: boolean;
  isApplied?: boolean;
  isRejected?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  messages: Message[];
  bom: any[];
  missing_components: any[];
  plan: any[];
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
}

export interface ProjectRecommendation {
  name: string;
  description: string;
  missing_count: number;
  missing_parts: string[];
}
