# Test API - Group Module Permissions

## Verificar Respuesta del Backend

### 1. Probar endpoint de grupos
```bash
curl -H "Cookie: sessionid=YOUR_SESSION_ID" http://localhost:8000/api/security/groups/
```

### 2. Probar endpoint de permisos por grupo
```bash
curl -H "Cookie: sessionid=YOUR_SESSION_ID" http://localhost:8000/api/security/group-module-permissions/by_group/?group_id=1
```

### Respuesta Esperada:
```json
[
  {
    "id": 1,
    "group": {
      "id": 1,
      "name": "Administradores",
      "permissions": [1, 2, 3],
      "permissions_data": [...],
      "user_count": 5
    },
    "module": {
      "id": 1,
      "url": "/dashboard/users",
      "name": "Usuarios",
      "menu": {
        "id": 1,
        "name": "Seguridad",
        "icon": "MdSecurity"
      },
      "description": "Gestión de usuarios",
      "icon": "MdPeople",
      "is_active": true,
      "permissions": [1, 2, 3, 4],
      "permissions_data": [...]
    },
    "permissions": [1, 2, 3],
    "permissions_data": [
      {
        "id": 1,
        "name": "Can add user",
        "codename": "add_user"
      },
      ...
    ]
  }
]
```

## Verificar en el navegador

Abre las DevTools del navegador (F12) y ve a la pestaña Network.

Filtra por XHR/Fetch y busca las llamadas a:
- `/api/security/groups/`
- `/api/security/group-module-permissions/by_group/`

Verifica la estructura de la respuesta JSON.

## Problemas Comunes

### Si no aparece data:

1. **Verificar que hay datos en el backend**
   ```python
   python manage.py shell
   >>> from apps.security.models import GroupModulePermission
   >>> GroupModulePermission.objects.all()
   >>> GroupModulePermission.objects.filter(group_id=1).values()
   ```

2. **Verificar serializer**
   El serializer debe incluir los campos anidados:
   - `group` (objeto completo)
   - `module` (objeto completo con menu)
   - `permissions_data` (lista de permisos)

3. **Verificar CORS y autenticación**
   - Asegúrate de estar autenticado
   - Verifica que las cookies se envíen correctamente

4. **Verificar el endpoint**
   - URL correcta: `/api/security/group-module-permissions/by_group/?group_id=X`
   - Método: GET
   - Headers: Cookie con sessionid
