/**
 * File: frontend/src/pages/StudentProfile.tsx
 * Purpose: Page component for viewing and editing student profiles
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useStudentProfile, useUpdateStudent } from '../services/api';

interface StudentProfile {
  student: {
    first_name: string;
    last_name: string;
    student_id: string;
    email: string;
    program: string;
  };
  grades?: {
    [key: string]: string;
  };
  area_rankings: Array<{
    id: string;
    area_of_law: string;
    ranking: number;
    comments?: string;
  }>;
  self_proposed_externship?: {
    organization_name: string;
    contact_person: string;
    contact_email: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
  };
}

const StudentProfilePage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError
  } = useStudentProfile(studentId!);

  const updateStudent = useUpdateStudent();

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
          {(profileError as Error).message || 'Failed to load profile'}
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

  if (!profile) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
          No profile data available
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

      {/* Student Information */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">{`${profile.student.first_name} ${profile.student.last_name}`}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Student ID</p>
            <p className="font-medium">{profile.student.student_id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{profile.student.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Program</p>
            <p className="font-medium">{profile.student.program}</p>
          </div>
        </div>
      </div>

      {/* Grades */}
      {profile.grades && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Grades</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(profile.grades).map(([subject, grade]) => (
              <div key={subject}>
                <p className="text-sm text-gray-600">{subject.replace(/_/g, ' ').toUpperCase()}</p>
                <p className="font-medium">{grade}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Area Rankings */}
      {profile.area_rankings.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Area Rankings</h2>
          <div className="space-y-4">
            {profile.area_rankings.map((ranking) => (
              <div key={ranking.id} className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <p className="font-medium">{ranking.area_of_law}</p>
                  <p className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                    Rank: {ranking.ranking}
                  </p>
                </div>
                {ranking.comments && (
                  <p className="text-sm text-gray-600 mt-2">{ranking.comments}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Self Proposed Externship */}
      {profile.self_proposed_externship && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Self-Proposed Externship</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Organization</p>
              <p className="font-medium">{profile.self_proposed_externship.organization_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Person</p>
              <p className="font-medium">{profile.self_proposed_externship.contact_person}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Email</p>
              <p className="font-medium">{profile.self_proposed_externship.contact_email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="text-gray-800">{profile.self_proposed_externship.description}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`font-medium ${
                profile.self_proposed_externship.status === 'approved' 
                  ? 'text-green-600' 
                  : profile.self_proposed_externship.status === 'rejected'
                  ? 'text-red-600'
                  : 'text-yellow-600'
              }`}>
                {profile.self_proposed_externship.status.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfilePage;
