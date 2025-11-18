# Gestión de Grupos - Módulos y Permisos

## Descripción

Este módulo permite administrar la asignación de módulos y permisos a los grupos de usuarios en el sistema. Es una interfaz visual completa para gestionar `GroupModulePermission`.

## Características

### 1. **Selección de Grupos**
- Sidebar con lista de todos los grupos disponibles
- Visualización del número de usuarios por grupo
- Selección rápida de grupo activo

### 2. **Asignación de Módulos**
- Asignar un módulo a un grupo
- Seleccionar múltiples permisos de una sola vez
- Solo muestra módulos activos y no asignados previamente
- Búsqueda de permisos por nombre o código
- Botones para seleccionar/deseleccionar todos los permisos

### 3. **Visualización de Permisos**
- Tabla con todos los módulos asignados al grupo
- Agrupación por Menú > Módulo
- Vista expandible para ver todos los permisos en detalle
- Contador de permisos por módulo

### 4. **Edición de Permisos**
- Modificar permisos de un módulo ya asignado
- Agregar o quitar permisos sin eliminar la asignación completa
- Interfaz idéntica a la de creación para mantener consistencia

### 5. **Eliminación**
- Eliminar completamente la asignación de un módulo al grupo
- Confirmación antes de eliminar

## Componentes

### `page.tsx` (Componente Principal)
- Gestiona el estado de la aplicación
- Carga y actualiza datos
- Coordina los modales y la tabla

### `GroupModulePermissionModal.tsx`
Modal para crear nuevas asignaciones de módulo-permisos:
- Selección de módulo (excluye ya asignados)
- Selección múltiple de permisos
- Búsqueda de permisos
- Botones de selección masiva

### `GroupModulePermissionsTable.tsx`
Tabla de visualización:
- Lista de módulos asignados
- Vista expandible de permisos
- Iconos de menús y módulos
- Acciones de editar y eliminar

### `EditPermissionsModal.tsx`
Modal para editar permisos existentes:
- Similar al modal de creación
- Pre-selecciona permisos actuales
- Solo permite modificar permisos, no el módulo

## Flujo de Uso

### Asignar Nuevo Módulo

1. Seleccionar un grupo del sidebar
2. Hacer clic en "Asignar Módulo"
3. Seleccionar el módulo del dropdown
4. Buscar y seleccionar permisos deseados
5. Hacer clic en "Guardar"

### Editar Permisos

1. Hacer clic en el icono de editar (✏️) en la tabla
2. Modificar la selección de permisos
3. Hacer clic en "Actualizar"

### Ver Permisos en Detalle

1. Hacer clic en el botón "X permisos ▶" en la tabla
2. Se expande la fila mostrando todos los permisos asignados

### Eliminar Módulo del Grupo

1. Hacer clic en el icono de eliminar (🗑️)
2. Confirmar la eliminación
3. El módulo y todos sus permisos se eliminan del grupo

## Integración con Backend

### Endpoints Utilizados

```typescript
// Obtener permisos de un grupo
GET /api/security/group-module-permissions/by_group/?group_id={id}

// Crear asignación
POST /api/security/group-module-permissions/
Body: {
  group_id: number,
  module_id: number,
  permissions: number[]
}

// Actualizar permisos
PATCH /api/security/group-module-permissions/{id}/
Body: {
  permissions: number[]
}

// Eliminar asignación
DELETE /api/security/group-module-permissions/{id}/
```

## Tipos de Datos

### GroupModulePermission
```typescript
interface GroupModulePermission {
  id: number;
  group: number;
  module: number;
  permissions: number[];
  permissions_data?: {
    id: number;
    name: string;
    codename: string;
  }[];
  module_data?: {
    id: number;
    name: string;
    url: string;
    icon: string;
    menu: {
      id: number;
      name: string;
      icon: string;
    };
  };
}
```

## Servicios Utilizados

- `groupService`: Obtener grupos
- `moduleService`: Obtener módulos disponibles
- `permissionService`: Obtener permisos del sistema
- `groupModulePermissionService`: CRUD de asignaciones

## Características Técnicas

### Estado Local
- `groups`: Lista de grupos
- `selectedGroup`: Grupo seleccionado actualmente
- `groupPermissions`: Permisos del grupo seleccionado
- `loading`: Estado de carga inicial
- `loadingPermissions`: Estado de carga de permisos
- `showAddModal`: Control del modal de creación
- `showEditModal`: Control del modal de edición
- `editingPermission`: Permiso en edición

### Optimizaciones
- Carga paralela de datos (módulos y permisos)
- Filtrado de módulos ya asignados
- Búsqueda en tiempo real de permisos
- Actualización automática después de cada operación

### UX/UI
- Loading spinners para mejor feedback
- Mensajes de confirmación para acciones destructivas
- Alertas de error claras
- Diseño responsivo con Tailwind CSS
- Iconos para mejor identificación visual

## Mejoras Futuras

1. **Búsqueda Avanzada**: Filtrar módulos por menú
2. **Asignación Masiva**: Asignar múltiples módulos a la vez
3. **Copiar Permisos**: Copiar configuración de un grupo a otro
4. **Exportar/Importar**: Backup de configuraciones
5. **Historial**: Ver cambios realizados en permisos
6. **Presets**: Plantillas de permisos comunes

## Troubleshooting

### Los módulos no se cargan
- Verificar que existan módulos activos en el sistema
- Revisar permisos del usuario para acceder a módulos

### No aparecen permisos
- Asegurarse de que Django tenga permisos registrados
- Ejecutar `python manage.py migrate` si es necesario

### Error al guardar
- Verificar que el backend esté corriendo
- Revisar la consola del navegador para errores específicos
- Validar que el usuario tenga permisos de `CanManageGroups`
