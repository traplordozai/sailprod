/**
 * File: frontend/src/services/matchService.ts
 * Purpose: Service for handling matching algorithm operations
 */

import { api } from './api'

export interface Match {
  id: string;
  student_id: string;
  student_name: string;
  organization_id: string;
  organization_name: string;
  round_id: string;
  round_name: string;
  status: string;
  score: number;
  rank: number;
  lastUpdated: string;
  created_at: string;
}

export interface MatchingRound {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
}

export async function fetchMatches() {
  const response = await apiClient.get('/matches/');
  return response.data;
}

export async function fetchMatchingRounds() {
  const response = await apiClient.get('/matching-rounds/');
  return response.data;
}

export async function runMatchingAlgorithm(roundId: string) {
  const response = await apiClient.post(`/matching-rounds/${roundId}/run_algorithm/`);
  return response.data;
}

export async function updateMatchStatus(matchId: string, status: string) {
  const response = await apiClient.patch(`/matches/${matchId}/`, { status });
  return response.data;
}
