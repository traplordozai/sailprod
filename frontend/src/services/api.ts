/**
 * File: frontend/src/services/api.ts
 * Purpose: Core API client configuration and common request handlers
 */
import axios from 'axios'
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

interface ApiError {
  message: string;
  status: number;
}

// Base fetch function with error handling
async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = (import.meta.env as ImportMetaEnv).VITE_API_URL || 'http://localhost:8000/api';
  const token = localStorage.getItem('access_token');

  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error: ApiError = {
      message: 'An error occurred',
      status: response.status,
    };

    try {
      const data = await response.json();
      error.message = data.detail || data.message || data.error || error.message;
    } catch {
      // If JSON parsing fails, use status text
      error.message = response.statusText;
    }

    throw error;
  }

  return response.json();
}

// Type-safe API hooks
export function useStudent(studentId: string) {
  return useQuery({
    queryKey: ['student', studentId],
    queryFn: () => fetchApi<Student>(`/students/${studentId}/`),
    enabled: !!studentId,
  });
}

export function useStudentProfile(studentId: string) {
  return useQuery({
    queryKey: ['studentProfile', studentId],
    queryFn: () => fetchApi<StudentProfile>(`/students/${studentId}/profile/`),
    enabled: !!studentId,
  });
}

export function useUpdateStudent() {
  return useMutation({
    mutationFn: (data: { id: string; updates: Partial<Student> }) =>
      fetchApi<Student>(`/students/${data.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data.updates),
      }),
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['student', data.id] });
      queryClient.invalidateQueries({ queryKey: ['studentProfile', data.id] });
    },
  });
}

export function useUploadStudentCsv() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csv_file', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/students/import_csv/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch all student lists
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUploadGradesPdf() {
  return useMutation({
    mutationFn: async ({ studentId, file }: { studentId: string; file: File }) => {
      const formData = new FormData();
      formData.append('grades_pdf', file);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/students/${studentId}/upload_grades_pdf/`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch affected queries
      queryClient.invalidateQueries({ queryKey: ['student', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['studentProfile', variables.studentId] });
    },
  });
}

export interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  program: string;
  areas_of_law: string;
  location_preferences: string[];
  work_preferences: string[];
  is_matched: boolean;
  created_at: string;
  updated_at: string;
}

export interface Grade {
  constitutional_law: string;
  contracts: string;
  criminal_law: string;
  property_law: string;
  torts: string;
  lrw_case_brief: string;
  lrw_multiple_case: string;
  lrw_short_memo: string;
}

export interface AreaRanking {
  id: string;
  area_of_law: string;
  ranking: number;
  comments: string;
}

export interface SelfProposedExternship {
  id: string;
  organization_name: string;
  contact_person: string;
  contact_email: string;
  description: string;
  status: string;
}

export interface StudentProfile {
  student: Student;
  grades: Grade | null;
  area_rankings: AreaRanking[];
  self_proposed_externship: SelfProposedExternship | null;
}
