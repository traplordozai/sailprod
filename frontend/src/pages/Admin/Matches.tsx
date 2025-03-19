/**
 * File: frontend/src/pages/Admin/Matches.tsx
 * Purpose: Dashboard for viewing and managing student-organization matches
 */
                    import React, { useEffect, useState } from 'react';
                    import {
                      MagnifyingGlassIcon,
                      FunnelIcon
                    } from '@heroicons/react/24/outline';
                    import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
                    import {
                      fetchMatches,
                      fetchMatchingRounds,
                      updateMatchStatus,
                      Match,
                      MatchingRound
                    } from '../../services/matchService';

                    export default function Matches() {
                      const [matches, setMatches] = useState<Match[]>([]);
                      const [rounds, setRounds] = useState<MatchingRound[]>([]);
                      const [loading, setLoading] = useState(true);
                      const [error, setError] = useState('');
                      const [feedback, setFeedback] = useState('');
                      const [searchQuery, setSearchQuery] = useState('');
                      const [selectedRound, setSelectedRound] = useState('All');
                      const [selectedStatus, setSelectedStatus] = useState('All');
                      const [currentPage, setCurrentPage] = useState(1);
                      const itemsPerPage = 10;

                      const statuses = ['All', 'Pending', 'Accepted', 'Rejected', 'Confirmed'];

                      useEffect(() => {
                        const loadData = async () => {
                          setLoading(true);
                          try {
                            const [matchesData, roundsData] = await Promise.all([
                              fetchMatches(),
                              fetchMatchingRounds()
                            ]);
                            setMatches(matchesData);
                            setRounds(roundsData);
                          } catch (err) {
                            console.error('Error loading match data:', err);
                            setError('Failed to load matches. Please try again.');
                          } finally {
                            setLoading(false);
                          }
                        };

                        loadData();
                      }, []);

                      // Filter matches
                      const filteredMatches = matches.filter((match) => {
                        const matchesSearch =
                          match.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          match.organization_name?.toLowerCase().includes(searchQuery.toLowerCase());

                        const matchesRound = selectedRound === 'All' || match.round_id === selectedRound;
                        const matchesStatus = selectedStatus === 'All' || match.status === selectedStatus.toLowerCase();

                        return matchesSearch && matchesRound && matchesStatus;
                      });

                      // Calculate pagination
                      const totalPages = Math.ceil(filteredMatches.length / itemsPerPage);
                      const paginatedMatches = filteredMatches.slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      );

                      // Handle status change
                      const handleStatusChange = async (matchId: string, newStatus: string) => {
                        try {
                          await updateMatchStatus(matchId, newStatus.toLowerCase());

                          // Update local state
                          setMatches(matches.map(match =>
                            match.id === matchId ? { ...match, status: newStatus.toLowerCase() } : match
                          ));

                          setFeedback(`Match status updated to ${newStatus}`);
                          setTimeout(() => setFeedback(''), 3000);
                        } catch (err) {
                          setError('Failed to update match status');
                          setTimeout(() => setError(''), 3000);
                        }
                      };

                      // Format date
                      const formatDate = (dateString: string) => {
                        if (!dateString) return 'N/A';
                        const date = new Date(dateString);
                        return date.toLocaleDateString();
                      };

                      return (
                        <div className="space-y-6">
                          <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Matches</h1>
                            <p className="mt-1 text-sm text-gray-500">
                              View and manage student-organization matches.
                            </p>
                          </div>

                          {feedback && (
                            <div className="rounded-md bg-green-50 p-4">
                              <p className="text-sm text-green-700">{feedback}</p>
                            </div>
                          )}

                          {error && (
                            <div className="rounded-md bg-red-50 p-4">
                              <p className="text-sm text-red-700">{error}</p>
                            </div>
                          )}

                          {/* Filters */}
                          <div className="bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {/* Search */}
                                <div className="relative">
                                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                  </div>
                                  <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-western-purple sm:text-sm sm:leading-6"
                                    placeholder="Search matches..."
                                  />
                                </div>

                                {/* Round Filter */}
                                <div className="relative">
                                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                  </div>
                                  <select
                                    value={selectedRound}
                                    onChange={(e) => setSelectedRound(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-western-purple sm:text-sm sm:leading-6"
                                  >
                                    <option value="All">All Rounds</option>
                                    {rounds.map((round) => (
                                      <option key={round.id} value={round.id}>{round.name}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Status Filter */}
                                <div className="relative">
                                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                  </div>
                                  <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-western-purple sm:text-sm sm:leading-6"
                                  >
                                    {statuses.map((status) => (
                                      <option key={status} value={status}>{status}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Matches Table */}
                          <div className="bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                              {loading ? (
                                <div className="flex justify-center items-center py-12">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
                                </div>
                              ) : filteredMatches.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                  No matches found matching your criteria.
                                </div>
                              ) : (
                                <div className="mt-8 flow-root">
                                  <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                      <table className="min-w-full divide-y divide-gray-300">
                                        <thead>
                                          <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                              Student
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                              Organization
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                              Score
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                              Round
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                              Status
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                              Last Updated
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                          {paginatedMatches.map((match) => (
                                            <tr key={match.id}>
                                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                                {match.student_name}
                                              </td>
                                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {match.organization_name}
                                              </td>
                                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {match.score.toFixed(2)}
                                              </td>
                                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {match.round_name}
                                              </td>
                                              <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <select
                                                  value={match.status}
                                                  onChange={(e) => handleStatusChange(match.id, e.target.value)}
                                                  className={`rounded px-2 py-1 text-sm ${
                                                    match.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                                                    match.status === 'accepted' ? 'bg-green-50 text-green-700' :
                                                    match.status === 'rejected' ? 'bg-red-50 text-red-700' :
                                                    match.status === 'confirmed' ? 'bg-blue-50 text-blue-700' :
                                                    'bg-gray-50 text-gray-700'
                                                  }`}
                                                >
                                                  <option value="pending">Pending</option>
                                                  <option value="accepted">Accepted</option>
                                                  <option value="rejected">Rejected</option>
                                                  <option value="confirmed">Confirmed</option>
                                                </select>
                                              </td>
                                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {formatDate(match.lastUpdated)}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Pagination */}
                              {filteredMatches.length > 0 && (
                                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                                  <div className="flex flex-1 justify-between sm:hidden">
                                    <button
                                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                      disabled={currentPage === 1}
                                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                      Previous
                                    </button>
                                    <button
                                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                      disabled={currentPage === totalPages}
                                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                      Next
                                    </button>
                                  </div>
                                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                      <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{Math.min(1 + (currentPage - 1) * itemsPerPage, filteredMatches.length)}</span> to{' '}
                                        <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredMatches.length)}</span> of{' '}
                                        <span className="font-medium">{filteredMatches.length}</span> results
                                      </p>
                                    </div>
                                    <div>
                                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                        <button
                                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                          disabled={currentPage === 1}
                                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                        >
                                          <span className="sr-only">Previous</span>
                                          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                        <button
                                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                          disabled={currentPage === totalPages}
                                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                        >
                                          <span className="sr-only">Next</span>
                                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                                        </button>
                                      </nav>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }