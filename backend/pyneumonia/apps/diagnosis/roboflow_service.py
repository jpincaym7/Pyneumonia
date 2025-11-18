from inference_sdk import InferenceHTTPClient
import time
from django.conf import settings
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class RoboflowService:
    """Servicio para integración con Roboflow API"""
    
    def __init__(self):
        self.api_key = getattr(settings, 'ROBOFLOW_API_KEY', None)
        self.api_url = getattr(settings, 'ROBOFLOW_API_URL', 'https://detect.roboflow.com')
        self.model_id = getattr(settings, 'ROBOFLOW_MODEL_ID', None)
        
        if not all([self.api_key, self.model_id]):
            logger.warning("Roboflow credentials not fully configured in settings. Set ROBOFLOW_API_KEY and ROBOFLOW_MODEL_ID in .env")
        else:
            # Inicializar el cliente de Roboflow
            self.client = InferenceHTTPClient(
                api_url=self.api_url,
                api_key=self.api_key
            )
    
    def analyze_image(self, image_path: str) -> Optional[Dict]:
        """
        Envía una imagen a Roboflow para análisis
        
        Args:
            image_path: Ruta al archivo de imagen
            
        Returns:
            Dict con la respuesta de Roboflow o None si hay error
        """
        if not all([self.api_key, self.model_id]):
            raise ValueError("Roboflow API not configured. Set ROBOFLOW_API_KEY and ROBOFLOW_MODEL_ID in .env file")
        
        try:
            start_time = time.time()
            
            logger.info(f"Sending image to Roboflow: {image_path}")
            logger.debug(f"Model ID: {self.model_id}")
            
            # Usar el SDK de Roboflow para inferencia
            # El SDK acepta la ruta del archivo directamente
            result = self.client.infer(
                inference_input=image_path,
                model_id=self.model_id
            )
            
            processing_time = time.time() - start_time
            
            logger.info(f"Roboflow analysis successful. Time: {processing_time:.2f}s")
            logger.debug(f"Response: {result}")
            
            # Agregar tiempo de procesamiento
            if isinstance(result, dict):
                result['processing_time'] = processing_time
            
            return result
                
        except FileNotFoundError:
            logger.error(f"Image file not found: {image_path}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in Roboflow analysis: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None
    
    def parse_prediction(self, roboflow_response: Dict) -> Optional[Dict]:
        """
        Parsea la respuesta de Roboflow al formato esperado
        
        Args:
            roboflow_response: Respuesta completa de Roboflow
            
        Returns:
            Dict con la predicción parseada o None si no hay predicciones
        """
        try:
            predictions = roboflow_response.get('predictions', [])
            
            if not predictions:
                logger.warning("No predictions found in Roboflow response")
                return None
            
            # Tomar la predicción con mayor confianza
            best_prediction = max(predictions, key=lambda x: x.get('confidence', 0))
            
            return {
                'predicted_class': best_prediction.get('class'),
                'class_id': best_prediction.get('class_id'),
                'confidence': best_prediction.get('confidence'),
                'processing_time': roboflow_response.get('processing_time'),
                'raw_response': roboflow_response
            }
            
        except Exception as e:
            logger.error(f"Error parsing Roboflow prediction: {str(e)}")
            return None
    
    def validate_prediction_class(self, predicted_class: str) -> bool:
        """
        Valida que la clase predicha sea una de las esperadas
        
        Args:
            predicted_class: Clase predicha por Roboflow
            
        Returns:
            True si es válida, False en caso contrario
        """
        valid_classes = ['NORMAL', 'PNEUMONIA_BACTERIA', 'PNEUMONIA_BACTERIAL', 'PNEUMONIA_VIRAL']
        return predicted_class in valid_classes
    
    def get_diagnosis_interpretation(self, predicted_class: str, confidence: float) -> Dict:
        """
        Genera una interpretación del diagnóstico
        
        Args:
            predicted_class: Clase predicha
            confidence: Nivel de confianza
            
        Returns:
            Dict con interpretación y recomendaciones
        """
        interpretations = {
            'NORMAL': {
                'description': 'No se detectan signos de neumonía',
                'severity': None,
                'recommendation': 'Radiografía normal. No se requiere tratamiento para neumonía.'
            },
            'PNEUMONIA_BACTERIA': {
                'description': 'Se detectan signos compatibles con neumonía bacteriana',
                'severity': 'moderate',
                'recommendation': 'Se recomienda evaluación médica urgente y posible tratamiento antibiótico.'
            },
            'PNEUMONIA_BACTERIAL': {
                'description': 'Se detectan signos compatibles con neumonía bacterial',
                'severity': 'moderate',
                'recommendation': 'Se recomienda evaluación médica urgente y posible tratamiento antibiótico.'
            },
            'PNEUMONIA_VIRAL': {
                'description': 'Se detectan signos compatibles con neumonía viral',
                'severity': 'moderate',
                'recommendation': 'Se recomienda evaluación médica. El tratamiento depende de la severidad.'
            }
        }
        
        interpretation = interpretations.get(predicted_class, {
            'description': 'Diagnóstico desconocido',
            'severity': None,
            'recommendation': 'Requiere evaluación médica.'
        })
        
        # Ajustar severidad según confianza
        if interpretation['severity'] and confidence >= 0.85:
            interpretation['severity'] = 'severe'
        elif interpretation['severity'] and confidence <= 0.6:
            interpretation['severity'] = 'mild'
        
        # Agregar nivel de confianza a la descripción
        interpretation['confidence_level'] = 'Alta' if confidence >= 0.75 else 'Media' if confidence >= 0.5 else 'Baja'
        
        return interpretation


# Instancia global del servicio
roboflow_service = RoboflowService()
