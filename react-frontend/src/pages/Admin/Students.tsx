import React, { useState } from 'react'
import axios from 'axios'

export default function Students() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [importMessage, setImportMessage] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfMessage, setPdfMessage] = useState('')
  const [studentId, setStudentId] = useState('')

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

  return (
    <div className="animate-fade-in">
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
  )
}