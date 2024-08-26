from flask import Flask, render_template, request, jsonify
import json
import time
import uuid  # Importa la librería para generar UUIDs
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import logging
import requests

app = Flask(__name__)

# Configurar logging
logging.basicConfig(level=logging.INFO)

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

# Obtener las variables desde el entorno
mongo_uri = os.getenv('MONGO_URI')
db_name = os.getenv('MONGO_DB_NAME')
collection_name = os.getenv('MONGO_COLLECTION_NAME')
public_key = os.getenv('MONGO_PUBLIC_KEY')
private_key = os.getenv('MONGO_PRIVATE_KEY')
org_id = os.getenv('MONGO_ORG_ID')

# Configuración de la conexión a MongoDB Atlas
client = MongoClient(mongo_uri)
db = client[db_name]  # Nombre de la base de datos
collection = db[collection_name]  # Nombre de la colección

def update_mongodb_ip_access():
    """Actualizar la IP de acceso permitida en MongoDB Atlas y eliminar las antiguas."""
    current_ip = requests.get('https://api.ipify.org').text
    api_url = f"https://cloud.mongodb.com/api/atlas/v1.0/orgs/{org_id}/accessList"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    # Obtener lista actual de IPs
    response = requests.get(api_url, auth=(public_key, private_key), headers=headers)
    if response.status_code == 200:
        access_list = response.json()['results']
        current_ip_list = [{"ipAddress": current_ip}]
        
        # Borrar las IPs existentes
        for ip in access_list:
            delete_url = f"{api_url}/{ip['ipAddress']}"
            requests.delete(delete_url, auth=(public_key, private_key), headers=headers)
        
        # Agregar la nueva IP
        requests.post(api_url, json=current_ip_list, auth=(public_key, private_key), headers=headers)
        logging.info(f"Updated MongoDB IP Access List with current IP: {current_ip}")
    else:
        logging.error(f"Failed to retrieve or update IP access list. Status Code: {response.status_code}")
        logging.error(response.text)

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
        user_id = str(uuid.uuid4())  # Genera un UUID único para identificar al usuario
        
        for item in data:
            item['timestamp'] = timestamp  # Añade la marca de tiempo a los datos
            item['user_id'] = user_id  # Añade el identificador único de usuario

        # Guardar la respuesta en MongoDB
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
    update_mongodb_ip_access()  # Actualizar la IP de MongoDB al iniciar la aplicación
    app.run(debug=True)
