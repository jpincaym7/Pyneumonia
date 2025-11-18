'use client';

/**
 * Layout del Dashboard
 * Sidebar compartido para todas las páginas dentro de /dashboard
 */

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { DynamicIcon } from '@/components/icons/DynamicIcon';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MdLogout, 
  MdPerson, 
  MdExpandMore, 
  MdExpandLess, 
  MdMenuOpen, 
  MdSettings, 
  MdAccessTime,
  MdOutlineNotifications, // <--- Icono añadido
  MdOutlineCalendarMonth // <--- Icono añadido
} from 'react-icons/md';
import { HiMenuAlt2 } from 'react-icons/hi';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, menus, group, logout, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<number[]>(() => 
    menus.map(m => m.menu.id)
  );
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Actualizar reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Cerrar menú de perfil al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const toggleMenu = (menuId: number) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // Función para obtener las iniciales del nombre
  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') {
      return 'U';
    }
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Función para formatear la hora
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      // Omitimos los segundos para un look más limpio
      // second: '2-digit' 
    });
  };

  // Función para formatear la fecha
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      // Omitimos el año para más brevedad
      // year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Backdrop para móviles */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 h-screen bg-indigo-600 text-white transition-all duration-300 z-40 flex flex-col shadow-xl animate-slideInLeft ${
          sidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:w-20 lg:translate-x-0'
        }`}
      >
        {/* Logo y Toggle */}
        <div className="p-4 border-b border-indigo-500">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-indigo-700 rounded-lg transition-colors flex-shrink-0"
                  title="Cerrar menú"
                >
                  <MdMenuOpen className="h-5 w-5" />
                </button>
                <Link href="/dashboard" className="flex items-center gap-3 animate-fadeIn flex-1 justify-center">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={160}
                    height={48}
                    className="object-contain"
                    priority
                  />
                </Link>
              </>
            ) : (
              <div className="w-full flex flex-col items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-indigo-700 rounded-lg transition-colors"
                  title="Abrir menú"
                >
                  <HiMenuAlt2 className="h-5 w-5" />
                </button>
                <Link href="/dashboard" className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-indigo-50 transition-colors">
                  <span className="text-indigo-600 font-bold text-xl">P</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        {sidebarOpen && (
          <div className="p-4 border-b border-indigo-500 animate-fadeIn animation-delay-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-700 rounded-full flex items-center justify-center">
                <MdPerson className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.full_name || 'Usuario'}</p>
                <p className="text-xs text-indigo-200 truncate">{user.email || 'Sin email'}</p>
                {group && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-700 rounded text-xs">
                    {group.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 animate-fadeInUp animation-delay-200 sidebar-scroll">
          {menus.map((menuModule) => (
            <div key={menuModule.menu.id} className="space-y-1">
              {/* Menu Header */}
              <button
                onClick={() => toggleMenu(menuModule.menu.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-indigo-700 transition-all ${
                  !sidebarOpen && 'justify-center'
                }`}
              >
                <DynamicIcon 
                  name={menuModule.menu.icon} 
                  className="h-5 w-5 flex-shrink-0"
                />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left text-sm font-medium truncate">
                      {menuModule.menu.name}
                    </span>
                    {expandedMenus.includes(menuModule.menu.id) ? (
                      <MdExpandLess className="h-5 w-5 flex-shrink-0" />
                    ) : (
                      <MdExpandMore className="h-5 w-5 flex-shrink-0" />
                    )}
                  </>
                )}
              </button>

              {/* Modules */}
              {sidebarOpen && expandedMenus.includes(menuModule.menu.id) && (
                <div className="ml-4 space-y-1 animate-fadeInDown">
                  {menuModule.modules.map((module) => (
                    <Link
                      key={`menu-${menuModule.menu.id}-module-${module.id}`}
                      href={module.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-700 transition-all group"
                    >
                      <DynamicIcon 
                        name={module.icon} 
                        className="h-4 w-4 text-indigo-200 group-hover:text-white transition-colors flex-shrink-0"
                      />
                      <span className="text-sm text-indigo-100 group-hover:text-white truncate">
                        {module.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {menus.length === 0 && sidebarOpen && (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-indigo-200">
                No hay módulos disponibles
              </p>
            </div>
          )}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-indigo-500">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 transition-all ${
              !sidebarOpen && 'justify-center'
            }`}
          >
            <MdLogout className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">

        {/* =================================================================== */}
        {/* ============ INICIO: HEADER MEJORADO (SISTEMA MÉDICO) ============ */}
        {/* =================================================================== */}
        <header className="sticky top-0 bg-white border-b border-gray-200 z-30 shadow-sm">
          <div className="px-6 py-4"> {/* Aumentamos padding vertical para más espacio */}
            <div className="flex items-center justify-between">
              
              {/* === Sección Izquierda: Saludo y Toggle === */}
              <div className="flex items-center gap-4">
                {/* Botón menú móvil */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2.5 hover:bg-gray-100 rounded-xl transition-all"
                  title="Abrir menú"
                >
                  <HiMenuAlt2 className="h-6 w-6 text-gray-700" />
                </button>
                
                {/* Saludo de Bienvenida (Desktop) */}
                <div className="hidden lg:block">
                  <h1 className="text-xl font-bold text-gray-800">
                    Bienvenido, {user.full_name ? user.full_name.split(' ')[0] : 'Usuario'}
                  </h1>
                  {group && (
                    <p className="text-sm text-gray-500">
                      {group.name}
                    </p>
                  )}
                </div>
              </div>

              {/* === Sección Derecha: Acciones, Reloj y Perfil === */}
              <div className="flex items-center gap-4">
                
                {/* --- APARTADO MEJORADO: Reloj y Fecha (Estilo Dashboard) --- */}
                {/* Se oculta en móviles (md:flex) */}
                <div className="hidden md:flex items-center gap-4 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-700" title={formatDate(currentTime)}>
                    <MdOutlineCalendarMonth className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm font-medium capitalize">
                      {/* Mostramos solo día y número para brevedad */}
                      {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-gray-300"></div> {/* Separador */}
                  <div className="flex items-center gap-2 text-gray-700">
                    <MdAccessTime className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm font-medium tabular-nums">
                      {formatTime(currentTime)}
                    </span>
                  </div>
                </div>


                {/* Separador vertical (Solo Desktop) */}
                <div className="hidden lg:block w-px h-8 bg-gray-200"></div>

                {/* Reloj simple (Solo Móvil) - Más limpio, sin fondo */}
                <div className="md:hidden flex items-center gap-2 text-gray-700">
                  <MdAccessTime className="h-5 w-5" />
                  <span className="text-sm font-bold tabular-nums">
                    {formatTime(currentTime)}
                  </span>
                </div>

                {/* --- Menú de Perfil (Sin cambios, ya estaba bien) --- */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-3 p-1.5 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white group-hover:ring-blue-200 transition-all">
                        {getInitials(user.full_name)}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>

                    {/* Nombre y flecha (Solo Desktop) */}
                    <div className="hidden lg:flex items-center gap-2">
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {user.full_name ? user.full_name.split(' ')[0] : 'Usuario'}
                        </p>
                        {group && (
                          <p className="text-xs text-gray-500">
                            {group.name}
                          </p>
                        )}
                      </div>
                      <MdExpandMore 
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                          profileMenuOpen ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </button>

                  {/* Menú desplegable */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fadeInDown z-50">
                      {/* Header del menú */}
                      <div className="bg-white border-b border-gray-200 p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md">
                            {getInitials(user.full_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-bold text-sm truncate">
                              {user.full_name || 'Usuario'}
                            </p>
                            <p className="text-gray-500 text-xs truncate">
                              {user.email || 'Sin email'}
                            </p>
                            {group && (
                              <span className="inline-block mt-0.5 px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 font-medium">
                                {group.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Opciones del menú */}
                      <div className="p-1.5">
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-all duration-200 group"
                        >
                          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <MdPerson className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                              Ver perfil
                            </p>
                            <p className="text-xs text-gray-500">
                              Gestiona tu cuenta
                            </p>
                          </div>
                        </Link>

                        <div className="my-1.5 border-t border-gray-200"></div>

                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-all duration-200 group"
                        >
                          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                            <MdLogout className="h-4 w-4 text-red-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold text-red-600 group-hover:text-red-700">
                              Cerrar sesión
                            </p>
                            <p className="text-xs text-red-400">
                              Salir de tu cuenta
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </header>
        {/* =================================================================== */}
        {/* ============= FIN: HEADER MEJORADO (SISTEMA MÉDICO) ============= */}
        {/* =================================================================== */}


        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}