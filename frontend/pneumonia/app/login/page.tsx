'use client';

/**
 * Página de Login
 * Formulario de autenticación con email y contraseña
 */

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { HiMail, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(formData);
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err.data?.error || err.data?.detail || 'Error al iniciar sesión';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Contenedor centrado con ancho máximo */}
      <div className="w-full max-w-5xl h-[85vh] flex bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Panel Izquierdo - Logo e Imagen del Doctor */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden animate-slideInLeft">
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* Contenido del panel izquierdo */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full p-11 gap-6">
            {/* Logo centrado */}
            <div className="flex-shrink-0 animate-fadeInDown">
              <Image
                src="/logo.png"
                alt="Logo"
                width={300}
                height={54}
                className="object-contain"
                priority
              />
            </div>

            {/* Imagen del doctor centrada */}
            <div className="flex-1 flex items-center justify-center w-full max-w-md animate-fadeInUp animation-delay-200">
              <div className="relative w-full aspect-square">
                <Image
                  src="/doc.png"
                  alt="Doctor"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Formulario */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-8 animate-slideInRight">
          <div className="w-full max-w-sm">
          {/* Logo móvil (solo visible en pantallas pequeñas) */}
          <div className="lg:hidden mb-6 text-center animate-fadeInDown">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={36}
              className="mx-auto mb-3"
              priority
            />
            <h1 className="text-xl font-bold text-gray-900">
              Pneumonia Detection
            </h1>
          </div>

          {/* Título del formulario */}
          <div className="mb-6 animate-fadeInDown animation-delay-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Iniciar Sesión
            </h2>
            <p className="text-sm text-gray-600">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 animate-shake">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5 animate-fadeInUp animation-delay-200">
            {/* Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <HiMail className="h-5 w-5 text-indigo-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-semibold text-gray-700 placeholder:text-gray-400 placeholder:font-normal"
                  placeholder="Ingresa tu correo electrónico"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <HiLockClosed className="h-5 w-5 text-indigo-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-semibold text-gray-700 placeholder:text-gray-400 placeholder:font-normal"
                  placeholder="Ingresa tu contraseña"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <HiEyeOff className="h-5 w-5 text-gray-500 hover:text-indigo-600" />
                  ) : (
                    <HiEye className="h-5 w-5 text-gray-500 hover:text-indigo-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Recordar sesión */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
              />
              <label 
                htmlFor="remember-me" 
                className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer"
              >
                Recordar sesión
              </label>
            </div>

            {/* Botón de submit */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg 
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>

            {/* ¿Olvidaste tu contraseña? */}
            <div className="text-center">
              <Link 
                href="/forgot-password"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          {/* Footer móvil */}
          <p className="mt-6 text-center text-xs text-gray-500 lg:hidden animate-fadeIn animation-delay-400">
            © 2025 Pneumonia Detection System
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
