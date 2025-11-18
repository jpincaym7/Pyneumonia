'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NoPermissionModalProps {
    isOpen: boolean;
    message: string;
    redirectTo?: string;
    autoRedirectSeconds?: number;
}

export default function NoPermissionModal({
    isOpen,
    message,
    redirectTo = '/dashboard',
    autoRedirectSeconds = 3
}: NoPermissionModalProps) {
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                router.push(redirectTo);
            }, autoRedirectSeconds * 1000);

            return () => clearTimeout(timer);
        }
    }, [isOpen, redirectTo, autoRedirectSeconds, router]);

    if (!isOpen) return null;

    const handleRedirect = () => {
        router.push(redirectTo);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Fondo difuminado */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" />
            
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
                {/* Header con degradado */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-8 text-center">
                    {/* Icono de advertencia */}
                    <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 animate-bounce">
                        <svg 
                            className="w-12 h-12 text-red-600" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                            />
                        </svg>
                    </div>
                    
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                        Acceso Denegado
                    </h2>
                </div>

                {/* Contenido */}
                <div className="px-6 py-8">
                    <div className="text-center mb-6">
                        <p className="text-gray-700 text-lg font-medium mb-2">
                            {message}
                        </p>
                        <p className="text-gray-500 text-sm">
                            Contacta al administrador del sistema para solicitar permisos.
                        </p>
                    </div>

                    {/* Contador de redirección */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
                        <div className="flex items-center justify-center gap-2 text-blue-700">
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm font-medium">
                                Redirigiendo al dashboard en {autoRedirectSeconds} segundos...
                            </span>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleRedirect}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Ir al Dashboard
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                        >
                            Volver Atrás
                        </button>
                    </div>
                </div>

                {/* Footer decorativo */}
                <div className="h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                
                .animate-scaleIn {
                    animation: scaleIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
