/**
 * File: frontend/src/components/CSVUpload.tsx
 * Purpose: Component for CSV file upload functionality
 */

import React, { useState } from 'react';
import axios from 'axios';

const CSVUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setStatus('No file selected.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/admin/import-csv/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setStatus(response.data.message);
    } catch (error) {
      setStatus('Error uploading file.');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Upload CSV</h2>
      <input type="file" accept=".csv" onChange={handleFileChange} className="mb-4" />
      <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">
        Upload
      </button>
      {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
    </div>
  );
};

export default CSVUpload;
