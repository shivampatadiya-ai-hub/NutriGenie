import React from 'react';
import { Leaf, Activity, MessageSquarePlus, Download } from 'lucide-react';

interface HeaderProps {
  onNewChat: () => void;
  onDownload: () => void;
  showActions: boolean;
}

const Header: React.FC<HeaderProps> = ({ onNewChat, onDownload, showActions }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-emerald-100 shadow-sm transition-all duration-300">
      <div className="max-w-4xl mx-auto px-3 py-2 md:px-4 md:py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-100 p-1.5 md:p-2 rounded-lg">
            <Leaf className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">NutriGenie</h1>
            <p className="text-[10px] md:text-xs text-emerald-600 font-medium leading-none">AI Dietitian Expert</p>
          </div>
        </div>

        {showActions ? (
          <div className="flex items-center space-x-2 animate-fade-in">
            <button 
              onClick={onDownload}
              className="flex items-center space-x-1 px-2 py-1.5 md:px-3 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors text-xs md:text-sm font-medium"
              title="Download PDF Report"
            >
              <Download size={14} className="md:w-4 md:h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button 
              onClick={onNewChat}
              className="flex items-center space-x-1 px-2 py-1.5 md:px-3 rounded-lg text-white bg-gray-800 hover:bg-gray-700 transition-all text-xs md:text-sm font-medium shadow-sm"
              title="Start New Chat"
            >
              <MessageSquarePlus size={14} className="md:w-4 md:h-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-500">
             <div className="flex items-center space-x-1">
               <Activity className="w-4 h-4 text-emerald-500" />
               <span>Medical Analysis</span>
             </div>
             <div className="w-px h-4 bg-gray-300"></div>
             <span>Personalized Plans</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;