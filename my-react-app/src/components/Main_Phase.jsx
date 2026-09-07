import { useState, useEffect, useRef } from "react";
 
function ABTest({ diagnosticData, onComplete }) {
  const [currentTest, setCurrentTest] = useState(null);
  const [responses, setResponses] = useState([]);
  const [audioA, setAudioA] = useState(null);
  const [audioB, setAudioB] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwapped, setIsSwapped] = useState(false);
  const [refAudio, setRefAudio] = useState(null);
  const [progress, setProgress] = useState({ completed: 0, estimated: 14 });
  const hasInitialized = useRef(false);
 
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    loadNextTest([]);
    loadReferenceAudio();
  });
 
  const loadReferenceAudio = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency: 1000, boost_db: 0, variant: 'A' })
      });
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setRefAudio(url);
    } catch (error) {
      console.error('Failed to load reference audio:', error);
    }
  };
const loadNextTest = async (currentResponses) => {
  setIsLoading(true);
  
  const response = await fetch('http://localhost:5000/api/get-next-test', {
    method: 'POST',
    headers: { "Content-Type": 'application/json' },
    body: JSON.stringify({
      diagnosticData: diagnosticData,
      previousResponses: currentResponses 
    })
  });
  
  const nextTest = await response.json();
  
 
  if (!nextTest.frequency) {
    finishTesting(currentResponses); 
    return;
  }
  
  setCurrentTest(nextTest);
  setProgress({ 
    completed: currentResponses.length, 
    estimated: 14 
  });
  
  await loadAudio(nextTest.frequency, nextTest.boost_amount);
  setIsLoading(false);
};
  const loadAudio = async (frequency, boost_amount) => {
    const shouldSwap = Math.random() > 0.5;
    setIsSwapped(shouldSwap);
 
    const resA = await fetch('http://localhost:5000/api/generate-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frequency: frequency, boost_db: 0, variant: 'A' })
    });
    const blobA = await resA.blob();
    const newUrlA = URL.createObjectURL(blobA);
 
    const resB = await fetch('http://localhost:5000/api/generate-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frequency: frequency, boost_db: boost_amount, variant: 'B' })
    });
    const blobB = await resB.blob();
    const newUrlB = URL.createObjectURL(blobB);
 
 
    if (shouldSwap) {
      setAudioA(prevA => {
        if (prevA) URL.revokeObjectURL(prevA);
        return newUrlB;  
      });
      setAudioB(prevB => {
        if (prevB) URL.revokeObjectURL(prevB);
        return newUrlA;  
      });
    } else {
      setAudioA(prevA => {
        if (prevA) URL.revokeObjectURL(prevA);
        return newUrlA;
      });
      setAudioB(prevB => {
        if (prevB) URL.revokeObjectURL(prevB);
        return newUrlB;
      });
    }
  };
 
  const playVariant = (variant) => {
    const audio = new Audio(variant === 'A' ? audioA : audioB);
    audio.play();
  };
 
  const playRefSound = () => {  
    if (refAudio) {
      const audio = new Audio(refAudio);
      audio.play(); 
    } else {
      console.warn('Reference audio not loaded yet');
    }
  };
 
  const recordChoice = async (choice) => {
    const actualChoice = choice === 'Same' ? 'Same' : (isSwapped ? (choice === 'A' ? 'B' : 'A') : choice);
 
    const newResponses = [
      ...responses,
      {
        frequency: currentTest.frequency,
        choice: actualChoice,
        boost_amount: currentTest.boost_amount
      }
    ];
    setResponses(newResponses);
 
    await fetch('http://localhost:5000/api/record-choice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frequency: currentTest.frequency,
        choice: actualChoice,
        boost_amount: currentTest.boost_amount
      })
    });
 
    loadNextTest(newResponses); 
  };
 
  const finishTesting = async (finalResponses) => {
    const response = await fetch('http://localhost:5000/api/get-eq-curve');
    const data = await response.json();
 
    onComplete(finalResponses, data.curve);
  };
 
  if (isLoading || !currentTest) {
    return <div>Loading Test...</div>;
  }
 
return (
  <div className="ab-test" style={{
    maxWidth: '600px',
    margin: '0 auto',
    padding: '40px 20px',
    textAlign: 'center'
  }}>
    <div style={{
      marginBottom: '20px',
      padding: '10px',
      backgroundColor: '#f8f9fa',
      borderRadius: '6px'
    }}>
      <div style={{
        height: '8px',
        backgroundColor: '#e9ecef',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${((responses.filter(r => r.frequency === currentTest.frequency).length + 1) / progress.estimated) * 100}%`,
          backgroundColor: '#007bff',
          transition: 'width 0.3s ease'
        }} />
      </div>
      <p style={{ fontSize: '14px', marginTop: '8px', color: '#666' }}>
        {responses.filter(r => r.frequency === currentTest.frequency).length + 1} / ~{progress.estimated} tests • 
        Confidence: {(currentTest.confidence * 100).toFixed(0)}%
      </p>
</div>
    <h2 style={{
      fontSize: '28px',
      marginBottom: '10px'
    }}>
      A/B Testing
    </h2>
    
    <p style={{ 
      fontSize: '18px', 
      marginBottom: '5px',
      color: '#666'
    }}>
      Testing: {currentTest.frequency} Hz
    </p>
    
    <p style={{ 
      fontSize: '16px', 
      color: '#666', 
      marginBottom: '30px' 
    }}>
      Test {responses.length + 1}
    </p>
    
    <div style={{
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
      marginBottom: '20px'
    }}>
      <button 
        onClick={() => playVariant('A')}
        style={{
          padding: '15px 40px',
          fontSize: '18px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontWeight: '500',
          minWidth: '140px'
        }}
      >
         Play A
      </button>
      <button 
        onClick={() => playVariant('B')}
        style={{
          padding: '15px 40px',
          fontSize: '18px',
          cursor: 'pointer',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontWeight: '500',
          minWidth: '140px'
        }}
      >
         Play B
      </button>
    </div>
 
    <div style={{
      padding: '15px',
      borderRadius: '6px',
      marginBottom: '30px'
    }}>
      <button 
        onClick={playRefSound}
        style={{
          padding: '10px 24px',
          fontSize: '14px',
          cursor: 'pointer',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontWeight: '500'
        }}
      >
        📻 Play Reference (1kHz Flat)
      </button>
    </div>
    
    <div style={{
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
      flexWrap: 'wrap'
    }}>
      <button 
        onClick={() => recordChoice('A')}
        style={{ 
          padding: '12px 24px', 
          cursor: 'pointer',
          fontSize: '16px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontWeight: '500',
          minWidth: '120px'
        }}
      >
        Prefer A
      </button>
      <button 
        onClick={() => recordChoice('B')}
        style={{ 
          padding: '12px 24px', 
          cursor: 'pointer',
          fontSize: '16px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontWeight: '500',
          minWidth: '120px'
        }}
      >
        Prefer B
      </button>
      <button 
        onClick={() => recordChoice('Same')}
        style={{ 
          padding: '12px 24px', 
          cursor: 'pointer',
          fontSize: '16px',
          backgroundColor: '#ffc107',
          color: '#000',
          border: 'none',
          borderRadius: '6px',
          fontWeight: '500',
          minWidth: '120px'
        }}
      >
        Can't Tell
      </button>
    </div>
  </div>
);
}
 
export default ABTest;