from flask import Flask, render_template, request, jsonify, session, redirect, url_for
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
app.secret_key = "your_super_secret_key"  # Clave secreta de la aplicación

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

@app.route('/admin/download_individual_report')
def download_individual_report():
    if not session.get("admin_logged_in"):
        return redirect(url_for("index"))
    
    data = pd.DataFrame(list(collection.find()))
    individual_report = data.groupby("user_id").agg({
        "time": "mean",
        "answer": "count"
    }).rename(columns={"time": "Average Time", "answer": "Total Answers"})

    output = io.StringIO()
    individual_report.to_csv(output)
    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype="text/csv",
        as_attachment=True,
        download_name="individual_report.csv"
    )

@app.route('/admin/download_general_report')
def download_general_report():
    if not session.get("admin_logged_in"):
        return redirect(url_for("index"))
    
    data = pd.DataFrame(list(collection.find()))
    total_participants = data['user_id'].nunique()
    avg_time = data['time'].mean()
    general_summary = pd.DataFrame({
        "Total Participants": [total_participants],
        "Average Completion Time": [avg_time]
    })

    output = io.StringIO()
    general_summary.to_csv(output)
    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype="text/csv",
        as_attachment=True,
        download_name="general_report.csv"
    )

if __name__ == '__main__':
    app.run(debug=True)
