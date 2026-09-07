import { useState } from 'react';
import DiagnosticRound from './components/Diagnostic';
import ABTest from './components/Main_Phase';
import Results from './components/Results';
import './App.css';
 
function App() {
  const [phase, setPhase] = useState('diagnostic');
  const [diagnosticData, setDiagnosticData] = useState({}); 
  const [eqCurve, setEqCurve] = useState(null);
 
  const handleDiagnosticComplete = async (diagnosticResults) => {
    console.log('Diagnostic done:', diagnosticResults);
    setDiagnosticData(diagnosticResults);
 
    try {
      await fetch('http://localhost:5000/api/add-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnostics: diagnosticResults })
      });
    } catch (error) {
      console.error('Failed to send diagnostic data:', error);
    }
 
    setPhase('testing');
  };
 
  const handleTestingComplete = (responses, finalCurve) => {
    console.log('Testing done:', responses);
    setEqCurve(finalCurve);
    setPhase('results');
  };
 
  return (
    <div className="App">
      <h1>Perceptual EQ Calibration</h1>
      
      {phase === 'diagnostic' && (
        <DiagnosticRound onComplete={handleDiagnosticComplete} />
      )}
      
      {phase === 'testing' && (
        <ABTest 
          diagnosticData={diagnosticData}
          onComplete={handleTestingComplete}
        />
      )}
      
      {phase === 'results' && (
        <Results eqCurve={eqCurve} />
      )}
    </div>
  );
}
 
export default App;