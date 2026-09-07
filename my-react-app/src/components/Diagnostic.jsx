import { useState } from "react";

function DiagnosticRound({ onComplete }) { 
  const [currentBand, setCurrentBand] = useState(0);
  const [responses, setResponses] = useState({}); 
  const [clearMessage, setClearMessage] = useState("");

  const bands = [
    { freq: 60, name: 'Bass' },
    { freq: 200, name: 'Low Mids' },
    { freq: 1000, name: 'Mids' },
    { freq: 4000, name: 'Presence' },
    { freq: 10000, name: 'Treble' }
  ];

  const playBand = async () => {
    const freq = bands[currentBand].freq;

    const response = await fetch('http://localhost:5000/api/generate-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frequency: freq, boost_db: 0, variant: 'A' })
    });

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const audio = new Audio(objectUrl);
    
    audio.onended = () => {
      URL.revokeObjectURL(objectUrl);
    };

    audio.play();
  };

  const recordRating = (rating) => {
    const freq = bands[currentBand].freq;
    
    const newResponses = {
      ...responses,
      [freq]: rating
    };

    setResponses(newResponses);

    if (currentBand < bands.length - 1) {
      setCurrentBand(currentBand + 1);
    } else {
      onComplete(newResponses);
    }
  };
  const ml_Clear = async() =>{
    setClearMessage("Attempting to clear")
      const response = await fetch('http://localhost:5000/api/clear-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
    if(data.status === 'success'){
      setClearMessage("Cleared");

      setResponses({});
      setCurrentBand(0);
    } else{
      setClearMessage("Failed");
    }

    setTimeout(() => setClearMessage(""), 2000);


  }

return (
  <div className="diagnostic-round" style={{
    maxWidth: '600px',
    margin: '0 auto',
    padding: '40px 20px',
    textAlign: 'center'
  }}>
    <h2 style={{
      fontSize: '28px',
      marginBottom: '10px'
    }}>
      Diagnostic Round
    </h2>
    
    <p style={{ 
      fontSize: '18px', 
      marginBottom: '30px',
      color: '#666'
    }}>
      Band {currentBand + 1} of {bands.length}: {bands[currentBand].name}
    </p>
    
    <button 
      onClick={playBand}
      style={{
        padding: '15px 40px',
        fontSize: '18px',
        marginBottom: '30px',
        width: '100%',
        maxWidth: '300px',
        cursor: 'pointer',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontWeight: '500'
      }}
    >
      🔊 Play Sound
    </button>
    
    <div style={{
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
      marginBottom: '40px',
      flexWrap: 'wrap'
    }}>
      <button 
        onClick={() => recordRating('low')}
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
        Too Quiet
      </button>
      <button 
        onClick={() => recordRating('good')}
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
        About Right
      </button>
      <button 
        onClick={() => recordRating('high')}
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
        Too Loud
      </button>
    </div>
    
    <div style={{
      borderTop: '1px solid #ddd',
      paddingTop: '30px',
      marginTop: '20px'
    }}>
      <button 
        onClick={ml_Clear}
        style={{
          fontSize: '14px',
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '500'
        }}
      >
        Clear Training Data
      </button>
      {clearMessage && (
        <p style={{ 
          marginTop: '15px',
          padding: '10px',
          backgroundColor: clearMessage.includes('✓') ? '#d4edda' : '#f8d7da',
          color: clearMessage.includes('✓') ? '#155724' : '#721c24',
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          {clearMessage}
        </p>
      )}
    </div>
  </div>
);
}

export default DiagnosticRound;