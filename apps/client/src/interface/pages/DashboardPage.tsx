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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">Dashboard</h1>
          <nav className="space-y-6">
            <a href="#" className="flex items-center space-x-3 text-blue-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>Dashboard</span>
            </a>
            <a href="#" className="flex items-center space-x-3 text-gray-600 hover:text-blue-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <span>Applications</span>
            </a>
            <a href="#" className="flex items-center space-x-3 text-gray-600 hover:text-blue-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Projects</span>
            </a>
            <a href="#" className="flex items-center space-x-3 text-gray-600 hover:text-blue-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span>Settings</span>
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Good Morning, Sharmin 😊</h1>
              <p className="text-gray-600">Here's what's happening with your projects today.</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-blue-600">
                <span className="text-sm font-medium">Income</span>
                <span className="px-2 py-1 bg-blue-50 rounded-full text-sm">
                  +{data.incomeGrowth}%
                </span>
              </div>
              <select
                className="px-4 py-2 border border-gray-300 rounded-md bg-white"
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
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                {data.projects.map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">{project.type}</span>
                      <span className="text-gray-600">{project.progress}%</span>
                    </div>
                    <ProgressBar progress={project.progress} color={project.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                  View all
                </button>
              </div>
              <div className="space-y-4">
                {data.messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {message.avatar ? (
                        <img src={message.avatar} alt={message.userDisplayName} className="w-10 h-10 rounded-full" />
                      ) : (
                        <span className="text-lg font-medium text-gray-600">
                          {message.userDisplayName[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900">
                          {message.userDisplayName}
                          <span className="text-gray-500 text-sm ml-2">@{message.username}</span>
                        </h3>
                        <span className="text-sm text-gray-500">{message.timestamp}</span>
                      </div>
                      <p className="text-gray-600 mt-1">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}; 