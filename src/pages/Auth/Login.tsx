import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Eye, EyeOff, AlertCircle, CheckCircle, Mail, Lock, Info,
  Globe, Activity, Sparkles, Rocket, Shield, Award, Users, Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirectPath = user.role === 'Admin' ? '/settings' : '/';
      navigate(redirectPath);
    }
  }, [user, navigate]);

  // Email validation
  const validateEmail = (email: string): string | undefined => {
    if (!email) return '⚠️ Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return '❌ Please enter a valid email address';
    return undefined;
  };

  // Password validation
  const validatePassword = (password: string): string | undefined => {
    if (!password) return '⚠️ Password is required';
    if (password.length < 6) return '⚠️ Password must be at least 6 characters';
    return undefined;
  };

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    if (password.length === 0) {
      setPasswordStrength(null);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 1) setPasswordStrength('weak');
    else if (strength === 2 || strength === 3) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  };

  // Caps Lock detection
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    } else {
      setCapsLockOn(false);
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({ ...prev, [name]: fieldValue }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  // Handle blur
  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));

    if (field === 'email') {
      const error = validateEmail(formData.email);
      if (error) setErrors(prev => ({ ...prev, email: error }));
    } else if (field === 'password') {
      const error = validatePassword(formData.password);
      if (error) setErrors(prev => ({ ...prev, password: error }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loginAttempts >= 5) {
      setRateLimited(true);
      setErrors({ general: 'Too many login attempts. Please try again in 5 minutes.' });
      setTimeout(() => {
        setRateLimited(false);
        setLoginAttempts(0);
        setErrors({});
      }, 300000);
      return;
    }

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError
      });
      setTouched({ email: true, password: true });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const success = await login(formData.email, formData.password);

      if (success) {
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('userEmail', formData.email);
        } else {
          localStorage.removeItem('rememberMe');
          localStorage.removeItem('userEmail');
        }
      } else {
        setLoginAttempts(prev => prev + 1);
        setErrors({
          general: 'Invalid email or password. Please try again.'
        });
      }
    } catch (error) {
      setLoginAttempts(prev => prev + 1);
      setErrors({
        general: 'An error occurred during login. Please try again.'
      });
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // SSO handlers
  const handleGoogleSSO = () => {
    setErrors({ general: 'Google SSO is not configured yet.' });
  };

  const handleMicrosoftSSO = () => {
    setErrors({ general: 'Microsoft SSO is not configured yet.' });
  };

  const handleForgotPassword = () => {
    setErrors({ general: 'Password reset functionality will be available soon.' });
  };

  // Load remembered email
  useEffect(() => {
    const rememberMe = localStorage.getItem('rememberMe');
    const savedEmail = localStorage.getItem('userEmail');

    if (rememberMe === 'true' && savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, []);

  const uspItems = [
    {
      icon: Sparkles,
      title: 'Intuitive, Modern User Experience',
      description: 'Designed with simplicity in mind, BMI offers a clean, modern interface that reduces training time and boosts team productivity from day one.'
    },
    {
      icon: Zap,
      title: 'Fully Customizable & Modular CRM',
      description: 'Tailor every module to your workflow. Add, remove, or configure features without developer support—BMI adapts to your business, not the other way around.'
    },
    {
      icon: Rocket,
      title: 'Advanced Automation & Intelligence',
      description: 'Leverage AI-driven insights and smart automation to eliminate repetitive tasks, predict customer behavior, and close deals faster.'
    },
    {
      icon: Shield,
      title: 'Transparent, Actionable Insights',
      description: 'Real-time dashboards and analytics provide clear visibility into your sales pipeline, team performance, and growth opportunities at a glance.'
    },
    {
      icon: Award,
      title: 'Built to Outperform Leading CRMs',
      description: 'BMI combines the power of Salesforce, the usability of HubSpot, and the affordability of Zoho—delivering enterprise-grade capabilities at a fraction of the cost.'
    }
  ];

  const trustedPartners = [
    'Salesforce', 'HubSpot', 'Zoho', 'Microsoft Dynamics', 'Pipedrive', 'Zendesk'
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Section - About BMI */}
      <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white p-8 lg:p-12 flex flex-col justify-center">
        <div className="max-w-xl mx-auto w-full">
          {/* Logo and Branding */}
          <div className="mb-8 lg:mb-12">
            <div className="flex items-center space-x-3 mb-4">
              <Building2 className="h-12 w-12 text-white" strokeWidth={2.5} />
              <div>
                <h1 className="text-4xl font-bold tracking-tight">BMI Platform</h1>
                <p className="text-blue-100 text-lg mt-1">Billboard Management Intelligence</p>
              </div>
            </div>
            <p className="text-blue-50 text-lg leading-relaxed">
              Transform your OOH advertising operations with our AI-powered platform designed for global digital billboard networks and media owners.
            </p>
          </div>

          {/* USPs */}
          <div className="mb-8 lg:mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Zap className="h-6 w-6 mr-2" />
              Why Choose BMI Platform?
            </h2>
            <div className="space-y-4">
              {uspItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/15 transition-all duration-200"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                      <p className="text-blue-100 text-sm">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trusted Partners */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Trusted by Industry Leaders
            </h3>
            <div className="flex flex-wrap gap-3">
              {trustedPartners.map((partner, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-8 lg:mt-12 flex items-center space-x-2 text-blue-100">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Enterprise-grade security & compliance</span>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="lg:w-1/2 bg-white flex items-center justify-center p-8 lg:p-12">
        <div className="max-w-md w-full">
          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to access your dashboard</p>
          </div>

          {/* Demo Credentials Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Demo Access</h3>
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>Email:</strong> demo@company.com<br />
                  <strong>Password:</strong> password123
                </p>
              </div>
            </div>
          </div>

          {/* General Error Message */}
          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Rate Limit Warning */}
          {loginAttempts >= 3 && !rateLimited && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <p className="text-sm text-orange-800">
                  Warning: {5 - loginAttempts} login attempts remaining
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  aria-invalid={touched.email && !!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                    touched.email && errors.email
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="you@company.com"
                />
              </div>
              {touched.email && errors.email && (
                <p id="email-error" className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  onKeyUp={handleKeyPress}
                  onKeyDown={handleKeyPress}
                  aria-invalid={touched.password && !!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                    touched.password && errors.password
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>

              {/* Caps Lock Warning */}
              {capsLockOn && (
                <p className="mt-2 text-sm text-orange-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>Caps Lock is on</span>
                </p>
              )}

              {/* Password Error */}
              {touched.password && errors.password && (
                <p id="password-error" className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.password}</span>
                </p>
              )}

              {/* Password Strength Indicator */}
              {formData.password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength === 'weak' ? 'w-1/3 bg-red-500' :
                          passwordStrength === 'medium' ? 'w-2/3 bg-yellow-500' :
                          'w-full bg-green-500'
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength === 'weak' ? 'text-red-600' :
                      passwordStrength === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading || rateLimited}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>
          </div>

          {/* SSO Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSSO}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={handleMicrosoftSSO}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 23 23">
                <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
              Microsoft
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            © 2024 BMI Platform. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
