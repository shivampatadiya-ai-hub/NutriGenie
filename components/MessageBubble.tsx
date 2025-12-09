
import React, { useState } from 'react';
import { Sender, Message } from '../types';
import { Bot, User, FileImage, Copy, Check, FileText } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Sender.USER;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple formatter for markdown-like text (bolding and lists)
  const formatText = (text: string) => {
    // 1. Handle bolding (**text**)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-emerald-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderContent = (text: string) => {
      const lines = text.split('\n');
      return lines.map((line, i) => {
          // List items
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
             return (
                 <div key={i} className="flex items-start ml-2 mb-1">
                     <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                     <span>{formatText(line.replace(/^[-*]\s+/, ''))}</span>
                 </div>
             )
          }
          // Numbered lists
          if (/^\d+\.\s/.test(line.trim())) {
             return <div key={i} className="ml-2 mb-1">{formatText(line)}</div>;
          }
          // Empty lines
          if (line.trim() === '') {
              return <div key={i} className="h-2"></div>;
          }
          return <div key={i} className="mb-1">{formatText(line)}</div>;
      });
  };

  return (
    <div className={`flex w-full mb-4 md:mb-6 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center mx-1 md:mx-2 shadow-sm
          ${isUser ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {isUser ? <User size={14} className="md:w-[18px] md:h-[18px]" /> : <Bot size={14} className="md:w-[18px] md:h-[18px]" />}
        </div>

        {/* Bubble Container (Relative for positioning copy button) */}
        <div className="relative">
          {/* Bubble */}
          <div className={`flex flex-col p-3 md:p-4 rounded-2xl shadow-sm border
            ${isUser 
              ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-blue-600 rounded-tr-none' 
              : 'bg-white text-gray-800 border-gray-100 rounded-tl-none'}`}>
            
            {/* Attachment Preview */}
            {message.hasAttachment && message.attachmentData && (
              <div className="mb-2 md:mb-3 rounded-lg overflow-hidden border border-white/20">
                 <div className="bg-black/10 p-1.5 md:p-2 flex items-center space-x-2 text-xs text-white/90">
                    {message.attachmentType === 'pdf' ? <FileText size={12} className="md:w-[14px] md:h-[14px]" /> : <FileImage size={12} className="md:w-[14px] md:h-[14px]" />}
                    <span>{message.attachmentType === 'pdf' ? 'PDF Document' : 'Medical Image'}</span>
                 </div>
                 
                 {message.attachmentType === 'pdf' ? (
                   <div className="bg-white/10 p-3 md:p-4 flex flex-col items-center justify-center text-center">
                     <FileText size={32} className="md:w-[48px] md:h-[48px] text-white/80 mb-2" />
                     <span className="text-[10px] md:text-xs text-white/90 truncate max-w-full px-2">
                       {message.attachmentName || "Document.pdf"}
                     </span>
                   </div>
                 ) : (
                   <img 
                     src={message.attachmentData} 
                     alt="Attached report" 
                     className="max-h-32 md:max-h-48 w-full object-cover"
                   />
                 )}
              </div>
            )}

            {/* Text Content */}
            <div className={`text-sm leading-relaxed markdown-body ${isUser ? 'text-white' : 'text-gray-700'}`}>
               {isUser ? message.text : renderContent(message.text)}
            </div>
            
            {/* Timestamp */}
            <div className={`text-[10px] mt-1 md:mt-2 text-right ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
               {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Copy Button (Only for Model) */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute -bottom-6 right-0 p-1.5 text-gray-400 hover:text-emerald-600 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center gap-1 text-xs"
              title="Copy response"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default MessageBubble;
