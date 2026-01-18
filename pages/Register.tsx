// pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        storeName: '',
        subdomain: '',
        ownerName: '',
        ownerEmail: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.storeName.trim()) newErrors.storeName = 'Store name is required';
        if (!formData.subdomain.trim()) {
            newErrors.subdomain = 'Subdomain is required';
        } else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
            newErrors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
        }

        if (!formData.ownerName.trim()) newErrors.ownerName = 'Your name is required';

        if (!formData.ownerEmail.trim()) {
            newErrors.ownerEmail = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
            newErrors.ownerEmail = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await api.post('/stores/register', {
                storeName: formData.storeName,
                subdomain: formData.subdomain,
                ownerName: formData.ownerName,
                ownerEmail: formData.ownerEmail,
                password: formData.password
            });

            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(response.user));

            // Redirect to the new store dashboard
            window.location.href = `https://${response.store.subdomain}.yourdomain.com/dashboard`;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
            setErrors({ submit: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <img className="mx-auto h-16 w-auto" src="/assets/logo.png" alt="SalePilot" />
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Create your store
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Start your 14-day free trial. No credit card required.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {errors.submit && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                            <p className="text-sm text-red-700">{errors.submit}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">
                                Store name
                            </label>
                            <div className="mt-1">
                                <input
                                    id="storeName"
                                    name="storeName"
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                />
                                {errors.storeName && <p className="mt-1 text-sm text-red-600">{errors.storeName}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700">
                                Subdomain
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                    id="subdomain"
                                    name="subdomain"
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={formData.subdomain}
                                    onChange={handleChange}
                                />
                                <span className="inline-flex items-center px-3 py-2 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                    .yourdomain.com
                                </span>
                            </div>
                            {errors.subdomain && <p className="mt-1 text-sm text-red-600">{errors.subdomain}</p>}
                        </div>

                        {/* Add other form fields: ownerName, ownerEmail, password, confirmPassword */}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {isLoading ? 'Creating your store...' : 'Create Store'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;