'use client';

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  RadialBarChart, 
  RadialBar 
} from 'recharts';
import { 
  Users, 
  AlertOctagon, 
  CheckCircle2, 
  TrendingUp 
} from 'lucide-react';
import { GroupSpecificMetrics } from '@/services/statistics.service';

// --- Tipos y Datos ---
interface DoctorMetricsProps {
  metrics: GroupSpecificMetrics;
}

// Colores consistentes para la UI
const COLORS = {
  primary: '#3b82f6',   // Blue
  success: '#10b981',   // Emerald
  warning: '#f59e0b',   // Amber
  danger: '#ef4444',    // Red
  purple: '#8b5cf6',    // Violet
  slate:  '#64748b'     // Slate
};

export const DoctorMetrics: React.FC<DoctorMetricsProps> = ({ metrics }) => {
  // 1. Preparación de Datos
  const totalPatients = metrics.total_patients_treated || 0;
  const criticalCases = metrics.critical_cases || 0;
  const myReviews = metrics.my_reviews || 0;

  // Datos para Gráfico de Barras (Eficiencia)
  const efficiencyData = [
    {
      name: 'Revisiones',
      Completado: metrics.reviews_completed || 0,
      Pendiente: metrics.reviews_pending || 0,
    },
    {
      name: 'Reportes',
      Completado: metrics.reports_generated || 0,
      Pendiente: metrics.reports_pending || 0,
    },
    {
      name: 'Órdenes',
      Completado: (metrics.orders_requested || 0) - (metrics.orders_pending || 0),
      Pendiente: metrics.orders_pending || 0,
    },
  ];

  // Datos para Gráfico Circular (Distribución de Carga)
  const workloadData = [
    { name: 'Revisiones', value: (metrics.reviews_completed || 0) + (metrics.reviews_pending || 0) },
    { name: 'Reportes', value: (metrics.reports_generated || 0) + (metrics.reports_pending || 0) },
    { name: 'Órdenes', value: metrics.orders_requested || 0 },
  ].filter(item => item.value > 0); // Solo mostrar si hay datos

  const PIE_COLORS = [COLORS.purple, COLORS.primary, COLORS.warning];

  // Datos para Radial (Neumonía)
  const pneumoniaTotal = metrics.pneumonia_cases_active || 0;
  const pneumoniaMine = metrics.pneumonia_cases_my_review || 0;
  
  const radialData = [
    {
      name: 'Total Activos',
      uv: pneumoniaTotal,
      fill: '#e2e8f0', // Fondo gris
    },
    {
      name: 'Mis Casos',
      uv: pneumoniaMine,
      fill: COLORS.danger, // Rojo para alerta
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* --- FILA 1: KPIs Principales (Tarjetas Minimalistas) --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          title="Pacientes Tratados" 
          value={totalPatients} 
          icon={<Users className="h-5 w-5 text-blue-600" />}
          bg="bg-blue-50"
        />
        <KpiCard 
          title="Casos Críticos" 
          value={criticalCases} 
          icon={<AlertOctagon className="h-5 w-5 text-red-600" />}
          bg="bg-red-50"
          trend={criticalCases > 0 ? "Atención requerida" : "Estable"}
        />
        <KpiCard 
          title="Mis Revisiones" 
          value={myReviews} 
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          bg="bg-emerald-50"
        />
        <KpiCard 
          title="Eficacia Global" 
          value={`${calculateEfficiency(metrics)}%`} 
          icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
          bg="bg-violet-50"
          subtext="Tasa de completado"
        />
      </div>

      {/* --- FILA 2: Visualización de Datos (Gráficos Principales) --- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Gráfico 1: Comparativa de Eficiencia (Barras) - Ocupa 2 columnas */}
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Balance de Productividad</h3>
            <p className="text-sm text-slate-500">Comparativa entre tareas completadas y pendientes</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficiencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                <Bar 
                  dataKey="Completado" 
                  stackId="a" 
                  fill={COLORS.success} 
                  radius={[0, 0, 4, 4]} 
                />
                <Bar 
                  dataKey="Pendiente" 
                  stackId="a" 
                  fill={COLORS.warning} 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Distribución de Carga (Donut) */}
        <div className="col-span-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-900">Distribución de Tareas</h3>
            <p className="text-sm text-slate-500">Volumen de trabajo por tipo</p>
          </div>
          <div className="flex-1 min-h-[250px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={workloadData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {workloadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
            {/* Texto central del Donut */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="text-center mt-[-20px]">
                  <span className="block text-2xl font-bold text-slate-800">
                    {workloadData.reduce((acc, cur) => acc + cur.value, 0)}
                  </span>
                  <span className="text-xs text-slate-400 uppercase">Total</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- FILA 3: Métricas Específicas y Detalles --- */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        
        {/* Tarjeta Neumonía (Radial) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
           <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Control Neumonía</h3>
           <div className="h-[180px] w-full flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <RadialBarChart 
                  innerRadius="70%" 
                  outerRadius="100%" 
                  barSize={10} 
                  data={radialData} 
                  startAngle={180} 
                  endAngle={0}
               >
                 <RadialBar
                   background
                   dataKey="uv"
                   cornerRadius={10}
                 />
                 <text x="50%" y="70%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-slate-900">
                    {pneumoniaMine}
                 </text>
                 <text x="50%" y="85%" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-slate-500">
                    Mis Casos Activos
                 </text>
               </RadialBarChart>
             </ResponsiveContainer>
           </div>
           <div className="mt-2 flex justify-between text-sm px-4 py-2 bg-slate-50 rounded-lg">
              <span className="text-slate-500">Total Sistema:</span>
              <span className="font-bold text-slate-900">{pneumoniaTotal}</span>
           </div>
        </div>

        {/* Detalles Rápidos (Listas) */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
           <SummaryList 
              title="Pendientes de Revisión" 
              count={metrics.reviews_pending || 0}
              total={metrics.reviews_completed + metrics.reviews_pending || 0}
              color="text-amber-600"
              bgColor="bg-amber-100"
           />
           <SummaryList 
              title="Órdenes por Procesar" 
              count={metrics.orders_pending || 0}
              total={metrics.orders_requested || 0}
              color="text-blue-600"
              bgColor="bg-blue-100"
           />
           <SummaryList 
              title="Reportes Faltantes" 
              count={metrics.reports_pending || 0}
              total={(metrics.reports_generated + metrics.reports_pending) || 0}
              color="text-indigo-600"
              bgColor="bg-indigo-100"
           />
           <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-center items-center text-center">
              <p className="text-sm text-slate-500 mb-2">Reportes generados hoy</p>
              <p className="text-4xl font-bold text-slate-900">{metrics.reports_today || 0}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Productividad diaria
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Subcomponentes y Utilitarios ---

// Helper para calcular % de eficacia simple
const calculateEfficiency = (m: GroupSpecificMetrics) => {
  const totalTasks = (m.reviews_completed || 0) + (m.reviews_pending || 0) + 
                     (m.reports_generated || 0) + (m.reports_pending || 0);
  if (totalTasks === 0) return 0;
  const completed = (m.reviews_completed || 0) + (m.reports_generated || 0);
  return Math.round((completed / totalTasks) * 100);
};

// Tooltip personalizado para Recharts (Estilo "Glassmorphism" light)
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-sm">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500">{entry.name}:</span>
            <span className="font-medium text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Tarjeta KPI Simple
const KpiCard = ({ title, value, icon, bg, trend, subtext }: any) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
      {(trend || subtext) && (
        <p className={`text-xs mt-2 ${trend ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
          {trend || subtext}
        </p>
      )}
    </div>
    <div className={`p-3 rounded-lg ${bg}`}>
      {icon}
    </div>
  </div>
);

// Listado Resumen
const SummaryList = ({ title, count, total, color, bgColor }: any) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-between shadow-sm">
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className={`text-2xl font-bold ${color}`}>{count}</span>
        <span className="text-sm text-slate-400">/ {total} total</span>
      </div>
    </div>
    <div className={`h-2 w-2 rounded-full ${bgColor.replace('bg-', 'bg-opacity-50 ')} animate-pulse`}></div>
  </div>
);