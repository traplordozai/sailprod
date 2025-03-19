/**
 * File: frontend/src/pages/Admin/AdminLayout.tsx
 * Purpose: Layout component for admin dashboard with navigation
 */

'use client'

import React, { useState, FC, ReactNode, Fragment } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Dialog, Menu, Transition } from '@headlessui/react'
import type { MenuItemProps } from '@headlessui/react'
import {
  Bars3Icon,
  BellIcon,
  HomeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import westernLogo from '../../assets/images/western-law-reversed.png'

interface NavigationSubItem {
  name: string;
  href: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: Array<{
    name: string;
    href: string;
  }>;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Students', href: '/admin/students', icon: UserGroupIcon },
  { name: 'Organizations', href: '/admin/organizations', icon: BuildingOfficeIcon },
  { name: 'Faculty', href: '/admin/faculty', icon: AcademicCapIcon },
  {
    name: 'Matching',
    href: '/admin/matching',
    icon: ChartBarIcon,
    children: [
      { name: 'Overview', href: '/admin/matching' },
      { name: 'Matches', href: '/admin/matches' },
      { name: 'Rounds', href: '/admin/matching/rounds' }
    ]
  },
  { name: 'Grading', href: '/admin/grading', icon: DocumentTextIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
]

interface UserNavigationItem {
  name: string;
  href: string;
}

const userNavigation: UserNavigationItem[] = [
  { name: 'Your Profile', href: '/admin/profile' },
  { name: 'Settings', href: '/admin/settings' },
  { name: 'Sign out', href: '/logout' },
]

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ')
}

interface AdminLayoutProps {
  children?: ReactNode;
}

const NavigationItems: FC<{
  navigation: NavigationItem[];
  location: ReturnType<typeof useLocation>;
}> = ({ navigation, location }) => {
  return (
    <ul role="list" className="-mx-2 space-y-1">
      {navigation.map((item) => {
        const isActive = location.pathname.startsWith(item.href)
        return (
          <li key={item.name}>
            <NavLink
              to={item.href}
              className={({ isActive }: { isActive: boolean }) =>
                classNames(
                  isActive
                    ? 'bg-purple-800 text-white'
                    : 'text-purple-100 hover:bg-purple-800 hover:text-white',
                  'group flex gap-x-3 rounded-md p-2 text-sm font-semibold'
                )
              }
            >
              <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
              {item.name}
            </NavLink>
            {item.children && isActive && (
              <ul className="mt-1 pl-8 space-y-1">
                {item.children.map((child) => (
                  <li key={child.name}>
                    <NavLink
                      to={child.href}
                      className={({ isActive }: { isActive: boolean }) =>
                        classNames(
                          isActive
                            ? 'bg-purple-700 text-white'
                            : 'text-purple-200 hover:bg-purple-700 hover:text-white',
                          'group flex gap-x-3 rounded-md p-2 text-sm'
                        )
                      }
                    >
                      {child.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ul>
  )
}

const AdminLayout: FC<AdminLayoutProps> = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      <div>
        {/* Mobile menu button */}
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>

        <Transition appear show={sidebarOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50 lg:hidden" onClose={() => setSidebarOpen(false)}>
            {/* Backdrop */}
            <Transition
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-900/80" />
            </Transition>

            <div className="fixed inset-0 flex">
              <Transition
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <div className="relative mr-16 flex w-full max-w-xs flex-1">
                  {/* Close button */}
                  <button
                    type="button"
                    className="absolute right-4 top-4 text-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>

                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-purple-900 px-6 pb-4 ring-1 ring-white/10">
                    {/* Sidebar content */}
                    <div className="flex h-16 shrink-0 items-center mt-4">
                      <img
                        alt="Western Law"
                        src={westernLogo}
                        className="h-12 w-auto"
                      />
                    </div>
                    <nav className="flex flex-1 flex-col">
                      <NavigationItems navigation={navigation} location={location} />
                    </nav>
                  </div>
                </div>
              </Transition>
            </div>
          </Dialog>
        </Transition>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-purple-900 px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center mt-4">
              <img
                alt="Western Law"
                src={westernLogo}
                className="h-12 w-auto"
              />
            </div>
            <nav className="flex flex-1 flex-col">
              <NavigationItems navigation={navigation} location={location} />
            </nav>
          </div>
        </div>

        <div className="lg:pl-72">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-gray-700 lg:hidden">
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <form className="relative flex flex-1" action="#" method="GET">
                <label htmlFor="search-field" className="sr-only">
                  Search
                </label>
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="search-field"
                  className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                  placeholder="Search..."
                  type="search"
                  name="search"
                />
              </form>

              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </button>

                <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

                <Menu as="div" className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="-m-1.5 flex items-center p-1.5"
                  >
                    <span className="sr-only">Open user menu</span>
                    <img
                      className="h-8 w-8 rounded-full bg-gray-50"
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      alt=""
                    />
                  </button>
                  
                  <Transition
                    show={userMenuOpen}
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <div 
                      className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
                      onBlur={() => setUserMenuOpen(false)}
                    >
                      {userNavigation.map((item) => (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          className={({ isActive }: { isActive: boolean }) =>
                            classNames(
                              isActive ? 'bg-gray-50' : '',
                              'block px-3 py-1 text-sm leading-6 text-gray-900 hover:bg-gray-50'
                            )
                          }
                        >
                          {item.name}
                        </NavLink>
                      ))}
                    </div>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>

          <main className="py-10">
            <div className="px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

export default AdminLayout
