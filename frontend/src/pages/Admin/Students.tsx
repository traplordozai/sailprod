/**
 * File: frontend/src/pages/Admin/Students.tsx
 * Purpose: Student management dashboard for administrators
 */

import React, { useState, useEffect } from 'react'
import CsvImport from '../../components/CsvImport'
import { MagnifyingGlassIcon, FunnelIcon, ChevronUpDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { fetchStudents, uploadGradesPDF, Student } from '../../services/studentService'

const statuses = ['All', 'Active', 'Inactive', 'Pending']
const years = ['All', '1L', '2L', '3L'] 

export default function Students() {
  const [importMessage, setImportMessage] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfMessage, setPdfMessage] = useState('')
  const [studentId, setStudentId] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedYear, setSelectedYear] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const itemsPerPage = 10

  // Fetch students from API
  useEffect(() => {
    const getStudents = async () => {
      setLoading(true);
      try {
        const data = await fetchStudents();
        setStudents(data);
        setError('');
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students data. Please try again later.');
        setStudents([]); 
      } finally {
        setLoading(false);
      }
    };
    
    getStudents();
  }, [refreshKey]);

  const handlePdfUpload = async () => {
    if (!pdfFile || !studentId) {
      setPdfMessage('Please provide both a student ID and a PDF file');
      return;
    }
    
    setLoading(true);
    setPdfMessage('Uploading and processing PDF...');
    
    try {
      const result = await uploadGradesPDF(studentId, pdfFile);
      
      // Show success message
      setPdfMessage(result.detail || 'PDF uploaded and grades extracted successfully!');
      
      // Refresh student list to show updated grades
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error('PDF upload error:', err);
      
      // Format error message
      const errorMessage = err.message || 'Error uploading PDF. Please check file format and student ID.';
      setPdfMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSuccess = () => {
    console.log("CSV import was successful");
    setImportMessage('CSV imported successfully! Student records have been updated.');
    // Clear message after 5 seconds
    setTimeout(() => setImportMessage(''), 5000);
    // Refresh the list after import
    setRefreshKey(prev => prev + 1);
  };

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.student_id && student.student_id.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = selectedStatus === 'All' || 
      (selectedStatus === 'Active' && student.is_active) ||
      (selectedStatus === 'Inactive' && !student.is_active);
    
    const matchesYear = selectedYear === 'All' || student.program === selectedYear;
    
    return matchesSearch && matchesStatus && matchesYear;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format the last active date in a readable format
  const formatLastActive = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Calculate profile completion percentage
  const getProfileCompletion = (student: Student) => {
    if (student.profile_completion !== undefined) {
      return `${student.profile_completion}%`;
    }
    
    // Calculate dynamically if not provided
    let fields = 0;
    let total = 6; // Total number of important profile fields
    
    if (student.first_name) fields++;
    if (student.last_name) fields++;
    if (student.email) fields++;
    if (student.student_id) fields++;
    if (student.program) fields++;
    if (student.created_at) fields++;
    
    return `${Math.floor((fields / total) * 100)}%`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and view all student profiles in the system.
        </p>
      </div>

      {/* Import Actions */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Import Data</h3>
          
          {/* CSV Import */}
          <div className="mt-2 grid grid-cols-1 gap-6 sm:grid-cols-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Import Students CSV</label>
              <p className="text-xs text-gray-500 mb-3">
                Upload a CSV file containing student information. The file should include columns for 
                Given Names, Last Name, Student Email, Student ID, Programs chosen, and area rankings.
              </p>
              
              <CsvImport 
                endpoint="/students/import_csv/" 
                onSuccess={handleImportSuccess}
                title="Import Students"
              />
              
              {importMessage && (
                <div className={`mt-3 p-3 rounded-md ${importMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {importMessage}
                </div>
              )}
            </div>
          </div>
          
          {/* PDF Upload */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Student Grades PDF</label>
            <p className="text-xs text-gray-500 mb-3">
              Upload a PDF containing a student's grades. The system will extract course grades 
              and associate them with the specified student ID.
            </p>
            
            <div className="mt-2 flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/3">
                <label htmlFor="student-id" className="block text-xs font-medium text-gray-500 mb-1">
                  Student ID *
                </label>
                <input
                  id="student-id"
                  type="text"
                  placeholder="Enter student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                />
              </div>
              
              <div className="w-full sm:w-2/3">
                <label htmlFor="pdf-file" className="block text-xs font-medium text-gray-500 mb-1">
                  Grade PDF *
                </label>
                <div className="flex">
                  <input
                    id="pdf-file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  <button
                    onClick={handlePdfUpload}
                    disabled={!pdfFile || !studentId || loading}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
            
            {pdfMessage && (
              <div className={`mt-3 p-3 rounded-md ${pdfMessage.includes('Error') || pdfMessage.includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {pdfMessage}
              </div>
            )}
          </div>
        </div>
      </div>

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
                placeholder="Search students..."
              />
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
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-western-purple sm:text-sm sm:leading-6"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              {searchQuery || selectedStatus !== 'All' || selectedYear !== 'All' 
                ? 'No students match your search criteria.' 
                : 'No students found. Import some students to get started.'}
            </div>
          ) : (
            <div className="flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                          <div className="group inline-flex">
                            Name
                            <span className="ml-2 flex-none rounded text-gray-400">
                              <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          </div>
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Email
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Year
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Profile
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Last Active
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedStudents.map((student) => (
                        <tr key={student.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                            {student.first_name} {student.last_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {student.email}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {student.program || 'N/A'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                student.is_active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {student.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {getProfileCompletion(student)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatLastActive(student.updated_at)}
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
          {filteredStudents.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredStudents.length)}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of{' '}
                    <span className="font-medium">{filteredStudents.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {/* Page numbers */}
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          currentPage === i + 1
                            ? 'z-10 bg-purple-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
