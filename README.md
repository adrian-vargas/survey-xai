# Survey-XAI-App

Survey-XAI-App es una herramienta clave dentro del Trabajo de Fin de Máster (TFM) *"A Tool for Human Evaluation of Interpretability"*, desarrollado por Adrián Vargas Rangel en el Máster de Inteligencia Artificial de la Universidad Politécnica de Madrid (2024). Su propósito es analizar y comparar la interpretabilidad y precisión de modelos transparentes en aprendizaje automático, específicamente Árboles de Decisión (DT) e Interpretable Decision Sets (IDS).

## Contexto

La interpretabilidad en inteligencia artificial es fundamental, especialmente en áreas donde las decisiones automáticas tienen impactos significativos. Este TFM aborda estas cuestiones en un escenario educativo, utilizando modelos transparentes para analizar el rendimiento académico de estudiantes en matemáticas.

Survey-XAI-App integra una aplicación web que recopila datos a través de un cuestionario interactivo. Estos datos permiten combinar métricas técnicas (parsimonia, cobertura, simplicidad de reglas) con la percepción humana de interpretabilidad, proporcionando información sobre cómo los usuarios finales comprenden las decisiones de los modelos.

## Implementación de Modelos
La implementación de los modelos evaluados está documentada en el notebook Survey-XAI-Models.ipynb, ubicado en la carpeta notebook. Este archivo detalla el preprocesamiento, entrenamiento y generación de reglas, y sirve como referencia técnica para reproducir el estudio.

## Herramientas Desarrolladas

### 1. **Librería IDS Personalizada**
Una implementación adaptada de Interpretable Decision Sets (IDS) basada en el repositorio [pyIDS](https://github.com/jirifilip/pyIDS) y el estudio de Lakkaraju et al. (2016). La librería permite:
- Generación de reglas interpretables optimizadas.
- Preprocesamiento y balanceo de datos con SMOTE.
- Ajuste de parámetros como soporte, confianza y longitud máxima de reglas.
Disponible aquí: [IDS - Interpretable Decision Sets](https://github.com/adrian-vargas/IDS).

### 2. **Survey-XAI-App**
Aplicación web para evaluar interpretabilidad:
- Interactúa con reglas generadas por modelos DT-InterpretML e IDS.
- Mide tiempos de respuesta y evalúa comprensión de reglas.
- Genera reportes en Excel con gráficos detallados.

## Cuestionario Implementado

El cuestionario interactivo de la aplicación evalúa la interpretabilidad de los modelos utilizando 21 preguntas diseñadas cuidadosamente para abordar diversos aspectos. Estas preguntas están organizadas en las siguientes categorías:

1. **Exactitud**: Evalúa si los usuarios pueden identificar correctamente la predicción del modelo basándose en las reglas presentadas.  
   - Subcategorías:
     - **Reglas**: Predicciones basadas en reglas específicas del modelo.
     - **Grado Global**: Predicciones basadas en la estructura global del modelo.
     - **Grado Local**: Predicciones basadas en un grafo local generado por el modelo.

2. **Ambigüedad**: Explora cómo los usuarios perciben predicciones ambiguas y mide la confianza en sus respuestas.  
   - Subcategorías:
     - **Reglas**: Ambigüedad en reglas específicas.
     - **Grado Global y Local**: Ambigüedad en la estructura global y local.

3. **Errores**: Preguntas diseñadas para evaluar si los usuarios identifican correctamente errores en las predicciones del modelo.  
   - Subcategorías:
     - **Reglas**: Errores en reglas específicas.
     - **Grado Global y Local**: Errores en la estructura global y local.

4. **Preferencias de Visualización**: Preguntas abiertas donde los usuarios seleccionan qué visualización encuentran más útil para comprender el modelo y analizar errores.

5. **Pregunta Descriptiva**: Una pregunta final abierta que permite a los usuarios expresar su opinión sobre el uso de visualizaciones y reglas para acompañar las predicciones.

Como se ha mencionado, las categorías Exactitud, Ambigüedad y Error se dividen en tres subcategorías: Reglas, Grado Global y Grado Local. En cada subcategoría, se formula la misma pregunta, aplicándola una vez al modelo DT-InterpretML y otra al modelo IDS.

### Ejemplo de Configuración de Preguntas

Las preguntas se gestionan a través del archivo `questions.json`, que contiene información estructurada como la siguiente:

```json
{
    "id": 1,
    "category": "Exactitud",
    "sub_category": "Reglas",
    "instructions": "Selecciona la predicción de acuerdo con la observación",
    "model": "DT-InterpretML",
    "observation": {
        "absences": 0,
        "goout": 2,
        "studytime": 3,
        "reason_reputation": 1,
        "failures": 0,
        "Fedu": 3
    },
    "rules": [
        "si failures ≤ 0.50 y reason_reputation ≤ 0.50 y Fedu ≤ 1.50 entonces Reprobado",
        "si failures ≤ 0.50 y reason_reputation > 0.50 y absences ≤ 13.50 entonces Aprobado"
    ],
    "prediction_model": {
        "DT-InterpretML": "Aprobado",
        "IDS": "Aprobado"
    },
    "real_class": "Aprobado",
    "answer": null
}
```

Este archivo permite agregar o modificar preguntas sin necesidad de cambiar el código principal de la aplicación.

### Características Medidas

- **Confianza del usuario**: Preguntas de seguimiento para evaluar el nivel de certeza de los participantes.
- **Errores detectados**: Identificación de predicciones incorrectas por parte de los usuarios.
- **Preferencias de visualización**: Evaluación subjetiva sobre qué modelo facilita más el análisis y la comprensión.

## Dataset Utilizado

El conjunto de datos es el **Student Performance**, recopilado por Paulo Cortez y disponible en el [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/320/student+performance). Incluye características relevantes como:
- **Absences**: Número de ausencias escolares.
- **Studytime**: Tiempo dedicado al estudio semanal.
- **Failures**: Número de asignaturas reprobadas.
- **Fedu**: Nivel educativo del padre.
- **Reason_reputation**: Razón principal para elegir la escuela.
- **Goout**: Frecuencia con la que los estudiantes salen con amigos.

Estas variables sirvieron para construir modelos predictivos que clasifican a los estudiantes en categorías de Aprobado o Reprobado.

## Visualización y Resultados

### Interfaz Principal
La aplicación ofrece una interfaz intuitiva para usuarios y administradores:

![Interfaz del Cuestionario](static/app/interfaz_cuestionario.PNG)

![Panel de administración](static/app/admin_panel.PNG)

### Reportes Generados
Los reportes incluyen:
- Glosario del análisis.
- Análisis individual y general de las respuestas.

Ejemplo de glosario:
![Glosario](static/app/glosario.PNG)

Gráfico de tiempo promedio por pregunta:
![Tiempo Promedio por Pregunta](static/app/ejemplo_de_grafica_de_tiempo_de_respuesta_de_usuarios_por_pregunta.png)

Análisis de preferencias de modelos:
![Preferencia de Modelos](static/app/ejemplo_de_pregunta_20_preferencia_modelos.png)

## Instalación

1. **Clonar el Repositorio**
```bash
git clone https://github.com/adrian-vargas/survey-xai-app.git
cd survey-xai-app
```

2. **Configurar Entorno Virtual**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate   # Windows
```

3. **Instalar Dependencias**
```bash
pip install -r requirements.txt
```

4. **Configurar Variables de Entorno**
Crear un archivo `.env`:
```
MONGO_URI=mongodb+srv://<usuario>:<contraseña>@cluster.mongodb.net/<db_name>
MONGO_DB_NAME=nombre_de_la_base
MONGO_COLLECTION_NAME=nombre_de_la_colección
SECRET_KEY=clave_secreta_flask
PORT=5000
```

5. **Ejecutar la Aplicación**
```bash
cd survey-xai-app
python app.py
```

Accede en: [http://localhost:5000](http://localhost:5000).

## Licencia

Este proyecto está bajo la [Licencia MIT](LICENSE).
