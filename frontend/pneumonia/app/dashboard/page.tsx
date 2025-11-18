'use client';

import { useAuth } from '@/contexts/AuthContext';
import { DynamicIcon } from '@/components/icons/DynamicIcon';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { statisticsService, DashboardOverview } from '@/services/statistics.service';
import { AdminMetrics } from '@/components/dashboard/AdminMetrics';
import { RadiologistMetrics } from '@/components/dashboard/RadiologistMetrics';
import { DoctorMetrics } from '@/components/dashboard/DoctorMetrics';
import { ReceptionistMetrics } from '@/components/dashboard/ReceptionistMetrics';

// Helper para la fecha actual (Toque premium)
const CurrentDate = () => {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  // Aseguramos que dateString exista antes de renderizar
  const dateString = date.toLocaleDateString('es-ES', options);
  return <span className="capitalize opacity-80 font-medium">{dateString}</span>;
};

export default function DashboardPage() {
  const { user, menus } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await statisticsService.getDashboardOverview();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (!user) return null;

  // Helper para renderizar métricas según rol
  // CORRECCIÓN: Tratamos user_group como string, no como array
  const renderMetrics = () => {
    if (!dashboardData?.group_specific_metrics) return null;
    
    const { user_role, user_group } = dashboardData;
    // Aseguramos que group sea un string para evitar errores si viene null
    const group = user_group || ''; 

    console.log('User Role:', user_group);
    
    if (user_group === 'admin') {
      return <AdminMetrics metrics={dashboardData.group_specific_metrics} />;
    }
    
    if (group.includes('Radiólogos') || group.includes('Radiología')) {
      return <RadiologistMetrics metrics={dashboardData.group_specific_metrics} />;
    }
    
    if (group.includes('Médicos')) {
      return <DoctorMetrics metrics={dashboardData.group_specific_metrics} />;
    }
    
    if (group.includes('Recepcion') || group.includes('Administrat')) {
      return <ReceptionistMetrics metrics={dashboardData.group_specific_metrics} />;
    }

    return <div className="text-gray-500 text-center py-4">Sin métricas asignadas para este rol.</div>;
  };

  // Mensaje de bienvenida dinámico
  const getWelcomeMessage = () => {
    const group = dashboardData?.user_group || '';

    if (dashboardData?.user_role === 'admin') return '¡Panel de Administración!';
    if (group.includes('Radiólogos')) return '¡Panel de Radiología!';
    if (group.includes('Médicos')) return '¡Gestión Médica!';
    if (group.includes('Recepcion')) return '¡Gestión de Recepción!';
    
    return '¡Que tengas una excelente jornada!';
  };

  return (
    <div className="space-y-8 pb-10 max-w-[1600px] mx-auto">
      
      {/* Header Minimalista */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 animate-fadeIn">
        <div>
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <CurrentDate />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Resumen General
          </h1>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* 1. Welcome Card Original (Mejorado) - Columna Izquierda */}
        <div className="xl:col-span-3 flex">
          <div className="relative w-full bg-gradient-to-b from-blue-50 via-white to-white rounded-3xl shadow-lg shadow-blue-100/50 border border-blue-100 overflow-hidden flex flex-col min-h-[420px] animate-fadeIn transition-all hover:shadow-xl duration-300">
            
            {/* Decoración: Lámpara */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-40 h-48 z-20 pointer-events-none">
              <Image 
                src="/lamp.png" 
                alt="Lamp" 
                width={160}
                height={192}
                className="w-full h-full object-contain drop-shadow-xl"
                priority
              />
              {/* Luz (Efecto mejorado) */}
              <div className="absolute top-[85%] left-1/2 transform -translate-x-1/2 w-64 h-64 bg-amber-200/30 blur-[60px] rounded-full mix-blend-screen pointer-events-none"></div>
            </div>

            {/* Contenido de Texto */}
            <div className="relative z-10 text-center mt-44 px-6">
               {/* Emoji pequeño decorativo */}
              <div className="inline-block mb-2 animate-bounce delay-700">
                <span className="text-xl">🌞</span>
              </div>

              <h2 className="text-lg font-semibold text-slate-500 mb-0">Hola,</h2>
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight mb-2">
                {user.full_name?.split(' ')[0]}
              </h3>
              
              <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide rounded-full mb-3 border border-blue-100">
                {user.user_group || dashboardData?.user_group || 'Usuario'}
              </div>

              <p className="text-slate-600 text-sm font-medium leading-relaxed max-w-[200px] mx-auto">
                {getWelcomeMessage()}
              </p>
            </div>

            {/* Decoración: Paciente */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[85%] max-w-[280px] z-10">
               {/* Sombra base */}
              <div className="absolute bottom-0 left-4 right-4 h-4 bg-black/10 blur-lg rounded-full"></div>
              <Image 
                src="/patient.png" 
                alt="Medical Illustration" 
                width={280}
                height={200}
                className="w-full h-auto object-contain object-bottom relative z-10"
                priority
              />
            </div>

            {/* Decoración: Ondas SVG (Fondo) */}
            <div className="absolute bottom-0 left-0 right-0 h-24 z-0 overflow-hidden opacity-30">
               <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full text-blue-200 fill-current">
                  <path fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,202.7C672,203,768,181,864,181.3C960,181,1056,203,1152,208C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
               </svg>
            </div>
          </div>
        </div>

        {/* 2. Sección de Estadísticas - Columna Derecha */}
        <div className="xl:col-span-9 flex flex-col gap-6">
          <div className="bg-slate-50/50 rounded-3xl border border-slate-200/60 p-1 shadow-sm h-full">
            {!loading && dashboardData ? (
              <div className="animate-fadeIn h-full flex flex-col">
                {/* Encabezado de sección sutil dentro del card */}
                <div className="px-6 pt-4 pb-2 flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-wider">
                  <DynamicIcon name="chart-pie" className="w-4 h-4" />
                  Métricas en tiempo real
                </div>
                {/* Contenedor de métricas */}
                <div className="flex-1">
                   {renderMetrics()}
                </div>
              </div>
            ) : (
              /* Skeleton de carga */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-32 animate-pulse relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-full"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-slate-300 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Acceso Rápido a Módulos (Diseño Bento Grid) */}
      {menus.length > 0 && (
        <div className="animate-fadeInUp animation-delay-200 pt-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                <ArrowUpRight name="grid" className="w-5 h-5" />
              </span>
              Acceso Rápido
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {menus.slice(0, 1).map((menuModule) => 
              menuModule.modules.slice(0, 4).map((module) => (
                <Link
                  key={module.id}
                  href={module.url}
                  className="group relative bg-white border border-slate-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className="flex flex-col items-start gap-4 relative z-10">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white shadow-sm">
                      <DynamicIcon 
                        name={module.icon} 
                        className="h-7 w-7 transition-transform group-hover:scale-110 duration-300"
                      />
                    </div>
                    
                    <div className="w-full">
                      <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">
                        {module.name}
                      </h3>
                      {module.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2 group-hover:text-slate-600">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Decoración sutil en hover */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] opacity-0 group-hover:opacity-40 transition-opacity duration-500 -mr-8 -mt-8 z-0"></div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}