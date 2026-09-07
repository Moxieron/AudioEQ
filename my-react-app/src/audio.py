import numpy as np
import pandas as pd
import sounddevice as sd
from scipy import signal
from scipy.io import wavfile

#ToDo:
#Write Audio to File


#pinknoise gen
    
def generate_pink_noise(duration, sr=44100):

    num_samples = int(duration * sr)
    
    num_rows = 16
    
    array = np.random.randn(num_rows, num_samples)

    for i in range(num_rows):
        update_rate = 2 ** i
        indices = (np.arange(num_samples) // update_rate).astype(int)
        array[i] = np.take(array[i], indices, mode='wrap')
    
    pink = np.sum(array, axis=0)
    pink = pink / np.max(np.abs(pink))
    
    return pink.astype(np.float32)

#tune pinknoise into specfic Hz

def apply_bandpass_filter(audio, center, sr=44100):

    low = center / (2 ** (1/6))
    high = center * (2 ** (1/6))
    sos = signal.butter(4, [low, high], btype='band', fs=sr, output='sos')
    
    return signal.sosfilt(sos, audio)

#eq boost

def eq_boost(audio, fc, gain_db, Q, fs):
    
    A = 10 ** (gain_db / 40)  
    w0 = 2 * np.pi * fc / fs  
    alpha = np.sin(w0) / (2 * Q)
    
   
    b0 = 1 + alpha * A
    b1 = -2 * np.cos(w0)
    b2 = 1 - alpha * A
    a0 = 1 + alpha / A
    a1 = -2 * np.cos(w0)
    a2 = 1 - alpha / A
    
    b = np.array([b0, b1, b2]) / a0
    a = np.array([a0, a1, a2]) / a0
    
    filtered = signal.lfilter(b, a, audio)

    return filtered
def variations(frequency, boost_db=3,duration = 2, sr = 44100):
    pink = generate_pink_noise(duration, sr)
    
    var_normal = apply_bandpass_filter(pink, frequency, sr)
    var_boost = eq_boost(var_normal,frequency,boost_db, Q = 1.0, fs = sr)

    return normalize_pair(var_normal, var_boost)

def normalize_pair(var_a, var_b):
    """Match RMS loudness for fair A/B comparison"""
    rms_a = np.sqrt(np.mean(var_a ** 2))
    rms_b = np.sqrt(np.mean(var_b ** 2))
    
    target_rms = 0.1
    var_a = var_a * (target_rms / (rms_a + 1e-10))
    var_b = var_b * (target_rms / (rms_b + 1e-10))
    
    # Safety clip
    var_a = np.clip(var_a, -0.95, 0.95)
    var_b = np.clip(var_b, -0.95, 0.95)
    
    return var_a, var_b

def save_audio_to_file(audio, filename, sr=44100):
    
    audio_int16 = (audio * 32767).astype(np.int16)
    
    wavfile.write(filename, sr, audio_int16)
    
    return filename

def main():
    
    #For testing use(functions in here are used in app.py)
    #Diag set up()
    #Need 7 bands[60,200,1000,4000,10000]

    user_response = pd.DataFrame()

    #60Hz

    print("Hii")
    
    pinknoise = generate_pink_noise(3,)
    filtered = apply_bandpass_filter(pinknoise, 60,)

    sd.play(filtered)
    sd.wait()

    #200Hz

    pinknoise = generate_pink_noise(3,)
    filtered = apply_bandpass_filter(pinknoise, 200,)

    sd.play(filtered)
    sd.wait()

    #1000Hz

    pinknoise = generate_pink_noise(3,)
    filtered = apply_bandpass_filter(pinknoise, 1000,)

    sd.play(filtered)
    sd.wait()
    
    #4000 Hz

    pinknoise = generate_pink_noise(3,)
    filtered = apply_bandpass_filter(pinknoise, 60,)

    sd.play(filtered)
    sd.wait()


if __name__ == "__main__":
    main()
