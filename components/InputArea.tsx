
import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, Image as ImageIcon, FileText } from 'lucide-react';
import { UserInput } from '../types';

interface InputAreaProps {
  onSendMessage: (input: UserInput) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !file) || isLoading) return;

    onSendMessage({ text, attachment: file });
    setText('');
    clearFile();
  };

  const isPdf = file?.type === 'application/pdf';

  return (
    <div className="border-t border-emerald-100 bg-white p-2 pb-4 md:p-4 md:pb-6 sticky bottom-0 z-40 safe-area-bottom">
      <div className="max-w-4xl mx-auto">
        
        {/* File Preview */}
        {preview && (
          <div className="mb-2 md:mb-3 flex items-center animate-slide-up">
            <div className="relative group">
              {isPdf ? (
                <div className="h-16 w-16 md:h-20 md:w-20 flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded-xl">
                  <FileText className="text-red-500 w-6 h-6 md:w-8 md:h-8 mb-1" />
                  <span className="text-[8px] md:text-[10px] text-red-700 font-medium truncate max-w-[90%] px-1">PDF</span>
                </div>
              ) : (
                <img 
                  src={preview} 
                  alt="Upload preview" 
                  className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-xl border border-emerald-200 shadow-sm" 
                />
              )}
              
              <button 
                onClick={clearFile}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
              >
                <X size={10} className="md:w-3 md:h-3" />
              </button>
            </div>
            <div className="ml-3 text-sm text-gray-500">
                <p className="font-medium text-gray-700 text-xs md:text-sm">
                  {file?.name || 'Medical Report Selected'}
                </p>
                <p className="text-[10px] md:text-xs">
                  {isPdf ? 'PDF Document' : 'Image File'} • Ready to analyze
                </p>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-gray-50 p-1.5 md:p-2 rounded-[24px] border border-gray-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all shadow-sm">
          
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 md:p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors flex-shrink-0"
            title="Upload Medical Report (Image or PDF)"
          >
            <Paperclip size={18} className="md:w-5 md:h-5" />
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            className="hidden"
          />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={file ? "Add a note..." : "Ask NutriGenie..."}
            className="w-full bg-transparent border-none focus:ring-0 p-2 md:p-3 max-h-24 md:max-h-32 min-h-[40px] md:min-h-[48px] resize-none text-gray-700 placeholder-gray-400 text-sm md:text-base"
            rows={1}
            style={{ minHeight: '40px' }}
          />

          <button 
            type="submit"
            disabled={(!text.trim() && !file) || isLoading}
            className={`p-2 md:p-3 rounded-full flex-shrink-0 transition-all duration-300 shadow-md flex items-center justify-center
              ${(!text.trim() && !file) || isLoading 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'}`}
          >
            <Send size={18} className={`md:w-5 md:h-5 ${isLoading ? 'animate-pulse' : ''}`} />
          </button>
        </form>
        
        <div className="text-center mt-1.5 md:mt-2">
            <p className="text-[10px] text-gray-400">
                AI can make mistakes. Consult a doctor for medical decisions.
            </p>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
