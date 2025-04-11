import { FunctionComponent } from 'preact';

interface ProgressBarProps {
  progress: number;
  color?: string;
}

export const ProgressBar: FunctionComponent<ProgressBarProps> = ({ progress, color = '#3B82F6' }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="h-2 rounded-full transition-all duration-300"
        style={{
          width: `${progress}%`,
          backgroundColor: color
        }}
      />
    </div>
  );
}; 