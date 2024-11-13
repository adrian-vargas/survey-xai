from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import subprocess
import json
import time
import uuid
import os
import logging
import requests
from pymongo import MongoClient
from dotenv import load_dotenv
import pandas as pd
import io
from flask import send_file

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")  # Clave secreta de la aplicación

# Configurar logging
logging.basicConfig(level=logging.INFO)

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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/access', methods=['POST'])
def access():
    password = request.json.get("password")
    if password == "clave456":  # Contraseña del administrador
        session["admin_logged_in"] = True
        return jsonify({"status": "admin"})
    elif password == "clave123":  # Contraseña del usuario
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
    try:
        with open('questions.json', 'r') as f:
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
@app.route('/generate_report')
def generate_report():
    try:
        subprocess.run(["python", "survey_report.py"], check=True)
        return redirect(url_for('download_report'))
    except subprocess.CalledProcessError:
        return "Error al generar el reporte.", 500

# Ruta para descargar el reporte
@app.route('/download_report')
def download_report():
    report_path = os.path.join("static", "report.zip")
    if os.path.exists(report_path):
        return send_file(report_path, as_attachment=True)
    else:
        return "El archivo no existe.", 404
    
if __name__ == '__main__':
    app.run(debug=True)