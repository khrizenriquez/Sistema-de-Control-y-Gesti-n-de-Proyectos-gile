import { api } from '../../infrastructure/api';

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  is_active?: boolean;
}

interface CreateProjectRequest {
  name: string;
  description?: string;
}

interface ProjectMember {
  id: string;
  user_id: string;
  email: string;
  role: string;
  added_at: string;
}

export class ProjectService {
  static async getProjects(): Promise<Project[]> {
    try {
      const response = await api.get('/api/projects');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  static async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const response = await api.get(`/api/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching project with ID ${projectId}:`, error);
      return null;
    }
  }

  static async createProject(projectData: CreateProjectRequest): Promise<Project | null> {
    try {
      console.log('Creating project with data:', projectData);
      const response = await api.post('/api/projects', projectData);
      console.log('Project creation response:', response);
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  static async updateProject(projectId: string, projectData: Partial<CreateProjectRequest>): Promise<Project | null> {
    try {
      const response = await api.put(`/api/projects/${projectId}`, projectData);
      return response.data;
    } catch (error) {
      console.error(`Error updating project with ID ${projectId}:`, error);
      throw error;
    }
  }

  static async deleteProject(projectId: string): Promise<boolean> {
    try {
      await api.delete(`/api/projects/${projectId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting project with ID ${projectId}:`, error);
      throw error;
    }
  }
  
  static async addProjectMember(projectId: string, memberEmail: string, role: string): Promise<boolean> {
    try {
      const params = { member_email: memberEmail, role };
      const response = await api.post(`/api/projects/${projectId}/members`, params);
      return true;
    } catch (error) {
      console.error(`Error adding member to project:`, error);
      throw error;
    }
  }
  
  static async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    try {
      const response = await api.get(`/api/projects/${projectId}/members`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching project members:`, error);
      return [];
    }
  }
} 