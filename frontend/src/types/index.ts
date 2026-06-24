export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  bom?: any[];
  missing_components?: any[];
  plan?: any[];
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
