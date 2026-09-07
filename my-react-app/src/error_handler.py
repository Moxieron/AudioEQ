from flask import jsonify
class error_handler:
    def register_error_handlers(app):
        
        @app.errorhandler(400)
        def bad_request(error):
            return jsonify({'error': 'Bad request', 'message': str(error)}), 400
        
        @app.errorhandler(404)
        def not_found(error):
            return jsonify({'error': 'Not found'}), 404
        
        @app.errorhandler(500)
        def internal_error(error):
            return jsonify({'error': 'Internal server error'}), 500