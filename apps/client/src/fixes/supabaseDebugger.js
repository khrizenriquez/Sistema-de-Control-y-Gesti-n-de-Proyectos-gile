/**
 * Herramienta de diagnóstico para Supabase
 * 
 * Este script evalúa la configuración de Supabase y verifica la conectividad.
 */

// Verificar variables de entorno
function checkEnvVariables() {
  console.group('🔍 Verificación de variables de entorno para Supabase');
  
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
  };
  
  // Verificar URL
  if (!envVars.VITE_SUPABASE_URL) {
    console.error('❌ VITE_SUPABASE_URL no está definida');
  } else {
    const isValidUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(envVars.VITE_SUPABASE_URL);
    if (isValidUrl) {
      console.log('✅ VITE_SUPABASE_URL tiene un formato válido:', 
        envVars.VITE_SUPABASE_URL.substring(0, 15) + '...');
    } else {
      console.error('❌ VITE_SUPABASE_URL no tiene el formato esperado. Debería ser como: https://proyecto.supabase.co');
    }
  }
  
  // Verificar clave anónima
  if (!envVars.VITE_SUPABASE_ANON_KEY) {
    console.error('❌ VITE_SUPABASE_ANON_KEY no está definida');
  } else if (envVars.VITE_SUPABASE_ANON_KEY.length < 30) {
    console.error('❌ VITE_SUPABASE_ANON_KEY parece demasiado corta para ser válida');
  } else {
    console.log('✅ VITE_SUPABASE_ANON_KEY tiene una longitud adecuada');
  }
  
  console.groupEnd();
  
  return {
    hasUrl: !!envVars.VITE_SUPABASE_URL,
    hasKey: !!envVars.VITE_SUPABASE_ANON_KEY
  };
}

// Verificar conectividad con Supabase
async function checkSupabaseConnectivity() {
  console.group('🔄 Verificación de conectividad con Supabase');
  
  try {
    // Verificar que el módulo de Supabase está disponible
    const { createClient } = await import('@supabase/supabase-js');
    
    // Obtener las variables de entorno
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ No se puede verificar la conectividad: faltan variables de entorno');
      console.groupEnd();
      return false;
    }
    
    // Crear un cliente para la prueba
    console.log('Creando cliente de Supabase para prueba...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Intentar obtener la sesión actual (una operación básica que no requiere autenticación)
    console.log('Verificando conexión con Supabase...');
    const { error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error al conectar con Supabase:', error.message);
      console.groupEnd();
      return false;
    }
    
    console.log('✅ Conexión con Supabase establecida correctamente');
    console.groupEnd();
    return true;
  } catch (err) {
    console.error('❌ Error al intentar verificar la conectividad:', err);
    console.groupEnd();
    return false;
  }
}

// Buscar cualquier instancia del mensaje "Login exitoso" en el DOM
function findLoginMessages() {
  console.group('🔍 Búsqueda de mensajes de "Login exitoso" en el DOM');
  
  const selectors = [
    'p', 'div', 'span', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    '.text-green-500', '.text-success', '[class*="success"]'
  ];
  
  let found = false;
  
  // Buscar en todos los elementos de texto
  document.querySelectorAll(selectors.join(', ')).forEach(el => {
    if (el.innerText && (
      el.innerText.includes("Login exitoso") || 
      el.innerText.includes("¡Login exitoso!")
    )) {
      console.warn('⚠️ Encontrado mensaje de login exitoso:', el);
      console.log('Texto:', el.innerText);
      console.log('Elemento:', el);
      found = true;
    }
  });
  
  if (!found) {
    console.log('✅ No se encontraron mensajes de "Login exitoso" en el DOM');
  }
  
  console.groupEnd();
  return found;
}

// Ejecutar todas las verificaciones
async function runDiagnostics() {
  console.group('🔧 DIAGNÓSTICO DE SUPABASE');
  console.log('Iniciando verificaciones de Supabase...');
  
  // Verificar variables de entorno
  const envCheck = checkEnvVariables();
  
  // Verificar conectividad
  const connectivityOk = await checkSupabaseConnectivity();
  
  // Buscar mensajes de login exitoso
  const hasLoginMessages = findLoginMessages();
  
  // Resultados
  console.group('📊 Resultados del diagnóstico');
  console.log(`Variables de entorno: ${envCheck.hasUrl && envCheck.hasKey ? '✅' : '❌'}`);
  console.log(`Conectividad con Supabase: ${connectivityOk ? '✅' : '❌'}`);
  console.log(`Mensajes de login exitoso en DOM: ${!hasLoginMessages ? '✅' : '❌'}`);
  console.groupEnd();
  
  console.log('Diagnóstico completo. Revisa la consola para detalles.');
  console.groupEnd();
}

// Ejecutar el diagnóstico
runDiagnostics();

// Exportar las funciones para usarlas en otros lugares
export {
  checkEnvVariables,
  checkSupabaseConnectivity,
  findLoginMessages,
  runDiagnostics
}; 