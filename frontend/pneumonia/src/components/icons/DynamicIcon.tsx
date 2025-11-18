/**
 * Componente para renderizar iconos dinámicamente
 * Basado en los nombres de iconos de React Icons que vienen del backend
 */

import React from 'react';
import * as MdIcons from 'react-icons/md';
import * as FaIcons from 'react-icons/fa';
import * as HiIcons from 'react-icons/hi';
import { IconBaseProps } from 'react-icons';

interface DynamicIconProps extends IconBaseProps {
  name?: string;
  fallback?: React.ComponentType<IconBaseProps>;
}

const iconLibraries: Record<string, Record<string, React.ComponentType<IconBaseProps>>> = {
  Md: MdIcons as Record<string, React.ComponentType<IconBaseProps>>,
  Fa: FaIcons as Record<string, React.ComponentType<IconBaseProps>>,
  Hi: HiIcons as Record<string, React.ComponentType<IconBaseProps>>,
};

export function DynamicIcon({ 
  name, 
  fallback: FallbackIcon,
  ...props 
}: DynamicIconProps) {
  // Si no hay nombre de ícono, usar fallback o ícono por defecto
  if (!name || typeof name !== 'string') {
    const DefaultIcon = FallbackIcon || MdIcons.MdHelpOutline;
    return <DefaultIcon {...props} />;
  }

  // Obtener prefijo (Md, Fa, Hi)
  const prefix = name.substring(0, 2);
  const library = iconLibraries[prefix];

  if (!library) {
    // Si no hay biblioteca, usar fallback o ícono por defecto
    const DefaultIcon = FallbackIcon || MdIcons.MdHelpOutline;
    return <DefaultIcon {...props} />;
  }

  const IconComponent = library[name];

  if (!IconComponent) {
    // Si no existe el ícono, usar fallback o ícono por defecto
    const DefaultIcon = FallbackIcon || MdIcons.MdHelpOutline;
    return <DefaultIcon {...props} />;
  }

  return <IconComponent {...props} />;
}

// Exportar algunos íconos comunes para uso directo
export {
  MdIcons,
  FaIcons,
  HiIcons,
};
