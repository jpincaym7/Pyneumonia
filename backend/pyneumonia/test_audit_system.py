"""
Script de prueba para verificar el sistema de auditoría automática
Ejecutar con: python manage.py shell < test_audit_system.py
"""
from django.contrib.auth import get_user_model
from apps.diagnosis.models import Patient
from apps.security.models import AuditUser, Group, Menu, Module
from datetime import date

User = get_user_model()

print("\n" + "="*70)
print("SISTEMA DE AUDITORÍA AUTOMÁTICA - PRUEBA")
print("="*70)

# Limpiar auditorías previas de prueba
print("\n1. Limpiando auditorías anteriores...")
AuditUser.objects.filter(tabla__in=['Patient', 'Menu', 'Module', 'Group']).delete()
print("   ✓ Auditorías limpiadas")

# Obtener o crear usuario de prueba
print("\n2. Obteniendo usuario de prueba...")
test_user = User.objects.filter(is_superuser=True).first()
if test_user:
    print(f"   ✓ Usuario encontrado: {test_user.username}")
else:
    print("   ✗ No se encontró ningún superusuario")
    print("   Por favor, crea un usuario primero")
    exit(1)

print("\n3. Probando auditoría de CREACIÓN...")
# Crear paciente de prueba
patient = Patient.objects.create(
    first_name="Juan",
    last_name="Pérez",
    dni="1234567890",
    birth_date=date(1990, 1, 1),
    gender="M",
    phone="0999999999",
    email="juan.perez@test.com"
)
print(f"   ✓ Paciente creado: {patient.first_name} {patient.last_name} (ID: {patient.id})")

# Verificar auditoría
audit_create = AuditUser.objects.filter(tabla='Patient', registroid=patient.id, accion='A').first()
if audit_create:
    print(f"   ✓ Auditoría de CREACIÓN registrada:")
    print(f"     - Usuario: {audit_create.usuario.username}")
    print(f"     - Acción: {audit_create.get_accion_display()}")
    print(f"     - Fecha: {audit_create.fecha}")
    print(f"     - Hora: {audit_create.hora}")
    print(f"     - Estación: {audit_create.estacion}")
else:
    print("   ✗ NO se registró la auditoría de creación")

print("\n4. Probando auditoría de MODIFICACIÓN...")
# Modificar paciente
patient.phone = "0988888888"
patient.save()
print(f"   ✓ Paciente modificado: nuevo teléfono {patient.phone}")

# Verificar auditoría
audit_modify = AuditUser.objects.filter(tabla='Patient', registroid=patient.id, accion='M').first()
if audit_modify:
    print(f"   ✓ Auditoría de MODIFICACIÓN registrada:")
    print(f"     - Usuario: {audit_modify.usuario.username}")
    print(f"     - Acción: {audit_modify.get_accion_display()}")
    print(f"     - Fecha: {audit_modify.fecha}")
else:
    print("   ✗ NO se registró la auditoría de modificación")

print("\n5. Probando auditoría de ELIMINACIÓN...")
patient_id = patient.id
patient.delete()
print(f"   ✓ Paciente eliminado (ID: {patient_id})")

# Verificar auditoría
audit_delete = AuditUser.objects.filter(tabla='Patient', registroid=patient_id, accion='E').first()
if audit_delete:
    print(f"   ✓ Auditoría de ELIMINACIÓN registrada:")
    print(f"     - Usuario: {audit_delete.usuario.username}")
    print(f"     - Acción: {audit_delete.get_accion_display()}")
    print(f"     - Fecha: {audit_delete.fecha}")
else:
    print("   ✗ NO se registró la auditoría de eliminación")

print("\n6. Resumen de auditorías registradas:")
total_audits = AuditUser.objects.filter(tabla='Patient', registroid=patient_id).count()
print(f"   Total de registros de auditoría: {total_audits}")
print(f"   Deberían ser 3 (Creación, Modificación, Eliminación)")

if total_audits == 3:
    print("\n" + "="*70)
    print("✓ SISTEMA DE AUDITORÍA FUNCIONANDO CORRECTAMENTE")
    print("="*70)
else:
    print("\n" + "="*70)
    print("✗ SISTEMA DE AUDITORÍA CON PROBLEMAS")
    print(f"   Se esperaban 3 registros pero se encontraron {total_audits}")
    print("="*70)

print("\n7. Listado de todas las auditorías de Patient:")
for audit in AuditUser.objects.filter(tabla='Patient').order_by('fecha', 'hora'):
    print(f"   - {audit.get_accion_display()}: ID {audit.registroid} por {audit.usuario.username} el {audit.fecha} a las {audit.hora}")

print("\n")
