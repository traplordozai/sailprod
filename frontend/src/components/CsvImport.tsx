import * as React from 'react'
import { useState } from 'react'
import axios from 'axios'
import { CloudArrowUpIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface CsvImportProps {
  onSuccess: () => void
}

export default function CsvImport({ onSuccess }: CsvImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === 'text/csv') {
        setFile(selectedFile)
        setError('')
      } else {
        setError('Please upload a valid CSV file')
      }
    }
  }

  const handleSubmit = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('csv_file', file)

    try {
      setLoading(true)
      await axios.post('/api/students/import_csv/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setSuccess(true)
      onSuccess()
    } catch (err) {
      setError('Failed to import CSV file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center space-x-4'>
        <input
          type='file'
          accept='.csv'
          onChange={handleFileChange}
          className='file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100'
        />
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
        >
          {loading ? (
            'Uploading...'
          ) : (
            <>
              <CloudArrowUpIcon className='mr-2 h-5 w-5' />
              Import CSV
            </>
          )}
        </button>
      </div>

      {error && (
        <div className='flex items-center p-4 text-sm text-red-700 bg-red-100 rounded-lg'>
          <ExclamationTriangleIcon className='mr-2 h-5 w-5' />
          {error}
        </div>
      )}

      {success && (
        <div className='flex items-center p-4 text-sm text-green-700 bg-green-100 rounded-lg'>
          <CheckCircleIcon className='mr-2 h-5 w-5' />
          CSV imported successfully!
        </div>
      )}
    </div>
  )
}
