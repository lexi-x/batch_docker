import axios from 'axios';
import { DockingJob, DockingJobResponse, DockingParameters } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const dockingApi = {
  // Submit a new docking job
  submitDockingJob: async (
    receptorFile: File,
    ligandFiles: File[],
    parameters: DockingParameters
  ): Promise<DockingJobResponse> => {
    const formData = new FormData();
    formData.append('receptor', receptorFile);
    
    ligandFiles.forEach((file) => {
      formData.append('ligands', file);
    });

    // Add docking parameters
    Object.entries(parameters).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    const response = await api.post('/docking/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Get job status and results
  getJobStatus: async (jobId: string): Promise<DockingJob> => {
    const response = await api.get(`/docking/status/${jobId}`);
    return response.data;
  },

  // Download results
  downloadResults: async (jobId: string): Promise<Blob> => {
    const response = await api.get(`/docking/results/${jobId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Delete a job
  deleteJob: async (jobId: string): Promise<void> => {
    await api.delete(`/docking/job/${jobId}`);
  },

  // Health check
  healthCheck: async (): Promise<any> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
