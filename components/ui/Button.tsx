import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
    isLoading?: boolean;
    loadingText?: string;
    icon?: React.ReactNode;
}

export function Button({
    children,
    variant = 'primary',
    isLoading = false,
    loadingText = 'Processing...',
    icon,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseClasses = "items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

    // Size classes (default to standard size used in SupplierFormModal)
    const sizeClasses = "px-4 py-2.5";

    const variantClasses = {
        primary: "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-900 active:scale-95 focus:ring-gray-900",
        secondary: "bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-transparent hover:border-gray-200 focus:ring-gray-200",
        danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 active:scale-95 focus:ring-red-500",
        ghost: "text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-200",
        success: "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 active:scale-95 focus:ring-green-500",
    };

    return (
        <button
            className={`flex ${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{loadingText}</span>
                </>
            ) : (
                <>
                    {icon && <span className="mr-2">{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
}

export default Button;
