from flask import Flask, render_template, request, jsonify
import time

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/submit', methods=['POST'])
def submit():
    data = request.json
    timestamp = time.time()  # Captura el tiempo actual en segundos
    # Aquí podrías guardar `data` y `timestamp` en una base de datos o archivo
    return jsonify({'status': 'success', 'timestamp': timestamp})

if __name__ == '__main__':
    app.run(debug=True)
