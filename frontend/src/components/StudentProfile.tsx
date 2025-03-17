import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  program: string;
  areas_of_law: string;
  location_preferences: string;
  work_preferences: string;
  is_matched: boolean;
  created_at: string;
  updated_at: string;
}

interface Grade {
  id: string;
  student: string;
  constitutional_law: string;
  contracts: string;
  criminal_law: string;
  property_law: string;
  torts: string;
  lrw_case_brief: string;
  lrw_multiple_case: string;
  lrw_short_memo: string;
}

interface Statement {
  id: string;
  student: string;
  content: string;
  area_of_law: string;
  statement_grade: number;
}

const StudentProfile: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // Fetch student details
        const studentResponse = await axios.get(`/api/students/${studentId}/`);
        setStudent(studentResponse.data);
        
        // Fetch grades
        try {
          const gradesResponse = await axios.get(`/api/grades/?student=${studentId}`);
          if (gradesResponse.data.results && gradesResponse.data.results.length > 0) {
            setGrades(gradesResponse.data.results[0]);
          }
        } catch (err) {
          console.log('No grades available for this student');
        }
        
        // Fetch statements
        try {
          const statementsResponse = await axios.get(`/api/statements/?student=${studentId}`);
          if (statementsResponse.data.results) {
            setStatements(statementsResponse.data.results);
          }
        } catch (err) {
          console.log('No statements available for this student');
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load student data. Please try again later.');
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Not Found!</strong>
          <span className="block sm:inline"> Student not found.</span>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
        >
          Back
        </button>
      </div>
      
      {/* Student Personal Information */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Student ID</p>
            <p className="font-medium">{student.student_id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">{student.first_name} {student.last_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{student.email || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Program</p>
            <p className="font-medium">{student.program || 'Not specified'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600">Areas of Law</p>
            <p className="font-medium">{student.areas_of_law || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Location Preferences</p>
            <p className="font-medium">{student.location_preferences || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Work Preferences</p>
            <p className="font-medium">{student.work_preferences || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Match Status</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              student.is_matched 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {student.is_matched ? 'Matched' : 'Not Matched'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Grades */}
      {grades && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Grades</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Constitutional Law</p>
              <p className="font-medium">{grades.constitutional_law || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contracts</p>
              <p className="font-medium">{grades.contracts || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Criminal Law</p>
              <p className="font-medium">{grades.criminal_law || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Property Law</p>
              <p className="font-medium">{grades.property_law || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Torts</p>
              <p className="font-medium">{grades.torts || 'N/A'}</p>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mt-5 mb-3">Legal Research and Writing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Case Brief</p>
              <p className="font-medium">{grades.lrw_case_brief || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Multiple Case Analysis</p>
              <p className="font-medium">{grades.lrw_multiple_case || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Short Memo</p>
              <p className="font-medium">{grades.lrw_short_memo || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Statements */}
      {statements.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Statements</h2>
          {statements.map((statement) => (
            <div key={statement.id} className="mb-5 pb-5 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-md font-medium text-gray-900">
                    {statement.area_of_law || 'Personal Statement'}
                  </h3>
                  {statement.statement_grade !== null && (
                    <div className="mt-1">
                      <span className="text-sm text-gray-600">Grade: </span>
                      <span className="font-medium">{statement.statement_grade}/25</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                {statement.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentProfile; 