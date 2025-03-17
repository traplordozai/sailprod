import React from 'react'
import { useState } from 'react'
import { Dropdown } from '../components/Dropdown'

export default function LandingAndLogin() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  // Additional states for sign-up fields
  const [role, setRole] = useState<"Student" | "Faculty" | "Organization">("Student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");

  const roleOptions = [
    { value: "Student", label: "Student" },
    { value: "Faculty", label: "Faculty" },
    { value: "Organization", label: "Organization" },
  ];

  return (
    <div className="relative h-screen flex flex-col md:flex-row bg-white">
      {/* Logo in top-left corner */}
      <div className="absolute top-8 left-8 z-10">
        <img
          alt="Western Law"
          src="/src/assets/images/western-law-logo.png"
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
          <form action="#" method="POST" className="mt-6 space-y-6">
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
                  autoComplete="current-password"
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

                {/* Role - Using new Dropdown component */}
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
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm
                           font-semibold text-white shadow-sm hover:bg-indigo-500
                           focus-visible:outline focus-visible:outline-2
                           focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {mode === "login" ? "Sign in" : "Sign up"}
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
          src="/src/assets/images/landing-4.jpg"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  )
}