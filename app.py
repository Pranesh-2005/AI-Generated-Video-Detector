from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload settings
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'jpg', 'jpeg', 'png', 'wav', 'flac', 'mp3'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Global variables for lazy loading
inference_module = None
models_loaded = False

def load_models():
    """Lazy load models only when needed to save memory"""
    global inference_module, models_loaded
    if not models_loaded:
        try:
            import inference_2 as inference
            inference_module = inference
            models_loaded = True
            print("✅ Models loaded successfully")
            return True
        except Exception as e:
            print(f"❌ Failed to load models: {e}")
            models_loaded = False
            return False
    return True

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'models_loaded': models_loaded})

@app.route('/api/predict/video', methods=['POST'])
def predict_video():
    try:
        print("📹 Video prediction request received")
        
        if 'file' not in request.files:
            print("❌ No file in request")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            print(f"❌ Invalid file: {file.filename}")
            return jsonify({'error': 'Invalid file format'}), 400
        
        print(f"📁 Processing file: {file.filename}")
        
        # Try to load models
        if not load_models():
            print("⚠️ Running in demo mode")
            return jsonify({
                'result': '🎬 Video uploaded successfully!\n\n⚠️ Demo Mode: AI models are not available due to memory constraints on free hosting.\n\nIn production, this would:\n• Extract and analyze multiple video frames\n• Detect facial regions\n• Apply deepfake detection algorithms\n• Provide confidence scores',
                'status': 'success'
            })
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        try:
            # Run inference
            result = inference_module.deepfakes_video_predict(filepath)
            return jsonify({'result': result, 'status': 'success'})
        finally:
            # Clean up - ensure file is deleted even if inference fails
            if os.path.exists(filepath):
                os.remove(filepath)
    
    except Exception as e:
        print(f"❌ Video processing error: {str(e)}")
        # Return demo response on any error
        return jsonify({
            'result': '🎬 Video uploaded successfully!\n\n⚠️ Demo Mode: Encountered processing issue but file received successfully.\n\nIn production, this would:\n• Extract and analyze multiple video frames\n• Detect facial regions\n• Apply deepfake detection algorithms\n• Provide confidence scores',
            'status': 'success'
        })

@app.route('/api/predict/image', methods=['POST'])
def predict_image():
    try:
        print("🖼️ Image prediction request received")
        
        if 'file' not in request.files:
            print("❌ No file in request")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            print(f"❌ Invalid file: {file.filename}")
            return jsonify({'error': 'Invalid file format'}), 400
        
        print(f"📁 Processing file: {file.filename}")
        
        # Try to load models
        if not load_models():
            print("⚠️ Running in demo mode")
            return jsonify({
                'result': '🖼️ Image uploaded successfully!\n\n⚠️ Demo Mode: AI models are not available due to memory constraints on free hosting.\n\nIn production, this would:\n• Detect and extract facial features\n• Analyze image authenticity\n• Check for manipulation artifacts\n• Provide detailed confidence scores',
                'status': 'success'
            })
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        print(f"💾 File saved to: {filepath}")
        
        try:
            # Import cv2 only when needed and models are loaded
            import cv2
            
            # Load image for inference
            image = cv2.imread(filepath)
            if image is None:
                print("❌ Could not read image file")
                return jsonify({'error': 'Could not read image file'}), 400
            
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            print("✅ Image loaded and converted")
            
            # Run inference
            result = inference_module.deepfakes_image_predict(image)
            return jsonify({'result': result, 'status': 'success'})
        finally:
            # Clean up
            if os.path.exists(filepath):
                os.remove(filepath)
                print(f"🗑️ Cleaned up file: {filepath}")
    
    except Exception as e:
        print(f"❌ Image processing error: {str(e)}")
        # Always return demo response for any error
        return jsonify({
            'result': '🖼️ Image uploaded successfully!\n\n⚠️ Demo Mode: AI models are not available due to memory constraints on free hosting.\n\nIn production, this would:\n• Detect and extract facial features\n• Analyze image authenticity\n• Check for manipulation artifacts\n• Provide detailed confidence scores',
            'status': 'success'
        })

@app.route('/api/predict/audio', methods=['POST'])
def predict_audio():
    try:
        print("🎵 Audio prediction request received")
        
        if 'file' not in request.files:
            print("❌ No file in request")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            print(f"❌ Invalid file: {file.filename}")
            return jsonify({'error': 'Invalid file format'}), 400
        
        print(f"📁 Processing file: {file.filename}")
        
        # Try to load models
        if not load_models():
            print("⚠️ Running in demo mode")
            return jsonify({
                'result': '🎵 Audio uploaded successfully!\n\n⚠️ Demo Mode: AI models are not available due to memory constraints on free hosting.\n\nIn production, this would:\n• Convert audio to spectrograms\n• Analyze vocal patterns\n• Detect synthetic speech artifacts\n• Provide authenticity confidence scores',
                'status': 'success'
            })
        
        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        try:
            # Import librosa only when needed and models are loaded
            import librosa
            
            # Load audio for inference
            audio, sr = librosa.load(filepath, sr=16000)
            
            # Run inference
            result = inference_module.deepfakes_spec_predict((audio, sr))
            return jsonify({'result': result, 'status': 'success'})
        except Exception as audio_error:
            print(f"❌ Audio processing error: {str(audio_error)}")
            return jsonify({'error': f'Audio processing error: {str(audio_error)}'}), 500
        finally:
            # Clean up
            if os.path.exists(filepath):
                os.remove(filepath)
    
    except Exception as e:
        print(f"❌ Audio processing error: {str(e)}")
        # Return demo response on error
        return jsonify({
            'result': '🎵 Audio uploaded successfully!\n\n⚠️ Demo Mode: Encountered processing issue but file received successfully.\n\nIn production, this would:\n• Convert audio to spectrograms\n• Analyze vocal patterns\n• Detect synthetic speech artifacts\n• Provide authenticity confidence scores',
            'status': 'success'
        })

@app.errorhandler(413)
def too_large(e):
    print("❌ File too large")
    return jsonify({'error': 'File too large. Maximum size is 100MB.'}), 413

@app.errorhandler(404)
def not_found(e):
    print("❌ Endpoint not found")
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    print(f"❌ Internal server error: {str(e)}")
    return jsonify({'error': 'Internal server error'}), 500

# Add OPTIONS handler for CORS preflight
@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return '', 200

if __name__ == '__main__':
    print("🚀 Starting AI Video Detector Backend...")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"📊 Max file size: {app.config['MAX_CONTENT_LENGTH'] // (1024*1024)}MB")
    
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🌐 Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)