
export enum Sender {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export type DietaryPreference = 'Vegetarian' | 'Eggetarian' | 'Non-Vegetarian';

export interface Message {
  id: string;
  role: Sender;
  text: string;
  timestamp: number;
  isLoading?: boolean;
  hasAttachment?: boolean;
  attachmentType?: 'image' | 'pdf';
  attachmentData?: string; // Base64 Data URL
  attachmentName?: string;
}

export interface UserInput {
  text: string;
  attachment: File | null;
}

export interface DietConfig {
  goal: string;
  restrictions: string[];
}
