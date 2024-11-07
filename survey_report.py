import pandas as pd
import json
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import pprint

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

# Obtener las variables desde el entorno
mongo_uri = os.getenv('MONGO_URI')
db_name = os.getenv('MONGO_DB_NAME')
collection_name = os.getenv('MONGO_COLLECTION_NAME')

# Configuración de la conexión a MongoDB Atlas
client = MongoClient(mongo_uri)
db = client[db_name]
collection = db[collection_name]

# Cargar el archivo JSON desde una ruta relativa
with open('static/questions.json', 'r', encoding='utf-8') as f:
    questions_data = json.load(f).get("questions", [])

# Mapeo de valores para categorías, subcategorías, clases, preguntas de seguimiento y respuestas de seguimiento
category_map = {
    "Exactitud": 1,
    "Ambigüedad": 2,
    "Error": 3,
    "Preferencias de Visualización": 4,
    "Pregunta Descriptiva": 5
}

sub_category_map = {
    "Reglas": 1,
    "Grado Global": 2,
    "Grado Local": 3
}

class_map = {
    "Aprobado": 1,
    "Reprobado": 0
}

follow_up_question_map = {
    None: 0,
    "¿Qué tan seguro(a) estás de tu respuesta?": 1
}

follow_up_answer_map = {
    None: 0,
    "Nada": 1,
    "Poco": 2,
    "Mucho": 3
}

# Mapeo para normalizar los valores de user_answer
user_answer_map = {
    "Reprobado": 0,
    "Aprobado": 1,
    "No estoy seguro": 2,
    "Correcto": 3,
    "Incorrecto": 4,
    "Árbol de decisión (InterpretML)": 6,
    "Conjuntos de Decisiones interpretables (IDS)": 7
}

# Obtener todos los user_id únicos y asignar un número secuencial a cada uno
user_ids = collection.distinct("user_id")
user_id_map = {user_id: idx + 1 for idx, user_id in enumerate(user_ids)}

# Crear la estructura de datos para el glosario
glossary_data = []

# Añadir los valores de user_id al glosario
for user_id, normalized_id in user_id_map.items():
    glossary_data.append({"column": "user_id", "normalized_value": normalized_id, "original_value": user_id})

# Asignar un número secuencial a cada pregunta en el cuestionario y añadir al glosario
for question in questions_data:
    glossary_data.append({"column": "question", "normalized_value": question["id"], "original_value": question["instructions"]})

# Añadir los valores de category al glosario
for category_text, normalized_value in category_map.items():
    glossary_data.append({"column": "category", "normalized_value": normalized_value, "original_value": category_text})

# Añadir los valores de sub_category al glosario
for sub_category_text, normalized_value in sub_category_map.items():
    glossary_data.append({"column": "sub_category", "normalized_value": normalized_value, "original_value": sub_category_text})

# Añadir los valores de clases al glosario
for class_text, normalized_value in class_map.items():
    glossary_data.append({"column": "class", "normalized_value": normalized_value, "original_value": class_text})

# Añadir los valores de follow_up_question al glosario
for question_text, normalized_value in follow_up_question_map.items():
    glossary_data.append({"column": "follow_up_question", "normalized_value": normalized_value, "original_value": question_text})

# Añadir los valores de follow_up_answer al glosario
for answer_text, normalized_value in follow_up_answer_map.items():
    glossary_data.append({"column": "follow_up_answer", "normalized_value": normalized_value, "original_value": answer_text})

# Añadir los valores de user_answer al glosario
for answer_text, normalized_value in user_answer_map.items():
    glossary_data.append({"column": "user_answer", "normalized_value": normalized_value, "original_value": answer_text})

# Crear un archivo Excel con múltiples hojas
with pd.ExcelWriter("all_users_survey_report.xlsx") as writer:
    # Añadir la hoja del glosario con el formato solicitado
    glossary_df = pd.DataFrame(glossary_data)
    glossary_df.to_excel(writer, sheet_name="Glossary", index=False)

    # Iterar sobre cada user_id para crear su reporte en una hoja individual
    for user_id, user_num in user_id_map.items():
        rows = []
        
        # Filtrar las respuestas correspondientes al user_id actual
        user_responses = list(collection.find({"user_id": user_id}))

        # Recorrer cada pregunta en el JSON y asignar las respuestas del usuario
        for idx, question in enumerate(questions_data[:21]):  # Limitar a 21 preguntas
            # Extraer datos de la pregunta y normalizar usando los mapeos
            question_id = question.get("id")
            category = question.get("category")
            normalized_category = category_map.get(category)
            sub_category = question.get("sub_category")
            normalized_sub_category = sub_category_map.get(sub_category)
            
            # Extraer observaciones
            observation = question.get("observation", {})
            absences = observation.get("absences")
            goout = observation.get("goout")
            studytime = observation.get("studytime")
            reason_reputation = observation.get("reason_reputation")
            failures = observation.get("failures")
            Fedu = observation.get("Fedu")
            
            # Obtener predicciones de los modelos y normalizarlas
            prediction_model = question.get("prediction_model", {})
            prediction_model_ids = class_map.get(prediction_model.get("IDS"))
            prediction_model_dt = class_map.get(prediction_model.get("DT-InterpretML"))
            
            # Normalizar la clase real
            real_prediction = class_map.get(question.get("real_class"))

            # Asociar datos de respuesta del usuario para la pregunta correspondiente
            response = user_responses[idx] if idx < len(user_responses) else {}
            user_answer_text = response.get('answer')
            
            # Normalizar `user_answer`, asignando 8 a las respuestas a la pregunta 21
            if question_id == 21:
                user_answer = 8
                # Agregar la respuesta de la pregunta 21 al glosario
                glossary_data.append({
                    "column": f"user_id_{user_num}",
                    "normalized_value": 8,
                    "original_value": user_answer_text or ""
                })
            else:
                user_answer = user_answer_map.get(user_answer_text, user_answer_text)
            
            follow_up_answer = follow_up_answer_map.get(response.get('follow_up_answer'))
            
            # Convertir tiempo de milisegundos a segundos si está presente
            response_time_millis = response.get('response_time_seconds')
            response_time_seconds = response_time_millis / 1000 if response_time_millis else None
            
            # Pregunta de seguimiento normalizada
            follow_up_question = follow_up_question_map.get(question.get("follow_up", {}).get("question"))

            # Crear un diccionario con los datos de la fila
            row = {
                'user_id': user_num,  # Utilizar el número secuencial en lugar del user_id
                'question': question_id,  # Usar el ID de la pregunta
                'category': normalized_category,  # Usar el valor normalizado de la categoría
                'sub_category': normalized_sub_category,  # Usar el valor normalizado de la subcategoría
                'absences': absences,
                'goout': goout,
                'studytime': studytime,
                'reason_reputation': reason_reputation,
                'failures': failures,
                'Fedu': Fedu,
                'real_prediction': real_prediction,  # Usar el valor normalizado de la clase real
                'prediction_model_ids': prediction_model_ids,  # Usar el valor normalizado de la predicción IDS
                'prediction_model_dt': prediction_model_dt,  # Usar el valor normalizado de la predicción DT
                'user_answer': user_answer,  # Usar la respuesta normalizada del usuario
                'follow_up_question': follow_up_question,  # Usar el valor normalizado de la pregunta de seguimiento
                'follow_up_answer': follow_up_answer,  # Usar el valor normalizado de la respuesta de seguimiento
                'response_time_seconds': response_time_seconds  # Tiempo de respuesta en segundos
            }
            
            # Agregar la fila a la lista de filas del usuario actual
            rows.append(row)

        # Crear un DataFrame con las filas del usuario actual
        df = pd.DataFrame(rows)

        # Escribir el DataFrame en una hoja del archivo Excel con el nombre "User_<número secuencial>"
        sheet_name = f"User_{user_num}"
        df.to_excel(writer, sheet_name=sheet_name, index=False)
        
    # Actualizar el glosario con las respuestas de la pregunta 21 de cada usuario
    glossary_df = pd.DataFrame(glossary_data)
    glossary_df.to_excel(writer, sheet_name="Glossary", index=False)
        
print("Archivo 'all_users_survey_report.xlsx' creado exitosamente con cada usuario en una hoja separada y un glosario de mapeos.")
