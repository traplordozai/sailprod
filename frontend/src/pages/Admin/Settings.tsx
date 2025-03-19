/**
 * File: frontend/src/pages/Admin/Settings.tsx
 * Purpose: Administrative settings and configuration page
 */
import React, { useState, useEffect } from 'react'
import { Cog6ToothIcon, UserGroupIcon, BuildingOfficeIcon, ChartBarIcon, BellIcon, ShieldCheckIcon, ArrowPathIcon, ArrowUpTrayIcon, SwatchIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import apiClient from '../../services/api'

// Define types for our settings
interface Setting {
  id: string;
  key: string;
  value: string;
  typed_value: any;
  data_type: string;
  category: string;
  description: string;
  is_public: boolean;
  requires_restart: boolean;
}

interface CategorySettings {
  [category: string]: Setting[];
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState<CategorySettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Helper function to initialize form data from settings
  const initializeFormData = (settingsData: CategorySettings) => {
    const initialData: Record<string, string> = {};
    Object.values(settingsData).forEach((categorySettings: any) => {
      categorySettings.forEach((setting: Setting) => {
        initialData[setting.key] = setting.value;
      });
    });
    setFormData(initialData);
    setIsDirty(false);
  };

  // Define icon map
  const categoryIcons: Record<string, React.FC<any>> = {
    general: Cog6ToothIcon,
    students: UserGroupIcon,
    organizations: BuildingOfficeIcon, 
    matching: ChartBarIcon,
    notifications: BellIcon,
    security: ShieldCheckIcon,
    import_export: ArrowUpTrayIcon,
    appearance: SwatchIcon,
  };

  // Fetch settings from API
  useEffect(() => {
    let mounted = true;

    const fetchSettings = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await apiClient.get('/settings/by_category/');
        if (mounted) {
          setSettings(response.data);
          initializeFormData(response.data);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        if (mounted) {
          setError('Failed to load settings. Please try again later.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchSettings().catch(err => {
      console.error('Unhandled error in fetchSettings:', err);
      if (mounted) {
        setError('An unexpected error occurred while loading settings.');
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Initialize default settings if needed
  const initializeDefaults = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await apiClient.get('/settings/defaults/');
      // Reload settings after initializing defaults
      const response = await apiClient.get('/settings/by_category/');
      setSettings(response.data);
      initializeFormData(response.data);
      
      setSuccessMessage('Default settings initialized successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error initializing defaults:', err);
      setError('Failed to initialize default settings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Create settings update payload
      const settingsToUpdate = [];
      
      // Only include settings that have changed
      for (const category in settings) {
        for (const setting of settings[category]) {
          if (formData[setting.key] !== setting.value) {
            settingsToUpdate.push({
              key: setting.key,
              value: formData[setting.key],
            });
          }
        }
      }
      
      if (settingsToUpdate.length === 0) {
        setSuccessMessage('No changes to save');
        setTimeout(() => setSuccessMessage(''), 3000);
        setIsLoading(false);
        return;
      }
      
      // Send bulk update request
      const response = await apiClient.post('/settings/bulk_update/', settingsToUpdate);
      
      // Check for errors
      if (response.data.errors && response.data.errors.length > 0) {
        setError(`Some settings could not be updated: ${response.data.errors.map((e: any) => e.error).join(', ')}`);
      } else {
        setSuccessMessage('Settings saved successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        
        // Refresh settings after save
        const refreshResponse = await apiClient.get('/settings/by_category/');
        setSettings(refreshResponse.data);
        setIsDirty(false);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render the appropriate input field based on data type
  const renderInputField = (setting: Setting) => {
    switch (setting.data_type) {
      case 'boolean':
        return (
          <div className="relative flex items-start">
            <div className="flex h-6 items-center">
              <input
                id={setting.key}
                name={setting.key}
                type="checkbox"
                checked={formData[setting.key] === 'true'}
                onChange={(e) => handleInputChange(setting.key, e.target.checked ? 'true' : 'false')}
                className="h-4 w-4 rounded border-gray-300 text-western-purple focus:ring-western-purple"
              />
            </div>
            <div className="ml-3 text-sm leading-6">
              <label htmlFor={setting.key} className="font-medium text-gray-900">
                {setting.requires_restart && (
                  <span className="ml-1 text-red-500" title="Requires restart">*</span>
                )}
              </label>
            </div>
          </div>
        );
      
      case 'select':
        // For simplicity, we're using a text input for select fields in this example
        return (
          <input
            type="text"
            id={setting.key}
            name={setting.key}
            value={formData[setting.key] || ''}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-western-purple focus:ring-western-purple sm:text-sm"
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            id={setting.key}
            name={setting.key}
            value={formData[setting.key] || ''}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-western-purple focus:ring-western-purple sm:text-sm"
          />
        );
      
      case 'number':
      case 'integer':
      case 'float':
        return (
          <input
            type="number"
            id={setting.key}
            name={setting.key}
            value={formData[setting.key] || ''}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-western-purple focus:ring-western-purple sm:text-sm"
            step={setting.data_type === 'float' ? '0.1' : '1'}
          />
        );
      
      default: // string
        return (
          <input
            type="text"
            id={setting.key}
            name={setting.key}
            value={formData[setting.key] || ''}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-western-purple focus:ring-western-purple sm:text-sm"
          />
        );
    }
  };

  // Find categories that have settings
  const availableCategories = Object.keys(settings);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure system settings and preferences.
          </p>
        </div>
        
        <div>
          <button
            type="button"
            onClick={initializeDefaults}
            className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-western-purple focus:ring-offset-2"
          >
            <ArrowPathIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
            Initialize Defaults
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <ArrowPathIcon className="h-8 w-8 text-western-purple animate-spin mx-auto" />
          <p className="mt-2 text-gray-500">Loading settings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <nav className="space-y-1">
              {availableCategories.map((category) => {
                const CategoryIcon = categoryIcons[category] || Cog6ToothIcon;
                
                return (
                  <button
                    key={category}
                    onClick={() => setActiveSection(category)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeSection === category
                        ? 'bg-western-purple text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <CategoryIcon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        activeSection === category ? 'text-white' : 'text-gray-400'
                      }`}
                    />
                    {category.replace('_', ' ').charAt(0).toUpperCase() + category.replace('_', ' ').slice(1)}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main content */}
          <div className="lg:col-span-9">
            <form onSubmit={handleSubmit}>
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    {activeSection.replace('_', ' ').charAt(0).toUpperCase() + activeSection.replace('_', ' ').slice(1)} Settings
                  </h3>
                  
                  <div className="space-y-6">
                    {settings[activeSection]?.map((setting) => (
                      <div key={setting.key} className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:pt-5">
                        <label
                          htmlFor={setting.key}
                          className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
                        >
                          {setting.key.replace('_', ' ').charAt(0).toUpperCase() + setting.key.replace(/_/g, ' ').slice(1)}
                          {setting.requires_restart && (
                            <span className="ml-1 text-red-500" title="Requires restart">*</span>
                          )}
                        </label>
                        <div className="mt-1 sm:col-span-2 sm:mt-0">
                          {renderInputField(setting)}
                          <p className="mt-1 text-sm text-gray-500">{setting.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center">
                  {settings[activeSection]?.some(s => s.requires_restart) && (
                    <p className="text-xs text-red-500">* Changes to these settings require a system restart to take effect</p>
                  )}
                  <div>
                    <button
                      type="submit"
                      disabled={!isDirty}
                      className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-western-purple focus:ring-offset-2 ${
                        isDirty 
                          ? 'bg-western-purple hover:bg-purple-700' 
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
