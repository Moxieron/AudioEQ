import { useState, useEffect } from "react";

function Results({ eqCurve }) {
  const [config, setConfig] = useState("");

  useEffect(() => {
    fetch('http://localhost:5000/api/get-eq-curve')
      .then(res => res.json())
      .then(data => setConfig(data.config))
      .catch(err => console.error("Failed to fetch config:", err)); 
  }, []);

  const downloadConfig = () => {
    const blob = new Blob([config], { type: 'text/plain' }); 
    
    const url = URL.createObjectURL(blob); 
    const a = document.createElement("a");

    a.href = url;
    a.download = "eq_config.txt"; 
   document.body.appendChild(a);
    
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
    
  return (
    <div className="results">
      <h2>EQ Curve</h2>
      
      <div className="eq-curve">
        {eqCurve && eqCurve.map((band, idx) => (
          <div key={idx} className="eq-band">
            <span>{band.frequency} Hz</span>
            <span>
              {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)} dB
            </span>
            {band.confidence && (
              <span className="confidence"> ({band.confidence})</span>
            )}
          </div>
        ))}
      </div>

      <h3>Equalizer APO Configuration</h3>
      
      {config ? (
        <>
          <pre className="config-preview">{config}</pre>
          <button onClick={downloadConfig}>Download Config File</button>
        </>
      ) : (
        <p>Loading configuration...</p>
      )}
      
      <div className="instructions">
        <h4>Conifg Usage:</h4>
        <ol>
          <li>Install Equalizer APO (if not already installed)</li>
          <li>Replace the config file with downloaded file</li>
          <li>Restart your audio or reboot</li>
        </ol>
      </div>
    </div>
  );
}

export default Results;