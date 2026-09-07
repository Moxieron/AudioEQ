import numpy as np
import pandas as pd
from sklearn.naive_bayes import GaussianNB as GNB
import random
 
class ml_model:
    def __init__(self):
        self.frequencies = [60, 200, 500, 1000, 3000, 4000, 6000, 10000, 12000]
        self.max_reps= 5
        self.confidence_threshold = 0.75
        self.model = None
        self.responses = []
        self.diagnostic = {}
    def clear_model(self):
        self.model = None
        self.responses = []
        self.diagnostic = {}
   
    def add_diagnostic(self, frequency, rating):
        self.diagnostic[frequency] = rating
 
    def add_response(self, frequency, choice, boost_amount):
        self.responses.append({
            'frequency': frequency,
            'choice': choice,
            'boost_amount': boost_amount
        })
        if len(self.responses) >= 3:
            self.train_model()
    
    def train_model(self):
        
        X = []
        y = []  
        
        for response in self.responses:
            X.append([response["frequency"]])
            
 
            y.append(1 if response["choice"] == 'B' else 0)
        
        self.model = GNB()
        
        self.model.fit(X, y)
    def get_test_counts(self):
 
        counts = {}
        for response in self.responses:
            freq = response['frequency']
            counts[freq] = counts.get(freq, 0) + 1
        return counts
    
    def calculate_consistency(self, freq):
        freq_responses = [r for r in self.responses if r['frequency'] == freq]
        
        if not freq_responses:
            return 0.0
        
        choices = [r['choice'] for r in freq_responses]
        b_count = choices.count('B')
        a_count = choices.count('A')
        total = len(choices)
        
        dominant_count = max(b_count, a_count)
        consistency = dominant_count / total
        
        return consistency
    def get_overall_confidence(self):
        if not self.responses:
           return 0.0
    
        tested_freqs = set(r['frequency'] for r in self.responses)
        
        if not tested_freqs:
            return 0.0
        
        consistencies = [self.calculate_consistency(freq) for freq in tested_freqs]
        return round(sum(consistencies) / len(consistencies), 2)
    def predict_next_audio(self):
        freq_test_counts = self.get_test_counts()
        

        for freq in self.frequencies:
            if freq_test_counts.get(freq, 0) < self.max_reps:
                boost_amount = self.get_boost_amount(freq)
                
                consistency = self.calculate_consistency(freq)
                
                confidence = consistency if freq_test_counts.get(freq, 0) > 0 else 0.5
                
                return {
                    'frequency': freq,
                    'boost_amount': boost_amount,
                    'confidence': confidence 
                }
        
        low_confidence_tests = []
        
        for freq in self.frequencies:
            test_count = freq_test_counts.get(freq, 0)
            
            if test_count >= self.max_reps:
                continue
            
            consistency = self.calculate_consistency(freq)
            
            if consistency < self.confidence_threshold:
                low_confidence_tests.append((freq, consistency))
        
        if low_confidence_tests:
            freq, confidence = min(low_confidence_tests, key=lambda x: x[1])
            boost_amount = self.get_boost_amount(freq)
            return {
                'frequency': freq,
                'boost_amount': boost_amount,
                'confidence': confidence
            }
        
        if len(self.responses) >= 3 and self.model:
            tested_freqs = set(r['frequency'] for r in self.responses)
            untested = [f for f in self.frequencies if f not in tested_freqs]
            
            if untested:
						   
                uncertainties = []
                for freq in untested:
                    proba = self.model.predict_proba([[freq]])[0]
                    uncertainty = 1 - abs(proba[1] - 0.5) * 2
                    uncertainties.append((freq, uncertainty))
                
                freq, unc = max(uncertainties, key=lambda x: x[1])
                boost_amount = self.get_boost_amount(freq)
                return {
                    'frequency': freq,
                    'boost_amount': boost_amount,
                    'confidence': 1 - unc
                }
    
        return None
    def get_boost_amount(self, freq):
        freq_responses = [r for r in self.responses if r['frequency'] == freq]
 
        if freq in self.diagnostic:
            rating = self.diagnostic[freq]
            if rating == 'low':
                base = 6.0
            elif rating == 'high':
                base = -3.0
            else:
                base = 3.0
        else:
            base = 3.0
 
        if not freq_responses:
            return base
 
        current = base
        step = 1.5
 
        for r in freq_responses:
            if r['choice'] == 'B':
                current -= step
            elif r['choice'] == 'A':
                current += step
            step *= 0.65  

        print(round(max(0.5, min(12.0, abs(current))) * (1 if current >= 0 else -1), 1))
        return round(max(0.5, min(12.0, abs(current))) * (1 if current >= 0 else -1), 1)
 
    
    def get_final_eq_curve(self):
        curve = []
        
        for freq in self.frequencies:
            freq_responses = [r for r in self.responses if r['frequency'] == freq]
            
            if not freq_responses:
                curve.append({'frequency': freq, 'gain': 0})
                continue
            
            reversals = []
            for i in range(1, len(freq_responses)):
                prev = freq_responses[i - 1]['choice']
                curr = freq_responses[i]['choice']
                if prev in ('A', 'B') and curr in ('A', 'B') and prev != curr:
                    reversals.append(freq_responses[i]['boost_amount'])
 
            if reversals:
                gain = round(np.mean(reversals), 1)
            else:
                boost_count = sum(1 for r in freq_responses if r['choice'] == 'B')
                if boost_count > len(freq_responses) / 2:
                    gain = round(freq_responses[-1]['boost_amount'], 1)
                else:
                    gain = 0
 
            curve.append({'frequency': freq, 'gain': gain})
        
        return curve