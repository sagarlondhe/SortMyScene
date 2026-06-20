import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { Button, Input, Alert } from '../components/common';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors]          = useState({});
  const [isLoading, setIsLoading]    = useState(false);
  const [apiError, setApiError]      = useState('');
  const [successMessage, setSuccess] = useState('');

  const validateForm = () => {
    const e = {};

    if (!formData.username)
      e.username = 'Username is required';
    else if (!/^[a-zA-Z0-9_]{3,30}$/.test(formData.username))
      e.username = 'Username must be 3–30 characters (letters, numbers, underscores)';

    if (!formData.email)
      e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = 'Invalid email format';

    if (!formData.password)
      e.password = 'Password is required';
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password))
      e.password = 'Must be 8+ chars with uppercase, lowercase, number and special character';

    if (!formData.confirmPassword)
      e.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword)
      e.confirmPassword = 'Passwords do not match';

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
      const { data } = await authAPI.register({
        username: formData.username,
        email:    formData.email,
        password: formData.password,
      });
      if (data.data) {
        login(data.data.user, data.data.token);
        setSuccess('Account created! Redirecting...');
        setTimeout(() => navigate('/'), 1200);
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
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
            <UserPlus className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join us to discover and book amazing events</p>
        </div>

        {/* Alerts */}
        {apiError && (
          <Alert type="error" title="Registration Failed" message={apiError}
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
              label="Username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              required
              autoComplete="username"
            />
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
              autoComplete="new-password"
              hint="Min 8 chars · uppercase · lowercase · number · special character"
            />
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
              showPasswordToggle
              autoComplete="new-password"
            />

            <Button type="submit" isLoading={isLoading} disabled={isLoading}
              className="w-full" size="lg">
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="link font-semibold">Sign in</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
