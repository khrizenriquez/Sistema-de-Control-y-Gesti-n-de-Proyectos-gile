export interface Project {
  id: string;
  name: string;
  progress: number;
  type: 'UI/UX' | 'Front-End' | 'Web UI' | 'NFT App' | 'Mobile UI';
  color?: string;
} 