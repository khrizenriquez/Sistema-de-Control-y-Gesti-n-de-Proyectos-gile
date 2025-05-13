import { FunctionComponent } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export const EnvWarning: FunctionComponent = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [envStatus, setEnvStatus] = useState({
    supabaseUrl: '',
    hasUrl: false,
    hasKey: false
  });
  
  useEffect(() => {
    const checkEnvVars = () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      setEnvStatus({
        supabaseUrl: supabaseUrl || '',
        hasUrl: !!supabaseUrl && supabaseUrl.trim() !== '',
        hasKey: !!supabaseKey && supabaseKey.trim() !== ''
      });
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl.trim() === '' || supabaseKey.trim() === '') {
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
      <div className="max-w-4xl mx-auto">
        <h3 className="font-bold text-lg mb-1">⚠️ Configuración de Supabase Incompleta</h3>
        
        <p className="mb-2">
          Para usar la autenticación con Supabase, debes configurar las siguientes variables de entorno:
        </p>
        
        <ul className="flex flex-col md:flex-row justify-center space-y-2 md:space-y-0 md:space-x-4 mb-3 text-sm">
          <li className={`px-3 py-1 rounded-full ${envStatus.hasUrl ? 'bg-green-500' : 'bg-red-600'}`}>
            VITE_SUPABASE_URL {envStatus.hasUrl ? '✓' : '✗'}
          </li>
          <li className={`px-3 py-1 rounded-full ${envStatus.hasKey ? 'bg-green-500' : 'bg-red-600'}`}>
            VITE_SUPABASE_ANON_KEY {envStatus.hasKey ? '✓' : '✗'}
          </li>
        </ul>
        
        <div className="text-sm bg-red-600 p-3 rounded mb-3 inline-block text-left">
          <p className="mb-1 font-bold">Para solucionarlo, sigue estos pasos:</p>
          <ol className="list-decimal list-inside">
            <li>Crea un archivo <code className="font-bold">.env</code> en la carpeta <code className="font-bold">apps/client</code></li>
            <li>Añade las siguientes líneas:</li>
            <code className="block bg-red-700 p-2 rounded my-1">
              VITE_SUPABASE_URL=https://tu-proyecto.supabase.co<br />
              VITE_SUPABASE_ANON_KEY=tu-clave-anon
            </code>
            <li>Reinicia la aplicación</li>
          </ol>
        </div>
        
        <p className="text-sm opacity-90">
          Si estás utilizando contenedores, asegúrate de montar el archivo .env en el contenedor
        </p>
      </div>
    </div>
  );
}; 