
class validator:
    VALID_FREQUENCIES = [60, 200, 500, 1000, 3000, 4000,6000, 10000,12000]
    VALID_RATINGS = ['low', 'good', 'high']
    VALID_CHOICES = ['A', 'B', 'Same']
    
    @staticmethod
    def validate_diagnostic(data):
        if 'diagnostics' not in data:
            return False, "Missing 'diagnostics' field"
        
        for freq, rating in data['diagnostics'].items():
            try:
                freq_int = int(freq)
            except ValueError:
                return False, f"Invalid frequency: {freq}"
            
            if freq_int not in validator.VALID_FREQUENCIES:
                return False, f"Frequency must be one of {validator.VALID_FREQUENCIES}"
            
            if rating not in validator.VALID_RATINGS:
                return False, f"Rating must be one of {validator.VALID_RATINGS}"
        
        return True, None
    
    @staticmethod
    def validate_audio_request(data):
        if 'frequency' not in data:
            return False, "Missing 'frequency' field"
        
        freq = data['frequency']
        if freq not in validator.VALID_FREQUENCIES:
            return False, f"Invalid frequency: {freq}"
        
        boost = data.get('boost_db', 0)
        if not -12 <= boost <= 12:
            return False, "Boost must be between -12 and +12 dB"
        
        return True, None
    
    @staticmethod
    def validate_choice(data):
        required = ['frequency', 'choice', 'boost_amount']
        for field in required:
            if field not in data:
                return False, f"Missing required field: {field}"
        
        if data['choice'] not in validator.VALID_CHOICES:
            return False, f"Choice must be one of {validator.VALID_CHOICES}"
        
        return True, None