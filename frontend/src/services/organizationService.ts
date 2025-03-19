/**
 * File: frontend/src/services/organizationService.ts
 * Purpose: API service for organization-related operations
 */

import { api } from './api'

export interface Organization {
  id: string;
  name: string;
  area_of_law: string;
  location: string;
  available_positions: number;
  filled_positions: number;
  description?: string;
  requirements?: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchOrganizations = async (): Promise<Organization[]> => {
  try {
    const response = await apiClient.get('/organizations/');
    return response.data;
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
};

export const createOrganization = async (orgData: Partial<Organization>): Promise<Organization> => {
  try {
    const response = await apiClient.post('/organizations/', orgData);
    return response.data;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

export const updateOrganization = async (id: string, orgData: Partial<Organization>): Promise<Organization> => {
  try {
    const response = await apiClient.patch(`/organizations/${id}/`, orgData);
    return response.data;
  } catch (error) {
    console.error(`Error updating organization with ID ${id}:`, error);
    throw error;
  }
};

export const deleteOrganization = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/organizations/${id}/`);
  } catch (error) {
    console.error(`Error deleting organization with ID ${id}:`, error);
    throw error;
  }
};


