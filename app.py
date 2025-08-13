from flask import Flask, request, jsonify
from flask_cors import CORS
import inference_2 as inference
import os
from werkzeug.utils import secure_filename
import librosa
import cv2

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload settings
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'jpg', 'jpeg', 'png', 'wav', 'flac', 'mp3'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/predict/video', methods=['POST'])
def predict_video():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file'}), 400
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Run inference
        result = inference.deepfakes_video_predict(filepath)
        
        # Clean up
        os.remove(filepath)
        
        return jsonify({'result': result, 'status': 'success'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict/image', methods=['POST'])
def predict_image():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file'}), 400
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Load image for inference
        image = cv2.imread(filepath)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Run inference
        result = inference.deepfakes_image_predict(image)
        
        # Clean up
        os.remove(filepath)
        
        return jsonify({'result': result, 'status': 'success'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict/audio', methods=['POST'])
def predict_audio():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file'}), 400
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Load audio for inference
        audio, sr = librosa.load(filepath, sr=16000)
        
        # Run inference
        result = inference.deepfakes_spec_predict((audio, sr))
        
        # Clean up
        os.remove(filepath)
        
        return jsonify({'result': result, 'status': 'success'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)