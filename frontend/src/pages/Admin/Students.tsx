import React, { useState } from 'react'
import axios from 'axios'
import CsvImport from '../../components/CsvImport';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'

const students = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@uwo.ca',
    year: '3L',
    status: 'Active',
    profileCompletion: '95%',
    lastActive: '2 hours ago',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@uwo.ca',
    year: '2L',
    status: 'Active',
    profileCompletion: '88%',
    lastActive: '5 hours ago',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    email: 'mike.j@uwo.ca',
    year: '3L',
    status: 'Inactive',
    profileCompletion: '75%',
    lastActive: '2 days ago',
  },
  // Add more mock data as needed
]

const statuses = ['All', 'Active', 'Inactive', 'Pending']
const years = ['All', '1L', '2L', '3L']

export default function Students() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importMessage, setImportMessage] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfMessage, setPdfMessage] = useState('')
  const [studentId, setStudentId] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedYear, setSelectedYear] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const handleCsvImport = async () => {
    if (!csvFile) return
    const formData = new FormData()
    formData.append('csv_file', csvFile)
    try {
      // e.g. POST to /api/students/import_csv/
      const res = await axios.post('http://127.0.0.1:8000/api/students/import_csv/', formData)
      setImportMessage(res.data.detail || 'CSV imported successfully!')
    } catch (err: any) {
      setImportMessage(err.response?.data?.error || 'Error importing CSV.')
    }
  }

  const handlePdfUpload = async () => {
    if (!pdfFile || !studentId) return
    const formData = new FormData()
    formData.append('grades_pdf', pdfFile)
    try {
      // e.g. POST to /api/students/{studentId}/upload_grades_pdf/
      const res = await axios.post(`http://127.0.0.1:8000/api/students/${studentId}/upload_grades_pdf/`, formData)
      setPdfMessage(res.data.detail || 'PDF uploaded and parsed for grades!')
    } catch (err: any) {
      setPdfMessage(err.response?.data?.error || 'Error uploading PDF.')
    }
  }

  const handleImportSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'All' || student.status === selectedStatus
    const matchesYear = selectedYear === 'All' || student.year === selectedYear
    return matchesSearch && matchesStatus && matchesYear
  })

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and view all student profiles in the system.
        </p>
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
                          {student.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {student.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {student.year}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              student.status === 'Active'
                                ? 'bg-green-100 text-green-700'
                                : student.status === 'Inactive'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {student.profileCompletion}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {student.lastActive}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
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
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredStudents.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredStudents.length}</span> results
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
        </div>
      </div>

      <div className="animate-fade-in space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Import Students</h2>
          <CsvImport onSuccess={handleImportSuccess} />
        </div>

        <h1 className="text-3xl font-benton-sans-bold mb-4">Student Management</h1>

        {/* CSV Import */}
        <div className="bg-white rounded shadow p-4 mb-6">
          <h2 className="text-xl font-benton-sans-bold mb-2">Import Student CSV</h2>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files?.[0]) setCsvFile(e.target.files[0])
            }}
          />
          <button
            onClick={handleCsvImport}
            className="bg-western-purple text-white px-3 py-1 rounded ml-2 transition-default hover:bg-western-deep-focus"
          >
            Import
          </button>
          {importMessage && <p className="text-green-600 mt-2">{importMessage}</p>}
        </div>

        {/* PDF Upload */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-benton-sans-bold mb-2">Upload Grades PDF</h2>
          <div className="flex gap-2 items-center mb-2">
            <input
              type="text"
              placeholder="Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1"
            />
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) setPdfFile(e.target.files[0])
              }}
            />
            <button
              onClick={handlePdfUpload}
              className="bg-western-purple text-white px-3 py-1 rounded transition-default hover:bg-western-deep-focus"
            >
              Upload
            </button>
          </div>
          {pdfMessage && <p className="text-green-600">{pdfMessage}</p>}
        </div>
      </div>
    </div>
  )
}