import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export const EnvWarning: FunctionComponent = () => {
  const [showWarning, setShowWarning] = useState(false);
  
  useEffect(() => {
    const checkEnvVars = () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || 
          supabaseUrl === 'https://your-project.supabase.co' || 
          supabaseKey === 'your-anon-key') {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };
    
    checkEnvVars();
  }, []);
  
  if (!showWarning) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-red-500 text-white p-4 text-center z-50">
      <p className="font-semibold">
        ⚠️ Faltan configurar las variables de entorno para Supabase. 
        Crea un archivo <code className="bg-red-600 p-1 rounded">.env</code> en la carpeta <code className="bg-red-600 p-1 rounded">apps/client</code> con los valores correctos.
      </p>
    </div>
  );
}; 