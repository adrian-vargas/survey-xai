from flask import Flask, render_template, request, jsonify
import json
import time
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import logging

app = Flask(__name__)

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
db = client[db_name]  # Nombre de la base de datos
collection = db[collection_name]  # Nombre de la colección

from pymongo import MongoClient

client = MongoClient("mongodb+srv://adrivara2018:Am8vhkmoRkH9ncyF@survey-xai-cluster.4ocyf.mongodb.net/?retryWrites=true&w=majority&appName=survey-xai-cluster")
db = client.test
print("Connected to MongoDB!")


@app.route('/test-connection', methods=['GET'])
def test_connection():
    try:
        dbs = client.list_database_names()
        return jsonify({'status': 'success', 'databases': dbs})
    except Exception as e:
        logging.error(f"Error in test_connection: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/')
def index():
    return render_template('index.html')

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
        
        timestamp = time.time()  # Captura el tiempo actual en segundos
        for item in data:
            item['timestamp'] = timestamp  # Añade la marca de tiempo a los datos

        # Guardar la respuesta en MongoDB
        collection.insert_many(data)
        return jsonify({'status': 'success', 'timestamp': timestamp})
    except Exception as e:
        logging.error(f"Error in submit: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

import requests
@app.route('/get-my-ip')
def get_my_ip():
    ip = requests.get('https://api.ipify.org').text
    return f'My public IP is: {ip}'


if __name__ == '__main__':
    app.run(debug=True)
