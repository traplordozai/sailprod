/**
 * File: frontend/src/components/CsvImport.tsx
 * Purpose: Component for handling CSV file imports
 */

import React from 'react'
import { useState } from 'react'
import apiClient from '../services/api';
import { CloudArrowUpIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface CsvImportProps {
  onSuccess: () => void;
  endpoint: string;
  title?: string;
  acceptedFileTypes?: string;
}

export default function CsvImport({ 
  onSuccess, 
  endpoint, 
  title = 'Import CSV',
  acceptedFileTypes = '.csv'
}: CsvImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [errorList, setErrorList] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      
      // Validate file type
      if (acceptedFileTypes === '.csv' && !selectedFile.type.includes('csv') && 
          !selectedFile.name.toLowerCase().endsWith('.csv')) {
        setError('Please upload a valid CSV file')
        setFile(null)
        return
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit')
        setFile(null)
        return
      }
      
      // Clear any previous errors
      setError('')
      setErrorList([])
      setFile(selectedFile)
    }
  }

  const handleSubmit = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('csv_file', file)

    try {
      setLoading(true)
      setError('')
      setErrorList([])
      setSuccess(false)
      
      console.log(`Uploading file to ${endpoint}`)
      console.log('File details:', file.name, file.type, file.size)
      
      // Use a direct fetch API request to bypass Axios issues
      try {
        const baseUrl = apiClient.defaults.baseURL || 'http://127.0.0.1:8000/api'
        const url = `${baseUrl}${endpoint}`
        console.log('Making request to:', url)
        
        // Get auth token
        const token = localStorage.getItem('access_token')
        
        const response = await fetch(url, {
          method: 'POST',
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {},
          body: formData,
        })
        
        console.log('Upload response status:', response.status)
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Upload response data:', data)
        
        setSuccess(true)
        
        // Reset file input
        setFile(null)
        if (document.getElementById('csv-file-input') as HTMLInputElement) {
          (document.getElementById('csv-file-input') as HTMLInputElement).value = ''
        }
        
        // Call success callback
        onSuccess()
      } catch (fetchError) {
        console.error('Fetch error:', fetchError)
        throw fetchError
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      
      // Handle different error formats
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          setError(err.response.data)
        } else if (err.response.data.detail) {
          setError(err.response.data.detail)
        } else if (err.response.data.error) {
          setError(err.response.data.error)
        } else if (Array.isArray(err.response.data)) {
          // Handle array of errors
          setErrorList(err.response.data)
          setError('Multiple issues found with the CSV file. See details below.')
        } else if (typeof err.response.data === 'object') {
          // Handle object with error messages
          const errorMessages = Object.entries(err.response.data)
            .map(([key, value]) => `${key}: ${value}`)
          setErrorList(errorMessages)
          setError('CSV validation errors. Please fix the issues and try again.')
        }
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Failed to import CSV file')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center space-x-4'>
        <input
          id="csv-file-input"
          type='file'
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          className='file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-purple-50 file:text-purple-700
                    hover:file:bg-purple-100'
        />
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50'
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <>
              <CloudArrowUpIcon className='mr-2 h-5 w-5' />
              {title}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className='flex items-start p-4 text-sm text-red-700 bg-red-100 rounded-lg'>
          <ExclamationTriangleIcon className='mr-2 h-5 w-5 mt-0.5 flex-shrink-0' />
          <div>
            <p className="font-medium">{error}</p>
            {errorList.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-xs">
                {errorList.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            )}
          </div>
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
