/**
 * File: frontend/src/pages/LandingAndLogin.tsx
 * Purpose: Landing page with login functionality
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/authService';
import { Dropdown } from '../components/Dropdown';
import AdminLoginModal from '../components/AdminLoginModal';
import westernLawLogo from '../assets/images/western-law-logo.png';


export default function LandingAndLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showAdminModal, setShowAdminModal] = useState(false);
  
  // Additional states for sign-up fields
  const [role, setRole] = useState<"Student" | "Faculty" | "Organization">("Student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  
  // Authentication states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const roleOptions = [
    { value: "Student", label: "Student" },
    { value: "Faculty", label: "Faculty" },
    { value: "Organization", label: "Organization" },
  ];

  const validateForm = () => {
    if (!email || !password) {
      setErrorMessage("Please fill in all required fields");
      return false;
    }

    if (mode === "signup") {
      if (!firstName || !lastName) {
        setErrorMessage("Please fill in all required fields");
        return false;
      }

      if (role === "Organization" && !orgName) {
        setErrorMessage("Organization name is required");
        return false;
      }

      if ((role === "Student" || role === "Faculty") && !email.endsWith("@uwo.ca")) {
        setErrorMessage("Please use your @uwo.ca email address");
        return false;
      }
    }

    return true;
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "login") {
        console.log(`Attempting login with: ${email}`);
        const response = await login(email, password);
        
        console.log('Login response:', response);
        
        // For Django admin users, they should always go to the admin dashboard
        if (response.user.role === 'admin' || response.user.role === 'Admin') {
          console.log('Redirecting to admin dashboard');
          navigate('/admin/dashboard');
          return;
        }
        
        // For other users, follow standard role-based routing
        switch (response.user.role) {
          case "Student":
            navigate('/student/dashboard');
            break;
          case "Faculty":
            navigate('/faculty/dashboard');
            break;
          case "Organization":
            navigate('/organization/dashboard');
            break;
          default:
            setErrorMessage("Invalid user role");
        }
      } else {
        // Registration
        const registerData = {
          email,
          password,
          firstName,
          lastName,
          role,
          ...(role === "Organization" && { orgName }),
        };

        const response = await register(registerData);
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user_role', response.user.role);

        switch (response.user.role) {
          case "Student":
            navigate('/student/dashboard');
            break;
          case "Faculty":
            navigate('/faculty/dashboard');
            break;
          case "Organization":
            navigate('/organization/dashboard');
            break;
          default:
            setErrorMessage("Invalid user role");
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          mode === "login"
            ? "Invalid username or password. Please try again."
            : "Registration failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="relative h-screen flex flex-col md:flex-row bg-white">
      {/* Administrator Login Button */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={() => setShowAdminModal(true)}
          className="px-4 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 text-sm font-medium"
        >
          Administrator Login
        </button>
      </div>
    
      {/* Logo in top-left corner */}
      <div className="absolute top-8 left-8 z-10">
        <img
          alt="Western Law"
          src={westernLawLogo}
          className="h-14 w-auto"
        />
      </div>

      {/* LEFT: EXACT HALF SCREEN AT MD+ */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 py-12">
        <div className="mx-auto w-full max-w-sm">
          {/* Title / Tagline */}
          {mode === "login" ? (
            <>
              <h2 className="mt-8 text-2xl font-bold tracking-tight text-gray-900">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                or{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-indigo-600 font-semibold hover:underline focus:outline-none"
                >
                  create an account
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-8 text-2xl font-bold tracking-tight text-gray-900">
                Create a new account
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                or{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-indigo-600 font-semibold hover:underline focus:outline-none"
                >
                  sign in to your account
                </button>
              </p>
            </>
          )}

          {/* Sign-in form */}
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
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2
                             text-gray-900 placeholder:text-gray-400
                             focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                />
              </div>
            </div>

            {mode === "signup" && (
              <>
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-900">
                    First Name
                  </label>
                  <div className="mt-2">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2
                                 text-gray-900 placeholder:text-gray-400
                                 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-900">
                    Last Name
                  </label>
                  <div className="mt-2">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2
                                 text-gray-900 placeholder:text-gray-400
                                 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Role - Using Dropdown component */}
                <Dropdown
                  id="role"
                  name="role"
                  label="Role"
                  value={role}
                  onChange={(value) => setRole(value as "Student" | "Faculty" | "Organization")}
                  options={roleOptions}
                  required
                />

                {/* Organization Name (only if role === "Organization") */}
                {role === "Organization" && (
                  <div>
                    <label htmlFor="orgName" className="block text-sm font-medium text-gray-900">
                      Organization Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="orgName"
                        name="orgName"
                        type="text"
                        required
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2
                                   text-gray-900 placeholder:text-gray-400
                                   focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {errorMessage && (
              <div className="text-red-600 bg-red-50 p-3 rounded border border-red-200 text-sm mt-2">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm
                           font-semibold text-white shadow-sm hover:bg-indigo-500
                           focus-visible:outline focus-visible:outline-2
                           focus-visible:outline-offset-2 focus-visible:outline-indigo-600
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? (mode === "login" ? "Signing in..." : "Creating account...")
                  : (mode === "login" ? "Sign in" : "Sign up")}
              </button>
            </div>
          </form>

          {/* Replaced social logins with bold text */}
          <div className="mt-10">
            <div className="flex justify-center">
              <span className="font-bold text-gray-700 text-2xl">Connect with your future.</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: EXACT HALF SCREEN AT MD+ */}
      <div className="hidden md:block md:w-1/2">
        <img
          alt="Hero"
          src="../assets/images/landing-4.jpg"
          className="h-full w-full object-cover"
        />
      </div>
      
      {/* Admin Login Modal */}
      {showAdminModal && (
        <AdminLoginModal onClose={() => setShowAdminModal(false)} />
      )}
    </div>
  );
}
