from flask import Flask, render_template, request, jsonify
import json
import time
import uuid
import os
import logging
import requests
import threading
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
public_key = os.getenv('MONGO_PUBLIC_KEY')
private_key = os.getenv('MONGO_PRIVATE_KEY')
project_id = os.getenv('MONGO_PROJECT_ID')

# Configuración de la conexión a MongoDB Atlas
client = MongoClient(mongo_uri)
db = client[db_name]
collection = db[collection_name]

# Variable global para almacenar la última IP conocida
last_ip = None

def update_mongodb_ip_access():
    """Actualizar la IP de acceso permitida en MongoDB Atlas y eliminar las antiguas si la IP ha cambiado."""
    global last_ip
    current_ip = requests.get('https://api.ipify.org').text
    
    if current_ip != last_ip:
        api_url = f"https://cloud.mongodb.com/api/atlas/v1.0/groups/{project_id}/accessList"

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
                delete_response = requests.delete(delete_url, auth=(public_key, private_key), headers=headers)
                if delete_response.status_code != 204:
                    logging.error(f"Error deleting IP {ip['ipAddress']}: {delete_response.text}")

            # Agregar la nueva IP
            add_response = requests.post(api_url, json=current_ip_list, auth=(public_key, private_key), headers=headers)
            if add_response.status_code == 201:
                last_ip = current_ip  # Actualizar la última IP conocida
                logging.info(f"Updated MongoDB IP Access List with current IP: {current_ip}")
            else:
                logging.error(f"Failed to add new IP. Status Code: {add_response.status_code}")
                logging.error(add_response.text)
        else:
            logging.error(f"Failed to retrieve IP access list. Status Code: {response.status_code}")
            logging.error(response.text)

def monitor_ip_change(interval=60):
    """Monitorea cambios en la IP del servidor y actualiza MongoDB Atlas si es necesario."""
    while True:
        update_mongodb_ip_access()
        time.sleep(interval)

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
    # Iniciar el monitor de cambio de IP en un thread separado
    ip_monitor_thread = threading.Thread(target=monitor_ip_change, args=(60,))
    ip_monitor_thread.daemon = True
    ip_monitor_thread.start()

    app.run(debug=True)
