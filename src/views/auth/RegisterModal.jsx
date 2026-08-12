import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import PasswordStrengthIndicator, { getPasswordStrength } from '../../components/PasswordStrengthIndicator';
import {
  Bus,
  Lock,
  Mail,
  User,
  Phone,
  Hash,
  Building2,
  GraduationCap,
  Eye,
  EyeOff,
  Camera,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
  Sparkles,
} from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology & Bioinformatics',
  'Business Administration & Management',
];

const ACADEMIC_YEARS = [
  '1st Year (Freshman)',
  '2nd Year (Sophomore)',
  '3rd Year (Junior)',
  '4th Year (Senior)',
  'Post Graduate (Master / PhD)',
];

const RegisterModal = () => {
  const { register, setAuthView, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    studentId: '',
    department: '',
    year: '',
    password: '',
    confirmPassword: '',
    photoUrl: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Real-time Field Validation
  const validateField = (name, value, allData = formData) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value.trim()) {
          error = 'Full name is required';
        } else if (value.trim().length < 2) {
          error = 'Name must be at least 2 characters';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          error = 'Please enter a valid email address (e.g. name@campus.edu)';
        }
        break;

      case 'phone':
        if (!value.trim()) {
          error = 'Phone number is required';
        } else if (!/^[\d\s+\-()]{8,18}$/.test(value.trim())) {
          error = 'Please enter a valid phone number (e.g. +91 98765 43210)';
        }
        break;

      case 'studentId':
        if (!value.trim()) {
          error = 'Student ID is required';
        } else if (value.trim().length < 3) {
          error = 'Student ID must be at least 3 characters';
        }
        break;

      case 'department':
        if (!value) {
          error = 'Please select your department';
        }
        break;

      case 'year':
        if (!value) {
          error = 'Please select your academic year';
        }
        break;

      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters long';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password';
        } else if (value !== allData.password) {
          error = 'Passwords do not match';
        }
        break;

      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);

    if (generalError) setGeneralError('');

    if (touched[name]) {
      const error = validateField(name, value, updatedData);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    // Live check password confirmation if confirmPassword is typed
    if (name === 'password' && touched.confirmPassword) {
      const confirmError = validateField('confirmPassword', formData.confirmPassword, updatedData);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value, formData);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Image Upload Preview Handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setGeneralError('Profile photo size should be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photoUrl: '' }));
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    // Mark all as touched
    const allTouched = {
      name: true,
      email: true,
      phone: true,
      studentId: true,
      department: true,
      year: true,
      password: true,
      confirmPassword: true,
    };
    setTouched(allTouched);

    // Validate all fields
    const formErrors = {};
    Object.keys(allTouched).forEach((field) => {
      const err = validateField(field, formData[field], formData);
      if (err) formErrors[field] = err;
    });

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setGeneralError('Please correct the highlighted errors before submitting.');
      return;
    }

    const result = await register(
      {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        studentId: formData.studentId,
        department: formData.department,
        year: formData.year,
        photoUrl: formData.photoUrl,
      },
      formData.password
    );

    if (!result.success) {
      setGeneralError(result.error || 'Failed to create student account.');
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 py-8">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Bus className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Student Registration Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Create Student Account</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Register your verified student credentials to access live tracking and your campus Digital Pass.
            </p>
          </div>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          
          {/* Optional Profile Photo Picker */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-brand-300 flex items-center justify-center overflow-hidden shadow-sm">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <Camera className="w-6 h-6 mx-auto text-brand-500 mb-0.5" />
                    <span className="text-[10px] font-bold text-slate-500 block">Photo</span>
                  </div>
                )}
              </div>
              {formData.photoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-2 -right-2 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md transition-colors"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-bold text-slate-800">Profile Photo</span>
                <span className="text-[11px] font-medium text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">Optional</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Upload a student passport photo for your Digital Bus Pass ID. JPG, PNG up to 2MB.
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-brand-50 text-brand-700 font-bold text-xs rounded-xl border border-brand-200 cursor-pointer shadow-sm transition-all hover:border-brand-300">
                <Upload className="w-3.5 h-3.5" />
                <span>{formData.photoUrl ? 'Change Photo' : 'Select Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. Alex Johnson"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors ${
                    errors.name && touched.name ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.name && touched.name && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Campus / Personal Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="student@smartbus.edu"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors ${
                    errors.email && touched.email ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.email && touched.email && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="+91 98290 12345"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors ${
                    errors.phone && touched.phone ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.phone && touched.phone && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Student ID */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Student ID / Roll No <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="STU-2026-0881"
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none uppercase transition-colors ${
                    errors.studentId && touched.studentId ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
              </div>
              {errors.studentId && touched.studentId && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.studentId}
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-8 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors appearance-none ${
                    errors.department && touched.department ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                >
                  <option value="">Select Department...</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              {errors.department && touched.department && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.department}
                </p>
              )}
            </div>

            {/* Academic Year */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Academic Year <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-8 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors appearance-none ${
                    errors.year && touched.year ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                >
                  <option value="">Select Academic Year...</option>
                  {ACADEMIC_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
              {errors.year && touched.year && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.year}
                </p>
              )}
            </div>

            {/* Role Display (Locked to Student) */}
            <div className="sm:col-span-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-900">Assigned Account Role:</span>
                <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                  Student
                </span>
              </div>
              <span className="text-[11px] text-blue-700 hidden sm:inline font-medium">
                Admin accounts require institutional access
              </span>
            </div>

            {/* Password */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Create Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Minimum 8 characters"
                  className={`w-full pl-10 pr-11 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors ${
                    errors.password && touched.password ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.password}
                </p>
              )}

              {/* Password Strength Indicator */}
              <PasswordStrengthIndicator password={formData.password} />
            </div>

            {/* Confirm Password */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Re-enter your password"
                  className={`w-full pl-10 pr-11 py-3 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors ${
                    errors.confirmPassword && touched.confirmPassword
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-800 hover:to-brand-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/30 hover:brightness-105 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Create Student Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link back to Login */}
        <div className="border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <button
              onClick={() => setAuthView('login')}
              className="font-bold text-brand-600 hover:text-brand-800 hover:underline transition-colors ml-1 inline-flex items-center gap-1"
            >
              <span>Login</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default RegisterModal;
