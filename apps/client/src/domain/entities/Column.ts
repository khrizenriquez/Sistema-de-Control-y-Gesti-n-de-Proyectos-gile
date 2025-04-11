import { Card } from './Card';

export interface Column {
  id: string;
  title: string;
  cards: Card[];
  color?: string;
} 