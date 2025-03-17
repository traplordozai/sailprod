import * as React from 'react'
import { useState } from 'react'
import axios from 'axios'

export default function StudentManagement() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<string>('')

  const handleCsvUpload = async () => {
    if (!csvFile) return
    const formData = new FormData()
    formData.append('csv_file', csvFile)

    try {
      // If Django is at http://127.0.0.1:8000
      const res = await axios.post('http://127.0.0.1:8000/api/students/import_csv/', formData)
      setUploadResult(res.data.detail || 'CSV imported')
    } catch (error: any) {
      setUploadResult(error.response?.data?.error || 'Error importing CSV')
    }
  }

  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfResult, setPdfResult] = useState<string>('')
  const [studentId, setStudentId] = useState<string>('')

  const handlePdfUpload = async () => {
    if (!pdfFile || !studentId) return
    const formData = new FormData()
    formData.append('grades_pdf', pdfFile)

    try {
      const res = await axios.post(
        `http://127.0.0.1:8000/api/students/${studentId}/upload_grades_pdf/`,
        formData
      )
      setPdfResult(res.data.detail || 'PDF parsed')
    } catch (error: any) {
      setPdfResult(error.response?.data?.error || 'Error uploading PDF')
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Student Management</h1>

      <div className="mb-6 bg-white p-4 shadow rounded">
        <h2 className="text-xl font-semibold mb-2">Import CSV</h2>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            if (e.target.files?.[0]) setCsvFile(e.target.files[0])
          }}
        />
        <button
          className="ml-2 bg-blue-600 text-white px-3 py-1 rounded"
          onClick={handleCsvUpload}
        >
          Upload
        </button>
        {uploadResult && <p className="mt-2 text-green-700">{uploadResult}</p>}
      </div>

      <div className="bg-white p-4 shadow rounded">
        <h2 className="text-xl font-semibold mb-2">Upload Grades PDF</h2>
        <input
          className="mr-2"
          type="text"
          placeholder="Student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => {
            if (e.target.files?.[0]) setPdfFile(e.target.files[0])
          }}
        />
        <button
          className="ml-2 bg-blue-600 text-white px-3 py-1 rounded"
          onClick={handlePdfUpload}
        >
          Upload PDF
        </button>
        {pdfResult && <p className="mt-2 text-green-700">{pdfResult}</p>}
      </div>
    </div>
  )
}