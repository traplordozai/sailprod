/**
 * File: frontend/src/components/LoginForm.tsx
 * Purpose: Reusable login form component
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';

interface LoginFormProps {
  onModeChange?: (mode: "login" | "signup") => void;
  mode?: "login" | "signup";
}

const LoginForm: React.FC<LoginFormProps> = ({ onModeChange, mode = "login" }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Additional states for sign-up if needed
  const [role, setRole] = useState<"Student" | "Faculty" | "Organization">("Student");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await login(email, password);
      
      // Token strings are already stored in localStorage by the login function
      navigate('/admin/dashboard');
    } catch (error) {
      setErrorMessage('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {mode === "login" ? (
        <>
          <h2 className="mt-8 text-2xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
          {onModeChange && (
            <p className="mt-2 text-sm text-gray-500">
              or{" "}
              <button
                type="button"
                onClick={() => onModeChange("signup")}
                className="text-indigo-600 font-semibold hover:underline focus:outline-none"
              >
                create an account
              </button>
            </p>
          )}
        </>
      ) : (
        <>
          <h2 className="mt-8 text-2xl font-bold tracking-tight text-gray-900">
            Create a new account
          </h2>
          {onModeChange && (
            <p className="mt-2 text-sm text-gray-500">
              or{" "}
              <button
                type="button"
                onClick={() => onModeChange("login")}
                className="text-indigo-600 font-semibold hover:underline focus:outline-none"
              >
                sign in to your account
              </button>
            </p>
          )}
        </>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900">
            Email address
          </label>
          <div className="mt-2">
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              pattern={role === "Student" || role === "Faculty" ? ".*@uwo\\.ca$" : undefined}
              title={role === "Student" || role === "Faculty"
                ? "Email must be a @uwo.ca address"
                : "Any valid email address"}
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2
                        text-gray-900 placeholder:text-gray-400
                        focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-900">
            Password
          </label>
          <div className="mt-2">
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2
                        text-gray-900 placeholder:text-gray-400
                        focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
