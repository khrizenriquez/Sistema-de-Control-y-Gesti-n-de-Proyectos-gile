import { FunctionComponent } from 'preact';

interface DataPoint {
  month: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
}

export const LineChart: FunctionComponent<LineChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (point.value / maxValue) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-full relative">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
        {data.map((point, index) => (
          <span key={index} className={index % 2 === 0 ? 'block' : 'hidden md:block'}>
            {point.month}
          </span>
        ))}
      </div>
    </div>
  );
}; 