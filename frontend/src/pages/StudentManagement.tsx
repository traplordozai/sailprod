/**
 * File: frontend/src/pages/StudentManagement.tsx
 * Purpose: Page for administrators to manage student records
 */

import * as React from 'react';
import { useState } from 'react';
import { useUploadStudentCsv, useUploadGradesPdf } from '../services/api';

interface ImportCsvResponse {
  detail: string;
  success?: boolean;
  students_processed?: number;
  errors?: string[];
}

interface UploadPdfResponse {
  detail: string;
  task_id?: string;
  success?: boolean;
  grades_processed?: number;
}

export default function StudentManagement() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<string>('');
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfResult, setPdfResult] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');

  // React Query mutations
  const uploadCsvMutation = useUploadStudentCsv();
  const uploadPdfMutation = useUploadGradesPdf();

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setUploadResult('Please select a CSV file');
      return;
    }

    setCsvErrors([]);
    
    try {
      const result = await uploadCsvMutation.mutateAsync(csvFile);
      
      setUploadResult(result.detail || 'CSV imported successfully');
      if (result.errors?.length) {
        setCsvErrors(result.errors);
      }
      
      // Clear file input on success
      setCsvFile(null);
      if (document.getElementById('csv-file-input') as HTMLInputElement) {
        (document.getElementById('csv-file-input') as HTMLInputElement).value = '';
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error importing CSV';
      setUploadResult(errorMessage);
      console.error('CSV upload error:', error);
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile || !studentId) {
      setPdfResult('Please provide both a student ID and a PDF file');
      return;
    }

    try {
      const result = await uploadPdfMutation.mutateAsync({
        studentId,
        file: pdfFile
      });

      setPdfResult(result.detail || 'PDF parsed successfully');
      
      // Clear file input on success
      setPdfFile(null);
      if (document.getElementById('pdf-file-input') as HTMLInputElement) {
        (document.getElementById('pdf-file-input') as HTMLInputElement).value = '';
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error uploading PDF';
      setPdfResult(errorMessage);
      console.error('PDF upload error:', error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Student Management</h1>

      {/* CSV Upload Section */}
      <div className="mb-6 bg-white p-4 shadow rounded">
        <h2 className="text-xl font-semibold mb-2">Import CSV</h2>
        <input
          id="csv-file-input"
          type="file"
          accept=".csv"
          onChange={(e) => {
            if (e.target.files?.[0]) setCsvFile(e.target.files[0]);
          }}
          className="mb-2"
        />
        <button
          className={`ml-2 px-4 py-2 rounded ${
            uploadCsvMutation.isPending
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
          onClick={handleCsvUpload}
          disabled={uploadCsvMutation.isPending}
        >
          {uploadCsvMutation.isPending ? 'Uploading...' : 'Upload CSV'}
        </button>
        {uploadResult && (
          <p className={`mt-2 ${uploadResult.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {uploadResult}
          </p>
        )}
        {csvErrors.length > 0 && (
          <div className="mt-2">
            <p className="text-red-600 font-semibold">Errors:</p>
            <ul className="list-disc list-inside">
              {csvErrors.map((error, index) => (
                <li key={index} className="text-red-600">{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* PDF Upload Section */}
      <div className="bg-white p-4 shadow rounded">
        <h2 className="text-xl font-semibold mb-2">Upload Grades PDF</h2>
        <div className="flex flex-col space-y-2">
          <input
            className="border rounded px-2 py-1"
            type="text"
            placeholder="Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
          <input
            id="pdf-file-input"
            type="file"
            accept=".pdf"
            onChange={(e) => {
              if (e.target.files?.[0]) setPdfFile(e.target.files[0]);
            }}
          />
          <button
            className={`px-4 py-2 rounded ${
              uploadPdfMutation.isPending
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
            onClick={handlePdfUpload}
            disabled={uploadPdfMutation.isPending}
          >
            {uploadPdfMutation.isPending ? 'Uploading...' : 'Upload PDF'}
          </button>
        </div>
        {pdfResult && (
          <p className={`mt-2 ${pdfResult.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {pdfResult}
          </p>
        )}
      </div>
    </div>
  );
}
