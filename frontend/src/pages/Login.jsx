import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Button, Input, Alert } from '../components/common';
import { Mail } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData]       = useState({ email: '', password: '' });
  const [errors, setErrors]           = useState({});
  const [isLoading, setIsLoading]     = useState(false);
  const [apiError, setApiError]       = useState('');
  const [successMessage, setSuccess]  = useState('');

  const validateForm = () => {
    const e = {};
    if (!formData.email)
      e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = 'Invalid email format';

    if (!formData.password)
      e.password = 'Password is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = ({ target: { name, value } }) => {
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const { data } = await authAPI.login(formData);
      if (data.data) {
        login(data.data.user, data.data.token);
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => navigate('/'), 1200);
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4 pt-20 pb-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white p-4 rounded-xl shadow-card mb-4">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account to book tickets</p>
        </div>

        {/* Alerts */}
        {apiError && (
          <Alert type="error" title="Login Failed" message={apiError}
            onClose={() => setApiError('')} className="mb-4" />
        )}
        {successMessage && (
          <Alert type="success" title="Success" message={successMessage}
            closeable={false} className="mb-4" />
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-card-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              showPasswordToggle
              autoComplete="current-password"
            />

            <Button type="submit" isLoading={isLoading} disabled={isLoading}
              className="w-full" size="lg">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="link font-semibold">Sign up</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
