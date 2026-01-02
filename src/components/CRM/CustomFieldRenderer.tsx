import React from 'react';
import { Calendar, CheckSquare, Globe, Hash, Mail, Phone, Type } from 'lucide-react';
import { CustomFieldDefinition } from './CustomFieldsManager';

interface CustomFieldRendererProps {
  field: CustomFieldDefinition;
  value: any;
  onChange?: (value: any) => void;
  readonly?: boolean;
  className?: string;
}

const CustomFieldRenderer: React.FC<CustomFieldRendererProps> = ({
  field,
  value,
  onChange,
  readonly = false,
  className = ''
}) => {
  const getFieldIcon = () => {
    const icons = {
      text: Type,
      textarea: Type,
      number: Hash,
      email: Mail,
      phone: Phone,
      url: Globe,
      date: Calendar,
      datetime: Calendar,
      select: Type,
      multiselect: Type,
      boolean: CheckSquare
    };
    const IconComponent = icons[field.type] || Type;
    return <IconComponent className="h-4 w-4 text-gray-500" />;
  };

  const renderField = () => {
    const baseClasses = `w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`;
    const readonlyClasses = readonly ? 'bg-gray-50 cursor-not-allowed' : '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className={`${baseClasses} ${readonlyClasses}`}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
            readOnly={readonly}
          />
        );

      case 'textarea':
        return (
          <textarea
            rows={3}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className={`${baseClasses} ${readonlyClasses} resize-none`}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
            readOnly={readonly}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange?.(Number(e.target.value))}
            className={`${baseClasses} ${readonlyClasses}`}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
            readOnly={readonly}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className={`${baseClasses} ${readonlyClasses}`}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
            readOnly={readonly}
          />
        );

      case 'phone':
        return (
          <input
            type="tel"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className={`${baseClasses} ${readonlyClasses}`}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
            readOnly={readonly}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className={`${baseClasses} ${readonlyClasses}`}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
            readOnly={readonly}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className={`${baseClasses} ${readonlyClasses}`}
            required={field.required}
            readOnly={readonly}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className={`${baseClasses} ${readonlyClasses}`}
            required={field.required}
            readOnly={readonly}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className={`${baseClasses} ${readonlyClasses}`}
            required={field.required}
            disabled={readonly}
          >
            <option value="">Select {field.label.toLowerCase()}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    if (readonly) return;
                    const newValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter(v => v !== option);
                    onChange?.(newValues);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={readonly}
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange?.(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={readonly}
            />
            <span className="ml-2 text-sm text-gray-700">{field.label}</span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className={`${baseClasses} ${readonlyClasses}`}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            required={field.required}
            readOnly={readonly}
          />
        );
    }
  };

  if (field.type === 'boolean') {
    return (
      <div className="space-y-2">
        {renderField()}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-700">
        {getFieldIcon()}
        <span className="ml-2">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      {renderField()}
      {field.validation?.message && (
        <p className="text-xs text-gray-500">{field.validation.message}</p>
      )}
    </div>
  );
};

export default CustomFieldRenderer;