import os
import json
import time
import uuid
import logging
import requests
from pymongo import MongoClient
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
import subprocess

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

# Establecer la ruta base del proyecto
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__)

# Configurar la clave secreta de la aplicación
app.secret_key = os.getenv("SECRET_KEY")

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Obtener las variables de conexión a MongoDB desde el entorno
mongo_uri = os.getenv('MONGO_URI')
db_name = os.getenv('MONGO_DB_NAME')
collection_name = os.getenv('MONGO_COLLECTION_NAME')

# Obtener las claves de admin y user desde las variables de entorno
user_access_key = os.getenv('USER_ACCESS_KEY')
admin_access_key = os.getenv('ADMIN_ACCESS_KEY')

# Configuración de la conexión a MongoDB Atlas con manejo de errores
try:
    client = MongoClient(mongo_uri)
    db = client[db_name]
    collection = db[collection_name]
    logger.info("Conexión a MongoDB establecida correctamente.")
except Exception as e:
    logger.error(f"Error al conectar a MongoDB: {e}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/access', methods=['POST'])
def access():
    password = request.json.get("password")
    if password == admin_access_key:  # Contraseña del administrador
        session["admin_logged_in"] = True
        return jsonify({"status": "admin"})
    elif password == user_access_key:  # Contraseña del usuario
        session["user_logged_in"] = True
        return jsonify({"status": "user"})
    else:
        return jsonify({"status": "error"}), 403

@app.route('/logout')
def logout():
    session.pop("admin_logged_in", None)
    session.pop("user_logged_in", None)
    return redirect(url_for("index"))

@app.route('/test-connection', methods=['GET'])
def test_connection():
    try:
        dbs = client.list_database_names()
        return jsonify({'status': 'success', 'databases': dbs})
    except Exception as e:
        logging.error(f"Error in test_connection: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/questions', methods=['GET'])
def get_questions():
    questions_path = os.path.join(BASE_DIR, 'static', 'js', 'questions.json')
    try:
        with open(questions_path, 'r') as f:
            questions = json.load(f)
        return jsonify(questions)
    except Exception as e:
        logging.error(f"Error loading questions: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/submit', methods=['POST'])
def submit():
    try:
        data = request.json
        if not isinstance(data, list):
            raise ValueError("Submitted data should be a list of answers")
        
        timestamp = time.time()  
        user_id = str(uuid.uuid4())  
        
        for item in data:
            item['timestamp'] = timestamp  
            item['user_id'] = user_id  

        collection.insert_many(data)
        return jsonify({'status': 'success', 'timestamp': timestamp, 'user_id': user_id})
    except Exception as e:
        logging.error(f"Error in submit: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/get-my-ip')
def get_my_ip():
    ip = requests.get('https://api.ipify.org').text
    return f'My public IP is: {ip}'

# Ruta para ejecutar el script y generar el reporte
@app.route('/generate_report', methods=['GET'])
def generate_report():
    try:
        app.logger.info("Intentando ejecutar el script survey_report.py...")
        survey_report_path = os.path.join(BASE_DIR, "survey_report.py")

        # Ejecutar el script sin necesidad de descargar el reporte
        result = subprocess.run(
            ["python", survey_report_path], 
            check=True, 
            capture_output=True, 
            text=True, 
            timeout=300  # Tiempo máximo en segundos
        )
        app.logger.info(f"Salida del script: {result.stdout}")

        if result.stderr:
            app.logger.error(f"Errores del script: {result.stderr}")

        # Devolver mensaje de éxito al cliente
        return jsonify({"status": "success", "message": "Reporte generado exitosamente."})

    except subprocess.TimeoutExpired:
        app.logger.error("Tiempo de espera agotado al generar el reporte.")
        return jsonify({"status": "error", "message": "El reporte tomó demasiado tiempo en generarse y fue cancelado."}), 500

    except subprocess.CalledProcessError as e:
        app.logger.error(f"Error al generar el reporte: {e}")
        return jsonify({"status": "error", "message": "Error al generar el reporte."}), 500

# Configuración de ejecución para producción
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
