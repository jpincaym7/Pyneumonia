'use client';

/**
 * Página de Perfil de Usuario
 * Diseño profesional estilo CV Amazon
 */

import { useAuth } from '@/contexts/AuthContext';
import { 
  MdPerson, 
  MdEmail, 
  MdVerifiedUser,
  MdCalendarToday,
  MdGroup,
  MdCheckCircle,
  MdPhone,
  MdLocationOn,
  MdBadge,
  MdShield,
  MdBusiness,
  MdAccountCircle
} from 'react-icons/md';

export default function ProfilePage() {
  const { user, group } = useAuth();

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'U';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-900 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section - CV Style */}
        <div className="border-b-4 border-gray-900 pb-8 mb-10">
          <div className="flex items-start gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-32 h-32 bg-gray-900 rounded-sm flex items-center justify-center text-white font-bold text-5xl">
                  {getInitials(user.full_name || user.username || 'U')}
                </div>
                {user.is_active && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-600 rounded-full border-4 border-white flex items-center justify-center">
                    <MdCheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Name and Title */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {user.full_name || user.username}
              </h1>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg text-gray-700 font-medium">
                  @{user.username}
                </span>
                {user.is_active && (
                  <span className="inline-flex items-center gap-1 text-sm text-green-700 font-medium">
                    <MdVerifiedUser className="w-4 h-4" /> Verificado
                  </span>
                )}
              </div>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {group && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white text-sm font-medium">
                    <MdGroup className="w-4 h-4" /> {group.name}
                  </span>
                )}
                {user.is_superuser && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gray-800 text-white text-sm font-medium">
                    <MdShield className="w-4 h-4" /> Administrador
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column - Contact & Details */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Contact Information */}
            <section>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b-2 border-gray-900">
                Contacto
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MdEmail className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">Email</span>
                  </div>
                  <p className="text-gray-900 font-medium break-words">
                    {user.email || <span className="text-gray-400">No especificado</span>}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MdPhone className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">Teléfono</span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {user.phone || <span className="text-gray-400">No especificado</span>}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MdLocationOn className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">Dirección</span>
                  </div>
                  <p className="text-gray-900 font-medium break-words">
                    {user.direction || <span className="text-gray-400">No especificado</span>}
                  </p>
                </div>
              </div>
            </section>

            {/* Identification */}
            <section>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b-2 border-gray-900">
                Identificación
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MdBadge className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">Cédula/RUC</span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {user.dni || <span className="text-gray-400">No especificado</span>}
                  </p>
                </div>
              </div>
            </section>

            {/* Account Details */}
            <section>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b-2 border-gray-900">
                Cuenta
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MdAccountCircle className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">Usuario</span>
                  </div>
                  <p className="text-gray-900 font-medium">@{user.username}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MdCalendarToday className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">Fecha de Registro</span>
                  </div>
                  <p className="text-gray-900 font-medium">
                    {user.date_joined ? formatDate(user.date_joined) : 'No disponible'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MdCheckCircle className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">Estado</span>
                  </div>
                  {user.is_active ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold">
                      Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold">
                      Inactiva
                    </span>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Main Information */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Personal Information */}
            <section>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b-2 border-gray-900 flex items-center gap-2">
                <MdPerson className="w-5 h-5" /> Información Personal
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Nombres
                    </label>
                    <div className="border-gray-900 pl-4">
                      <p className="text-gray-900 font-medium text-lg">
                        {user.first_name || <span className="text-gray-400">No especificado</span>}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Apellidos
                    </label>
                    <div className=" border-gray-900 pl-4">
                      <p className="text-gray-900 font-medium text-lg">
                        {user.last_name || <span className="text-gray-400">No especificado</span>}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Nombre Completo
                  </label>
                  <div className=" border-gray-900 pl-4">
                    <p className="text-gray-900 font-medium text-lg">
                      {user.full_name || <span className="text-gray-400">No especificado</span>}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Professional Information */}
            <section>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b-2 border-gray-900 flex items-center gap-2">
                <MdBusiness className="w-5 h-5" /> Información Profesional
              </h2>
              <div className="space-y-6">
                {group && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Departamento / Grupo
                    </label>
                    <div className=" border-gray-900 pl-4">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-medium">
                        <MdGroup className="w-5 h-5" /> {group.name}
                      </span>
                    </div>
                  </div>
                )}

                {user.is_superuser && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Privilegios del Sistema
                    </label>
                    <div className="border-l-4 border-gray-900 pl-4">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white font-medium">
                        <MdShield className="w-5 h-5" /> Super Administrador
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Rol en el Sistema
                  </label>
                  <div className="border-gray-900 pl-4">
                    <p className="text-gray-900 font-medium text-lg">
                      {group?.name || 'Usuario Estándar'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Additional Details */}
            <section>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b-2 border-gray-900 flex items-center gap-2">
                <MdVerifiedUser className="w-5 h-5" /> Detalles Adicionales
              </h2>
              <div className="bg-gray-50 border border-gray-200 p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Estado de Verificación:</span>
                    <span className="text-gray-900 font-semibold">
                      {user.is_active ? 'Verificado y Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Tipo de Cuenta:</span>
                    <span className="text-gray-900 font-semibold">
                      {user.is_superuser ? 'Administrador' : 'Usuario Estándar'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Fecha de Creación:</span>
                    <span className="text-gray-900 font-semibold">
                      {user.date_joined ? formatDate(user.date_joined) : 'No disponible'}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MdShield className="w-4 h-4" />
              <span>Información confidencial del sistema</span>
            </div>
            <div>
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}