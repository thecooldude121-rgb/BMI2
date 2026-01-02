import React, { useState, useRef } from 'react';
import { X, Download, Upload, AlertCircle, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { TeamMember } from '../../types/team';

interface ImportUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (users: Partial<TeamMember>[]) => void;
  existingMembers: TeamMember[];
  totalSeats: number;
  usedSeats: number;
}

interface ParsedUser {
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  managerEmail?: string;
  team?: string;
  status: 'active' | 'inactive';
}

interface ValidationResult {
  valid: ParsedUser[];
  warnings: { row: number; message: string; user: ParsedUser }[];
  errors: { row: number; message: string; data: any }[];
}

export default function ImportUsersModal({
  isOpen,
  onClose,
  onImport,
  existingMembers,
  totalSeats,
  usedSeats
}: ImportUsersModalProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const template = `Full Name,Email,Phone,Role,Department,Manager Email,Team,Status
John Doe,john.doe@company.com,+1 (555) 123-4567,sales_rep,Sales,manager@company.com,West Coast,active
Jane Smith,jane.smith@company.com,+1 (555) 234-5678,account_executive,Sales,,East Coast,active
Bob Johnson,bob.j@company.com,+1 (555) 345-6789,sales_manager,Sales,,Enterprise,active`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team_members_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  };

  const validateUsers = (rows: any[]): ValidationResult => {
    const valid: ParsedUser[] = [];
    const warnings: { row: number; message: string; user: ParsedUser }[] = [];
    const errors: { row: number; message: string; data: any }[] = [];

    const validRoles = ['sales_rep', 'account_executive', 'sales_manager', 'team_lead', 'director'];
    const existingEmails = existingMembers.map(m => m.email.toLowerCase());

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because of header row and 0-based index
      const user: ParsedUser = {
        name: row['Full Name'] || row['name'] || '',
        email: (row['Email'] || row['email'] || '').toLowerCase(),
        phone: row['Phone'] || row['phone'] || '',
        role: (row['Role'] || row['role'] || '').toLowerCase(),
        department: row['Department'] || row['department'] || '',
        managerEmail: row['Manager Email'] || row['managerEmail'] || '',
        team: row['Team'] || row['team'] || '',
        status: (row['Status'] || row['status'] || 'active').toLowerCase() as 'active' | 'inactive'
      };

      // Required field validation
      if (!user.name) {
        errors.push({ row: rowNumber, message: 'Full Name is required', data: row });
        return;
      }

      if (!user.email) {
        errors.push({ row: rowNumber, message: 'Email is required', data: row });
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        errors.push({ row: rowNumber, message: 'Invalid email format', data: row });
        return;
      }

      // Role validation
      if (!user.role) {
        errors.push({ row: rowNumber, message: 'Role is required', data: row });
        return;
      }

      if (!validRoles.includes(user.role)) {
        errors.push({
          row: rowNumber,
          message: `Invalid role "${user.role}". Valid roles: ${validRoles.join(', ')}`,
          data: row
        });
        return;
      }

      // Department validation
      if (!user.department) {
        errors.push({ row: rowNumber, message: 'Department is required', data: row });
        return;
      }

      // Duplicate email check
      if (existingEmails.includes(user.email)) {
        warnings.push({
          row: rowNumber,
          message: `Email ${user.email} already exists in the system`,
          user
        });
        return;
      }

      // Status validation
      if (user.status !== 'active' && user.status !== 'inactive') {
        user.status = 'active'; // Default to active
      }

      valid.push(user);
    });

    return { valid, warnings, errors };
  };

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length > 100) {
        alert('Maximum 100 users per import');
        setIsProcessing(false);
        return;
      }

      const result = validateUsers(rows);
      setValidationResult(result);
    } catch (error) {
      alert('Error parsing CSV file. Please check the format.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImport = () => {
    if (!validationResult) return;

    const { valid } = validationResult;
    const availableSeats = totalSeats - usedSeats;
    const activeUsersToImport = valid.filter(u => u.status === 'active').length;

    if (activeUsersToImport > availableSeats) {
      alert(`Not enough seats available. You have ${availableSeats} seats but trying to import ${activeUsersToImport} active users. Please upgrade your plan or reduce the number of active users.`);
      return;
    }

    // Convert to TeamMember format
    const newMembers: Partial<TeamMember>[] = valid.map((user, index) => ({
      id: `tm_import_${Date.now()}_${index}`,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role as any,
      title: getRoleTitle(user.role),
      department: user.department,
      status: user.status,
      joinedDate: new Date().toISOString().split('T')[0],
      avatar: user.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      location: 'Not specified',
      territory: user.team || 'Unassigned'
    }));

    onImport(newMembers);
    handleClose();
  };

  const getRoleTitle = (role: string): string => {
    const titles: Record<string, string> = {
      'sales_rep': 'Sales Representative',
      'account_executive': 'Account Executive',
      'sales_manager': 'Sales Manager',
      'team_lead': 'Team Lead',
      'director': 'Director'
    };
    return titles[role] || role;
  };

  const handleClose = () => {
    setUploadedFile(null);
    setValidationResult(null);
    setIsDragging(false);
    setIsProcessing(false);
    onClose();
  };

  const availableSeats = totalSeats - usedSeats;
  const activeUsersToImport = validationResult?.valid.filter(u => u.status === 'active').length || 0;
  const seatCheckPassed = activeUsersToImport <= availableSeats;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />

        <div className="inline-block w-full max-w-3xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Import Team Members</h2>
            <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* STEP 1: Download Template */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                Step 1: Download Template
              </h3>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-4">
                  Download our CSV template to ensure your data is formatted correctly.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download CSV Template
                </button>
                <div className="mt-4 text-xs text-gray-600">
                  <p className="font-medium mb-2">Template includes:</p>
                  <ul className="space-y-1">
                    <li>• Full Name (required)</li>
                    <li>• Email (required, unique)</li>
                    <li>• Phone (optional)</li>
                    <li>• Role (required): sales_rep, account_executive, sales_manager, team_lead, director</li>
                    <li>• Department (required)</li>
                    <li>• Manager Email (optional)</li>
                    <li>• Team (optional)</li>
                    <li>• Status (Active/Inactive)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* STEP 2: Upload File */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                Step 2: Upload File
              </h3>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Drag & Drop CSV File Here
                  </p>
                  <p className="text-xs text-gray-500 mb-4">or click to browse</p>
                  <div className="text-xs text-gray-500 space-y-1 mb-4">
                    <p>Supported: .csv files only</p>
                    <p>Max size: 5MB</p>
                    <p>Max rows: 100 users</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
                  >
                    Choose File
                  </button>
                  {uploadedFile && (
                    <p className="mt-4 text-sm text-green-600 font-medium">
                      ✓ {uploadedFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 3: Review & Import */}
            {validationResult && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  Step 3: Review & Import
                </h3>
                <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-4">
                  {/* Summary */}
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-900">{validationResult.valid.length} valid users</span>
                    </div>
                    {validationResult.warnings.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-gray-900">{validationResult.warnings.length} warnings</span>
                      </div>
                    )}
                    {validationResult.errors.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-gray-900">{validationResult.errors.length} errors</span>
                      </div>
                    )}
                  </div>

                  {/* Valid Users Preview */}
                  {validationResult.valid.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Valid Users:</h4>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                        <ul className="text-xs space-y-1 text-gray-700">
                          {validationResult.valid.slice(0, 5).map((user, idx) => (
                            <li key={idx}>
                              • {user.name} ({user.email}) - {getRoleTitle(user.role)}
                            </li>
                          ))}
                          {validationResult.valid.length > 5 && (
                            <li className="text-gray-500 italic">
                              ... and {validationResult.valid.length - 5} more
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {validationResult.warnings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Warnings:</h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                        <ul className="text-xs space-y-1 text-gray-700">
                          {validationResult.warnings.map((warning, idx) => (
                            <li key={idx}>
                              • Row {warning.row}: {warning.message}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-gray-600 mt-2 italic">
                          Action: These users will be skipped
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {validationResult.errors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Errors:</h4>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                        <ul className="text-xs space-y-1 text-gray-700">
                          {validationResult.errors.map((error, idx) => (
                            <li key={idx}>
                              • Row {error.row}: {error.message}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-gray-600 mt-2 italic">
                          Action: Fix these errors and re-upload
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Seat Check */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Seat Check:</h4>
                    <div className={`border rounded-lg p-3 ${
                      seatCheckPassed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="text-xs space-y-1 text-gray-700">
                        <p>• Current: {usedSeats}/{totalSeats} seats used</p>
                        <p>• Active users to import: {activeUsersToImport}</p>
                        <p>• After import: {usedSeats + activeUsersToImport}/{totalSeats} seats</p>
                        {!seatCheckPassed && (
                          <p className="text-red-700 font-semibold mt-2">
                            ⚠️ Over limit! Action required: Upgrade plan or reduce import to {availableSeats} active users
                          </p>
                        )}
                        {seatCheckPassed && activeUsersToImport > 0 && (
                          <p className="text-green-700 font-semibold mt-2">
                            ✓ Seat check passed
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Processing file...</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            {validationResult && validationResult.errors.length > 0 && (
              <button
                onClick={() => {
                  setUploadedFile(null);
                  setValidationResult(null);
                }}
                className="px-4 py-2 text-yellow-700 bg-yellow-50 border border-yellow-300 rounded-lg hover:bg-yellow-100 font-medium transition-colors"
              >
                Fix Errors
              </button>
            )}
            {validationResult && validationResult.valid.length > 0 && (
              <button
                onClick={handleImport}
                disabled={!seatCheckPassed}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  seatCheckPassed
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Import {validationResult.valid.length} Valid Users
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
