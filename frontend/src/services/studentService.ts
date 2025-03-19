/**
 * File: frontend/src/services/studentService.ts
 * Purpose: API service for student-related operations
 */

import { api } from './api'

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  student_id: string;
  program: string;
  is_active: boolean;
  profile_completion?: number;
  last_active?: string;
  created_at: string;
  updated_at: string;
}

const handleApiError = (error: any, context: string): never => {
  console.error(`Error ${context}:`, error);
  console.error('Error response:', error.response);
  console.error('Error request:', error.request);
  console.error('Error config:', error.config);
  
  // Check response data for detailed error messages
  if (error.response?.data) {
    if (typeof error.response.data === 'string') {
      throw new Error(error.response.data);
    } else if (error.response.data.detail) {
      throw new Error(error.response.data.detail);
    } else if (error.response.data.error) {
      throw new Error(error.response.data.error);
    }
  }
  
  // If server is unreachable
  if (error.message === 'Network Error' || !error.response) {
    throw new Error('Network error - cannot connect to server. Please ensure the backend is running and accessible at ' + apiClient.defaults.baseURL);
  }
  
  // Generic error message
  throw new Error(`Failed to ${context}. Please try again.`);
};

export const fetchStudents = async (): Promise<Student[]> => {
  try {
    const response = await apiClient.get('/students/');
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

export const getStudent = async (id: number): Promise<Student> => {
  try {
    const response = await apiClient.get(`/students/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching student with ID ${id}:`, error);
    throw error;
  }
};

export const createStudent = async (studentData: Partial<Student>): Promise<Student> => {
  try {
    const response = await apiClient.post('/students/', studentData);
    return response.data;
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

export const updateStudent = async (id: number, studentData: Partial<Student>): Promise<Student> => {
  try {
    const response = await apiClient.put(`/students/${id}/`, studentData);
    return response.data;
  } catch (error) {
    console.error(`Error updating student with ID ${id}:`, error);
    throw error;
  }
};

export const deleteStudent = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/students/${id}/`);
  } catch (error) {
    console.error(`Error deleting student with ID ${id}:`, error);
    throw error;
  }
};

export const importStudentsCSV = async (csvFile: File): Promise<{ detail: string }> => {
  try {
    console.log('Importing CSV file:', csvFile.name, 'Size:', csvFile.size, 'Type:', csvFile.type);
    console.log('Current API URL:', apiClient.defaults.baseURL);
    
    const formData = new FormData();
    formData.append('csv_file', csvFile);
    
    console.log('FormData contents:', 
      Array.from(formData.entries()).map(entry => `${entry[0]}: ${entry[1]}`));
    
    const response = await apiClient.post('/students/import_csv/', formData, {
      headers: {},
      timeout: 60000,
    });
    
    console.log('CSV import response:', response.status, response.data);
    return response.data;
  } catch (error: any) {
    return handleApiError(error, 'import CSV');
  }
};

export const uploadGradesPDF = async (studentId: string, pdfFile: File): Promise<{ detail: string }> => {
  try {
    console.log('Uploading PDF for student ID:', studentId, 'File:', pdfFile.name, 'Type:', pdfFile.type);
    console.log('Current API URL:', apiClient.defaults.baseURL);
    
    const formData = new FormData();
    formData.append('grades_pdf', pdfFile);
    
    console.log('FormData contents:', 
      Array.from(formData.entries()).map(entry => `${entry[0]}: ${entry[1]}`));
    
    const response = await apiClient.post(`/students/${studentId}/upload_grades_pdf/`, formData, {
      headers: {},
      timeout: 60000,
    });
    
    console.log('PDF upload response:', response.status, response.data);
    return response.data;
  } catch (error: any) {
    // Special case for 404 errors when student is not found
    if (error.response?.status === 404) {
      throw new Error(`Student with ID ${studentId} not found. Please check the student ID.`);
    }
    return handleApiError(error, 'upload PDF');
  }
}; 
