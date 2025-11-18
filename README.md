# Pyneumonia - Sistema de Diagnóstico y Seguridad

## 🚀 Descripción General
Pyneumonia es una plataforma integral para la gestión, análisis y diagnóstico de radiografías de tórax mediante IA, con un sistema avanzado de seguridad, permisos y auditoría. Incluye backend en Django + DRF y frontend en Next.js.

## 🏆 Características Principales
- Autenticación y autorización granular por grupos y módulos
- Gestión de pacientes, radiografías y diagnósticos automáticos con IA (Roboflow)
- Panel de administración visual y auditoría automática
- Estadísticas y métricas personalizadas por rol
- API RESTful completa y documentada
- Seguridad robusta: validaciones, CORS, CSRF, hashing, protección contra inyecciones
- Frontend moderno con Next.js y dashboards personalizados

## 🗂️ Estructura del Sistema
- **Backend:** Django 5, DRF, Roboflow, SQLite/PostgreSQL
- **Frontend:** Next.js, TypeScript, Bootstrap Icons
- **Grupos:** Administradores, Médicos, Radiólogos, Recepcionistas
- **Módulos:** Pacientes, Radiografías, Diagnósticos, Reportes, Seguridad

## 🔒 Seguridad
- Validaciones de datos (DNI, email, archivos, edad, etc.)
- Permisos por grupo y módulo
- Auditoría automática de acciones
- Protección OWASP Top 10

## 📊 Métricas y Estadísticas
- Dashboards personalizados por grupo
- Estadísticas de diagnósticos, pacientes, radiografías y rendimiento
- Filtros avanzados y visualizaciones sugeridas

## 🛠️ Instalación Rápida
```powershell
cd backend
.\install.ps1
```
O manual:
```powershell
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py init_security_data
python manage.py init_diagnosis_modules
python manage.py runserver
```

## ⚙️ Configuración
- Variables de entorno en `.env` (Roboflow, DB, CORS)
- Configura CORS y seguridad en `settings.py`

## 📡 Endpoints API
- `/api/security/auth/` - Autenticación
- `/api/security/users/` - Usuarios
- `/api/security/groups/` - Grupos
- `/api/security/menus/` - Menús
- `/api/security/modules/` - Módulos
- `/api/security/audit-logs/` - Auditoría
- `/api/diagnosis/patients/` - Pacientes
- `/api/diagnosis/xrays/` - Radiografías
- `/api/diagnosis/diagnoses/` - Diagnósticos
- `/api/diagnosis/reports/` - Reportes
- `/api/diagnosis/statistics/` - Estadísticas

## 🧑‍💻 Frontend
```bash
cd frontend/pneumonia
npm install
npm run dev
```
Accede a [http://localhost:3000](http://localhost:3000)

## 📝 Comandos Útiles
- `python manage.py check` - Verificar sistema
- `python manage.py shell` - Shell interactivo
- `python manage.py showmigrations` - Ver migraciones
- `python manage.py collectstatic` - Archivos estáticos

## 🧪 Testing
- Usuarios de prueba por grupo
- Pruebas automáticas de validaciones y endpoints

## 🛡️ Licencia
Este proyecto se distribuye bajo la licencia MIT. Ver archivo LICENSE para detalles.

## 📚 Documentación
- `DIAGNOSIS_API_DOCUMENTATION.md` - API de diagnóstico
- `PERMISSIONS_SYSTEM.md` - Sistema de permisos
- `STATISTICS_API_DOCUMENTATION.md` - Métricas y estadísticas
- `ROBOFLOW_INTEGRATION_GUIDE.md` - Integración Roboflow
- `AUDIT_SYSTEM_README.md` - Auditoría
- `COMANDOS_UTILES.md` - Comandos útiles

---

**¡Sistema listo para usar y escalar!**

## Contacto
Para soporte y dudas, contacta al equipo de desarrollo.
