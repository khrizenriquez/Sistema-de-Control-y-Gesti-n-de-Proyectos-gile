import { FunctionComponent } from 'preact';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export const ChartExamples: FunctionComponent = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Datos para el gráfico de líneas
  const lineData = {
    labels: months,
    datasets: [
      {
        label: 'Proyectos Completados',
        data: [30, 40, 45, 35, 50, 45, 60, 55, 48, 42, 38, 35],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Tareas Pendientes',
        data: [25, 35, 40, 30, 45, 40, 55, 50, 43, 37, 33, 30],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.3,
      },
    ],
  };

  // Datos para el gráfico de barras
  const barData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'Ingresos',
        data: [12000, 19000, 15000, 21000],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Gastos',
        data: [8000, 15000, 12000, 18000],
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
    ],
  };

  // Datos para el gráfico circular
  const pieData = {
    labels: ['UI/UX', 'Frontend', 'Backend', 'DevOps'],
    datasets: [
      {
        data: [30, 25, 25, 20],
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',
          'rgba(239, 68, 68, 0.5)',
          'rgba(34, 197, 94, 0.5)',
          'rgba(168, 85, 247, 0.5)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)',
          'rgb(34, 197, 94)',
          'rgb(168, 85, 247)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Datos para el gráfico de dona
  const doughnutData = {
    labels: ['Completadas', 'En Progreso', 'Pendientes'],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: [
          'rgba(34, 197, 94, 0.5)',
          'rgba(59, 130, 246, 0.5)',
          'rgba(239, 68, 68, 0.5)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Gráfico de Líneas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Progreso Mensual</h2>
        <div className="h-64">
          <Line options={options} data={lineData} />
        </div>
      </div>

      {/* Gráfico de Barras */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen Trimestral</h2>
        <div className="h-64">
          <Bar options={options} data={barData} />
        </div>
      </div>

      {/* Gráfico Circular */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Proyectos</h2>
        <div className="h-64">
          <Pie options={options} data={pieData} />
        </div>
      </div>

      {/* Gráfico de Dona */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Estado de Tareas</h2>
        <div className="h-64">
          <Doughnut options={options} data={doughnutData} />
        </div>
      </div>
    </div>
  );
}; 