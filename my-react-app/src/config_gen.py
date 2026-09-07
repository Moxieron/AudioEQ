class config_gen:
    def generate_config(self, eq_curve):

        lines = []
        lines.append("Preamp: -6 dB")
        lines.append("Personal Eq")
        lines.append("")
        
        for band in eq_curve:
            if abs(band['gain']) > 0.5: 
                lines.append(
                    f"Filter: ON PK Fc {band['frequency']} Hz "
                    f"Gain {band['gain']:.1f} dB Q 1.0"
                )
        
        return '\n'.join(lines)
    
    def generate_markdown_report(self, eq_curve):
        lines = []
        lines.append("EQ Profile\n")
        
        for band in eq_curve:
            freq = band['frequency']
            gain = band['gain']
            conf = band.get('confidence', 'unknown')
            
            if abs(gain) > 0.5:
                lines.append(f"- **{freq} Hz**: {gain:+.1f} dB (confidence: {conf})")
        
        return '\n'.join(lines)
    