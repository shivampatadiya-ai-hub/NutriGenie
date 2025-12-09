
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import Disclaimer from './components/Disclaimer';
import { Message, Sender, UserInput, DietaryPreference } from './types';
import { geminiService } from './services/geminiService';
import { Sparkles, Utensils, Egg, Beef } from 'lucide-react';
import { jsPDF } from "jspdf";

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>('Non-Vegetarian');
  
  // Ref to track the current chat session ID to prevent race conditions
  // (e.g., getting a response for an old chat after clicking restart)
  const chatIdRef = useRef(Date.now());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sync preference with service whenever it changes
  useEffect(() => {
    geminiService.setDietaryPreference(dietaryPreference);
  }, [dietaryPreference]);

  const handleNewChat = () => {
    // Resetting state immediately without confirmation for better UX
    setMessages([]);
    setSessionStarted(false);
    setIsLoading(false);
    
    // Update chat ID to invalidate any pending AI responses
    chatIdRef.current = Date.now();
    
    // Reset the AI service session
    geminiService.reset();
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let y = 20;

      // Header
      doc.setFontSize(22);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text("NutriGenie Plan", margin, y);
      y += 10;
      
      doc.setFontSize(12);
      doc.setTextColor(55, 65, 81); // gray-700
      doc.text(`Preference: ${dietaryPreference}`, margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); // gray-500
      doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, y);
      y += 15;

      doc.setDrawColor(209, 213, 219); // gray-300
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Content Loop
      messages.forEach((msg) => {
          // Page break check (approximate)
          if (y > pageHeight - 30) {
              doc.addPage();
              y = 20;
          }

          // Role Label
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          if (msg.role === Sender.USER) {
              doc.setTextColor(79, 70, 229); // indigo-600
              doc.text("You:", margin, y);
          } else {
              doc.setTextColor(5, 150, 105); // emerald-600
              doc.text("NutriGenie:", margin, y);
          }
          y += 6;

          // Message Body
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(31, 41, 55); // gray-800
          
          // Enhanced Markdown stripping for cleaner PDF text
          const cleanText = msg.text
            .replace(/\*\*/g, '')            // Remove bold markers
            .replace(/^\s*[\*\-]\s+/gm, '')  // Remove bullet points (* or -) at start of lines
            .replace(/#{1,6}\s?/g, '')       // Remove headers
            .replace(/\n\n/g, '\n');         // Normalize newlines
          
          const lines = doc.splitTextToSize(cleanText, maxWidth);
          
          // Check if block fits
          if (y + (lines.length * 5) > pageHeight - 20) {
              doc.addPage();
              y = 20;
          }

          doc.text(lines, margin, y);
          y += (lines.length * 5) + 12; // Spacing after message
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(156, 163, 175);
          doc.text(`Page ${i} of ${pageCount} - NutriGenie AI Dietitian`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      doc.save('NutriGenie-Diet-Plan.pdf');
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleSendMessage = async (input: UserInput) => {
    if (!input.text && !input.attachment) return;

    // Store the chat ID at the start of the request
    const currentChatId = chatIdRef.current;

    setSessionStarted(true);
    setIsLoading(true);

    let attachmentDataURL: string | undefined;
    if (input.attachment) {
      try {
        attachmentDataURL = await import('./services/geminiService').then(m => m.geminiService.constructor['fileToBase64'](input.attachment!));
      } catch (e) {
        console.error("Error processing file", e);
      }
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: Sender.USER,
      text: input.text || (input.attachment ? "Analyze this medical report" : ""),
      timestamp: Date.now(),
      hasAttachment: !!input.attachment,
      attachmentType: input.attachment?.type === 'application/pdf' ? 'pdf' : 'image',
      attachmentData: attachmentDataURL,
      attachmentName: input.attachment?.name,
    };

    setMessages(prev => [...prev, newMessage]);

    try {
      const responseText = await geminiService.sendMessage(newMessage.text, attachmentDataURL);
      
      // If the chat ID has changed (user clicked New Chat), ignore this response
      if (chatIdRef.current !== currentChatId) {
        return;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Sender.MODEL,
        text: responseText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      // If the chat ID has changed, ignore the error
      if (chatIdRef.current !== currentChatId) return;

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Sender.MODEL,
        text: "I'm having trouble connecting to the service right now. Please check your internet connection or API key and try again.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Only turn off loading if we are still in the same chat session
      if (chatIdRef.current === currentChatId) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-900">
      <Header 
        onNewChat={handleNewChat} 
        onDownload={handleDownloadPDF} 
        showActions={sessionStarted && messages.length > 0} 
      />
      <Disclaimer />

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto relative scrollbar-hide">
        <div className="max-w-4xl mx-auto px-3 py-4 md:px-4 md:py-8">
          
          {!sessionStarted && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] md:min-h-[60vh] text-center animate-slide-up">
              <div className="bg-emerald-100 p-4 md:p-6 rounded-full mb-4 md:mb-6 animate-pulse-slow">
                <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Namaste! How can I help your health today?
              </h2>
              <p className="text-gray-500 max-w-md mb-6 md:mb-8 text-sm md:text-base px-2">
                I can suggest Indian meal plans, or analyze medical reports (PDF/Images) to give personalized advice using local foods.
              </p>

              {/* Dietary Preference Selection */}
              <div className="w-full max-w-lg mb-6 md:mb-8 bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-emerald-50">
                <p className="text-xs md:text-sm font-semibold text-gray-700 mb-3 text-left">Select your dietary preference:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDietaryPreference('Vegetarian')}
                    className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 px-2 md:py-3 md:px-4 rounded-xl transition-all font-medium text-xs md:text-sm border
                      ${dietaryPreference === 'Vegetarian' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'}`}
                  >
                    <Utensils size={14} className="md:w-4 md:h-4" />
                    Vegetarian
                  </button>
                  <button
                    onClick={() => setDietaryPreference('Eggetarian')}
                    className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 px-2 md:py-3 md:px-4 rounded-xl transition-all font-medium text-xs md:text-sm border
                      ${dietaryPreference === 'Eggetarian' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'}`}
                  >
                    <Egg size={14} className="md:w-4 md:h-4" />
                    Eggetarian
                  </button>
                  <button
                    onClick={() => setDietaryPreference('Non-Vegetarian')}
                    className={`flex-1 flex items-center justify-center gap-1.5 md:gap-2 py-2 px-2 md:py-3 md:px-4 rounded-xl transition-all font-medium text-xs md:text-sm border
                      ${dietaryPreference === 'Non-Vegetarian' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'}`}
                  >
                    <Beef size={14} className="md:w-4 md:h-4" />
                    Non-Veg
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-lg">
                <button 
                  onClick={() => handleSendMessage({ text: "Suggest a 7-day Indian diet plan for weight loss", attachment: null })}
                  className="p-3 md:p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all text-left group"
                >
                  <span className="font-semibold text-gray-700 block mb-1 text-sm md:text-base group-hover:text-emerald-600">Weight Loss (Indian)</span>
                  <span className="text-xs text-gray-400">Roti, Dal, and Rice based plan</span>
                </button>
                <button 
                   onClick={() => handleSendMessage({ text: "I have high sugar levels (Diabetes). What Indian foods should I avoid?", attachment: null })}
                   className="p-3 md:p-4 bg-white border border-gray-200 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all text-left group"
                >
                  <span className="font-semibold text-gray-700 block mb-1 text-sm md:text-base group-hover:text-emerald-600">Manage Diabetes</span>
                  <span className="text-xs text-gray-400">Tips for Indian breakfasts & dinners</span>
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center space-x-2 p-4 animate-pulse">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              <span className="text-xs text-emerald-600 font-medium">NutriGenie is thinking...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;
