import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const Disclaimer: React.FC = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-100 p-3 relative animate-fade-in">
      <div className="max-w-4xl mx-auto flex items-start gap-3 pr-8">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Medical Disclaimer:</strong> This application uses Artificial Intelligence to provide general dietary suggestions based on your inputs. It is not a substitute for professional medical diagnosis, treatment, or advice. Always consult with a qualified healthcare provider regarding any medical condition.
        </p>
      </div>
      <button 
        onClick={() => setVisible(false)}
        className="absolute top-2 right-2 text-amber-400 hover:text-amber-700 p-1"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Disclaimer;
