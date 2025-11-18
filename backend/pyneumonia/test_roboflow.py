"""
Script de prueba para verificar la integración con Roboflow
Uso: python test_roboflow.py
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pyneumonia.settings')
django.setup()

from apps.diagnosis.roboflow_service import roboflow_service
from django.conf import settings


def test_configuration():
    """Verifica que la configuración esté completa"""
    print("=" * 60)
    print("🔧 VERIFICANDO CONFIGURACIÓN")
    print("=" * 60)
    
    api_key = roboflow_service.api_key
    api_url = roboflow_service.api_url
    model_id = roboflow_service.model_id
    
    print(f"\n✓ API URL: {api_url}")
    print(f"✓ Model ID: {model_id if model_id else '❌ NO CONFIGURADO'}")
    print(f"✓ API Key: {'✓ Configurado' if api_key else '❌ NO CONFIGURADO'}")
    
    if not api_key or not model_id:
        print("\n❌ ERROR: Configuración incompleta")
        print("\nAgrega las siguientes variables al archivo .env:")
        print("  ROBOFLOW_API_KEY=tu_api_key")
        print("  ROBOFLOW_MODEL_ID=tu_modelo/version")
        print("\nEjemplo:")
        print("  ROBOFLOW_API_KEY=0r4klCQmalPo9Xw2xkj6")
        print("  ROBOFLOW_MODEL_ID=pneumonia-3pr8g/3")
        return False
    
    print("\n✅ Configuración completa!")
    return True


def test_validation():
    """Verifica las funciones de validación"""
    print("\n" + "=" * 60)
    print("✅ VERIFICANDO VALIDACIONES")
    print("=" * 60)
    
    # Test clases válidas
    valid_classes = ['NORMAL', 'PNEUMONIA_BACTERIAL', 'PNEUMONIA_VIRAL']
    print("\nClases válidas:")
    for cls in valid_classes:
        result = roboflow_service.validate_prediction_class(cls)
        print(f"  {cls}: {'✓' if result else '✗'}")
    
    # Test clase inválida
    invalid_class = 'UNKNOWN'
    result = roboflow_service.validate_prediction_class(invalid_class)
    print(f"\nClase inválida {invalid_class}: {'✗ (esperado)' if not result else '✓ Error!'}")


def test_interpretation():
    """Verifica las interpretaciones"""
    print("\n" + "=" * 60)
    print("📊 VERIFICANDO INTERPRETACIONES")
    print("=" * 60)
    
    test_cases = [
        ('NORMAL', 0.95),
        ('PNEUMONIA_BACTERIAL', 0.85),
        ('PNEUMONIA_VIRAL', 0.60),
    ]
    
    for predicted_class, confidence in test_cases:
        print(f"\n{predicted_class} (confianza: {confidence * 100}%)")
        interpretation = roboflow_service.get_diagnosis_interpretation(
            predicted_class, 
            confidence
        )
        print(f"  Descripción: {interpretation['description']}")
        print(f"  Severidad: {interpretation.get('severity', 'N/A')}")
        print(f"  Nivel de confianza: {interpretation['confidence_level']}")
        print(f"  Recomendación: {interpretation['recommendation'][:60]}...")


def test_parse_prediction():
    """Verifica el parseo de respuestas"""
    print("\n" + "=" * 60)
    print("🔍 VERIFICANDO PARSEO DE RESPUESTAS")
    print("=" * 60)
    
    # Simular respuesta de Roboflow
    mock_response = {
        'predictions': [
            {
                'class': 'PNEUMONIA_BACTERIAL',
                'class_id': 1,
                'confidence': 0.856,
            },
            {
                'class': 'NORMAL',
                'class_id': 0,
                'confidence': 0.144,
            }
        ],
        'processing_time': 2.5
    }
    
    print("\nRespuesta simulada de Roboflow:")
    print(f"  Predicciones: {len(mock_response['predictions'])}")
    
    result = roboflow_service.parse_prediction(mock_response)
    
    if result:
        print(f"\n✅ Parseo exitoso:")
        print(f"  Clase: {result['predicted_class']}")
        print(f"  Confianza: {result['confidence'] * 100:.1f}%")
        print(f"  Tiempo: {result.get('processing_time', 0):.2f}s")
    else:
        print("\n❌ Error en el parseo")


def test_real_analysis():
    """Intenta un análisis real (requiere imagen de prueba)"""
    print("\n" + "=" * 60)
    print("🔬 PRUEBA DE ANÁLISIS REAL")
    print("=" * 60)
    
    # Buscar una imagen de prueba
    media_root = settings.MEDIA_ROOT
    test_image = None
    
    # Buscar en media/xrays/
    xrays_dir = os.path.join(media_root, 'xrays')
    if os.path.exists(xrays_dir):
        for file in os.listdir(xrays_dir):
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                test_image = os.path.join(xrays_dir, file)
                break
    
    if not test_image:
        print("\n⚠️  No se encontró imagen de prueba en media/xrays/")
        print("Sube una radiografía primero para probar el análisis real")
        return
    
    print(f"\nUsando imagen: {os.path.basename(test_image)}")
    print("Enviando a Roboflow...")
    
    try:
        result = roboflow_service.analyze_image(test_image)
        
        if result:
            print("\n✅ Análisis exitoso!")
            print(f"  Tiempo de procesamiento: {result.get('processing_time', 0):.2f}s")
            
            if 'predictions' in result and result['predictions']:
                best = max(result['predictions'], key=lambda x: x.get('confidence', 0))
                print(f"  Predicción: {best.get('class', 'N/A')}")
                print(f"  Confianza: {best.get('confidence', 0) * 100:.1f}%")
            else:
                print("  ⚠️  No se encontraron predicciones")
        else:
            print("\n❌ El análisis falló")
            print("Verifica los logs para más detalles")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")


def main():
    """Ejecuta todas las pruebas"""
    print("\n" + "=" * 60)
    print("🧪 INICIANDO PRUEBAS DE INTEGRACIÓN CON ROBOFLOW")
    print("=" * 60)
    
    # Verificar configuración
    if not test_configuration():
        return
    
    # Validaciones
    test_validation()
    
    # Interpretaciones
    test_interpretation()
    
    # Parseo
    test_parse_prediction()
    
    # Análisis real (opcional)
    print("\n" + "=" * 60)
    choice = input("\n¿Quieres probar un análisis real? (S/n): ").strip().lower()
    if choice != 'n':
        test_real_analysis()
    
    print("\n" + "=" * 60)
    print("✅ PRUEBAS COMPLETADAS")
    print("=" * 60)


if __name__ == '__main__':
    main()
