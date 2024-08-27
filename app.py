from flask import Flask, render_template, request, jsonify
import json
import time
import uuid
import os
import logging
import requests
from pymongo import MongoClient
from dotenv import load_dotenv

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
db = client[db_name]
collection = db[collection_name]

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

if __name__ == '__main__':
    app.run(debug=True)
