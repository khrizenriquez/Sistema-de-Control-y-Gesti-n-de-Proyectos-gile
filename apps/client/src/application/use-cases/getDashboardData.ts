import { DashboardApiAdapter } from '../../infrastructure/adapters/DashboardApiAdapter';

export async function getDashboardData() {
  const dashboardApi = new DashboardApiAdapter();
  
  try {
    return await dashboardApi.getDashboardData();
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    throw error;
  }
} 