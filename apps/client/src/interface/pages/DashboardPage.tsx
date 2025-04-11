import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getDashboardData } from '../../application/use-cases/getDashboardData';
import { DashboardData } from '../../domain/services/DashboardService';
import { ProgressBar } from '../components/ProgressBar';
import { ChartExamples } from '../components/ChartExamples';

export const DashboardPage: FunctionComponent = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('Jan - Dec 2023');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await getDashboardData();
        setData(dashboardData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Good Morning, Sharmin 😊</h1>
          <p className="text-gray-600 dark:text-gray-300">Here's what's happening with your projects today.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <span className="text-sm font-medium">Income</span>
            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm">
              +{data.incomeGrowth}%
            </span>
          </div>
          <select
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white"
            value={selectedDate}
            onChange={(e) => setSelectedDate((e.target as HTMLSelectElement).value)}
          >
            <option value="Jan - Dec 2023">Jan - Dec 2023</option>
            <option value="Jan - Dec 2022">Jan - Dec 2022</option>
          </select>
        </div>
      </div>

      {/* Charts Section */}
      <ChartExamples />

      {/* Projects and Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Projects</h2>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            {data.projects.map((project) => (
              <div key={project.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">{project.type}</span>
                  <span className="text-gray-600 dark:text-gray-400">{project.progress}%</span>
                </div>
                <ProgressBar progress={project.progress} color={project.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Messages</h2>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {data.messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                  {message.avatar ? (
                    <img src={message.avatar} alt={message.userDisplayName} className="w-10 h-10 rounded-full" />
                  ) : (
                    <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                      {message.userDisplayName[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {message.userDisplayName}
                      <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">@{message.username}</span>
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{message.timestamp}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 