import React, { useId } from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    label?: string;
    icon?: React.ReactNode;
    rightElement?: React.ReactNode;
    multiline?: boolean;
    rows?: number;
    hasError?: boolean;
    helperText?: string;
}

export function InputField({
    label,
    icon,
    rightElement,
    multiline = false,
    rows = 3,
    hasError = false,
    helperText,
    className = '',
    value,
    ...props
}: InputFieldProps) {
    const baseInputClasses = `w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all ${icon ? 'pl-10' : ''} ${hasError ? 'border-red-300' : ''} ${className}`;

    // Ensure value is never null and doesn't switch between controlled/uncontrolled
    // If value is undefined, we let it be uncontrolled (unless defaultValue is also missing, 
    // but React handles undefined value as uncontrolled).
    // If value is null, we convert to empty string to avoid React warning.
    const isControlled = value !== undefined;
    const safeValue = isControlled ? (value ?? '') : undefined;

    // Generate unique ID for helper text
    const helperId = useId();

    return (
        <div className="mb-4">
            {label && (
                <label htmlFor={props.id || props.name} className="block text-sm font-medium text-gray-700 mb-2">
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                        {icon}
                    </div>
                )}
                {multiline ? (
                    <textarea
                        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                        value={safeValue as string}
                        rows={rows}
                        className={baseInputClasses}
                        aria-invalid={hasError}
                        aria-describedby={helperText ? helperId : undefined}
                    />
                ) : (
                    <input
                        {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
                        value={safeValue as string | number | string[]}
                        className={baseInputClasses}
                        aria-invalid={hasError}
                        aria-describedby={helperText ? helperId : undefined}
                    />
                )}
                {rightElement && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        {rightElement}
                    </div>
                )}
            </div>
            {helperText && (
                <p
                    id={helperId}
                    className={`mt-1 text-sm ${hasError ? 'text-red-500' : 'text-gray-500'}`}
                >
                    {helperText}
                </p>
            )}
        </div>
    );
}

export default InputField;
