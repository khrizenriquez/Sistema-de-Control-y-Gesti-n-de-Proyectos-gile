import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export const DebugToast: FunctionComponent = () => {
  const [messages, setMessages] = useState<Array<{ text: string; time: Date }>>([]);
  
  // Sobrescribe el console.log para capturar mensajes relevantes
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    console.log = function(...args) {
      originalConsoleLog.apply(console, args);
      
      // Solo capturar mensajes relacionados con autenticación
      const message = args.join(' ');
      if (message.includes('login') || message.includes('Login') || 
          message.includes('auth') || message.includes('Supabase')) {
        setMessages(prev => [...prev, { text: message, time: new Date() }]);
      }
    };
    
    console.error = function(...args) {
      originalConsoleError.apply(console, args);
      
      // Capturar todos los errores
      const message = args.join(' ');
      setMessages(prev => [...prev, { text: `ERROR: ${message}`, time: new Date() }]);
    };
    
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);
  
  // Limitar a los últimos 10 mensajes
  const recentMessages = messages.slice(-10);
  
  if (recentMessages.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 right-0 bg-gray-800 text-white p-4 m-4 rounded-lg z-50 max-w-md w-full opacity-80 hover:opacity-100 transition-opacity">
      <h3 className="text-lg font-bold mb-2">Debug de Autenticación</h3>
      <ul className="text-xs space-y-1 max-h-60 overflow-auto">
        {recentMessages.map((msg, index) => (
          <li key={index} className="border-b border-gray-700 pb-1">
            <span className="text-gray-400">{msg.time.toLocaleTimeString()}: </span>
            {msg.text}
          </li>
        ))}
      </ul>
      <button 
        onClick={() => setMessages([])}
        className="mt-2 bg-red-600 text-white px-2 py-1 rounded text-xs"
      >
        Limpiar
      </button>
    </div>
  );
}; 