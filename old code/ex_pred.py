from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Sigmoid function
def sigmoid(z):
    return 1 / (1 + np.exp(-z))

# Prediction function
def predict(X, w, b):
    m, n = X.shape
    p = np.zeros(m)

    for i in range(m):   
        z_wb = np.dot(X[i], w) + b
        f_wb = sigmoid(z_wb)
        p[i] = f_wb >= 0.5
    
    return p.tolist()

# Sample model weights
w = np.array([0.5, -0.3, 0.8])  # Example weights
b = -0.1  # Example bias

@app.route('/predict', methods=['POST'])
def predict_api():
    try:
        data = request.json  # Expecting JSON input
        X = np.array(data['features'])  # Extract input features
        predictions = predict(X, w, b)
        return jsonify({'predictions': predictions})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
