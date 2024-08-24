from flask import Flask, render_template, request, jsonify
import json
import time
from pymongo import MongoClient
from dotenv import load_dotenv
import os

app = Flask(__name__)

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

@app.route('/test-connection', methods=['GET'])
def test_connection():
    try:
        # Intenta acceder a la lista de bases de datos
        dbs = client.list_database_names()
        return jsonify({'status': 'success', 'databases': dbs})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/questions', methods=['GET'])
def get_questions():
    with open('questions.json', 'r') as f:
        questions = json.load(f)
    return jsonify(questions)

@app.route('/submit', methods=['POST'])
def submit():
    data = request.json
    timestamp = time.time()  # Captura el tiempo actual en segundos
    data['timestamp'] = timestamp  # Añade la marca de tiempo a los datos

    # Guardar la respuesta en MongoDB
    collection.insert_one(data)
    
    return jsonify({'status': 'success', 'timestamp': timestamp})

if __name__ == '__main__':
    app.run(debug=True)
