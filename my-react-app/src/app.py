from flask import Flask, request, jsonify, Response
from flask_cors import CORS
 
from audio_handler import audio_handler
from ml_model import ml_model
from config_gen import config_gen
from validator import validator
from error_handler import error_handler
 
		   

app = Flask(__name__)
CORS(app)
error_handler.register_error_handlers(app)
 
audio = audio_handler()
model = ml_model()
config = config_gen()
 
@app.route('/api/add-diagnostic', methods=['POST'])
def add_diagnostic():
    valid, error = validator.validate_diagnostic(request.json)
    if not valid:
        return jsonify({'error': error}), 400
    
    for freq, rating in request.json['diagnostics'].items():
        model.add_diagnostic(int(freq), rating)
    
    return jsonify({'status': 'success'})
 
@app.route('/api/generate-audio', methods=['POST'])
def generate_audio():
    valid, error = validator.validate_audio_request(request.json)
    if not valid:
        return jsonify({'error': error}), 400
    
    data = request.json
    audio_bytes = audio.generate_test_audio(
        data['frequency'], 
        data.get('boost_db', 0), 
        data.get('variant', 'A')
    )
    return Response(audio_bytes, mimetype='audio/wav')
 
@app.route('/api/get-next-test', methods=['POST'])
def get_next_test():
    next_test = model.predict_next_audio()
    
    if next_test is None:
        next_test = {} 
        
    overall_confidence = model.get_overall_confidence()
 
    return jsonify({
        **next_test,
        'overall_confidence': overall_confidence
    })
@app.route('/api/record-choice', methods=['POST'])
def record_choice():
    valid, error = validator.validate_choice(request.json)
    if not valid:
        return jsonify({'error': error}), 400
    
    data = request.json
    model.add_response(data['frequency'], data['choice'], data['boost_amount'])
    return jsonify({'status': 'success'})
 
@app.route('/api/get-eq-curve', methods=['GET'])
def get_eq_curve():
    curve = model.get_final_eq_curve()
    return jsonify({
        'curve': curve,
        'config': config.generate_config(curve)
    })
 
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})
 
@app.route('/api/clear-model', methods=["POST"])
def clear_model():
    try:
        model.clear_model()
        return jsonify({'status': 'success', 'message': 'Model cleared'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
 
if __name__ == '__main__':
    app.run(debug=True, port=5000)