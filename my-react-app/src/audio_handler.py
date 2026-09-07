import numpy as np 
from scipy.io import wavfile
from io import BytesIO

from audio import variations

class audio_handler:
    def __init__(self, sample_rate = 44100):
        self.sample_rate = sample_rate
    
    def generate_test_audio(self, frequency, boost_db, variation):
        varA, varB = variations(
            frequency = frequency,
            boost_db = boost_db,
            duration = 2,
            sr = self.sample_rate
        )

        file = varA if variation == "A" else varB
        
        return self.filesendwavfile(file)        
    
    def filesendwavfile(self, file):
        buffer = BytesIO()
        audio_int16 = (file*32767).astype(np.int16)
        wavfile.write(buffer,self.sample_rate,audio_int16)
        buffer.seek(0)
        return buffer.read()

