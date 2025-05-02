/**
 * Authentication and Redirection Fix Script
 * 
 * This script helps diagnose and fix issues with authentication and redirection
 * in the application. It works by verifying the authentication state, debugging
 * the routing system, and manually performing navigation when needed.
 */

import { supabase } from '../infrastructure/services/supabase';

// Verify user session and authentication state
async function checkAuthState() {
  console.group('🔑 Verificación del estado de autenticación');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error al obtener sesión:', error.message);
      return false;
    }
    
    if (data.session) {
      console.log('✅ Usuario autenticado:', {
        id: data.session.user.id,
        email: data.session.user.email,
        expires: new Date(data.session.expires_at * 1000).toLocaleString()
      });
      return true;
    } else {
      console.log('❌ No hay sesión de usuario activa');
      return false;
    }
  } catch (err) {
    console.error('❌ Error al verificar estado de autenticación:', err);
    return false;
  } finally {
    console.groupEnd();
  }
}

// Debug the routing system
function debugRouting() {
  console.group('🧭 Depuración del sistema de rutas');
  
  try {
    // Check current location
    console.log('Ubicación actual:', window.location.pathname);
    
    // Log history state
    console.log('Estado del historial:', history.state);
    
    // Verify router hooks are working
    if (typeof window.__WOUTER_EMITTER === 'object') {
      console.log('✅ Hook de Router (wouter) detectado');
    } else {
      console.warn('⚠️ No se detecta el hook de router de wouter-preact');
    }
    
    // Check any navigation interceptors
    if (window.onbeforeunload || window.onpopstate) {
      console.warn('⚠️ Detectados interceptores de navegación que podrían interferir con las redirecciones');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error al depurar sistema de rutas:', err);
    return false;
  } finally {
    console.groupEnd();
  }
}

// Force navigation to specified route
function forceNavigation(route = '/dashboard') {
  console.group('🚀 Forzando navegación a ' + route);
  
  try {
    // Try programmatic navigation methods
    console.log('Intentando diferentes métodos de navegación...');
    
    // Method 1: Using window.location (most reliable)
    window.location.href = route;
    console.log('✅ Navegación iniciada utilizando window.location');
    
    // Fallback methods (these won't execute if location.href works)
    setTimeout(() => {
      console.log('⚠️ La redirección directa no funcionó, intentando fallbacks...');
      
      // Method 2: Using history API
      history.pushState({}, "", route);
      window.dispatchEvent(new PopStateEvent('popstate'));
      console.log('Intento de navegación con history API completado');
      
      // Method 3: Click a generated link (last resort)
      const link = document.createElement('a');
      link.href = route;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Intento de navegación con link programático completado');
    }, 2000); // Wait 2 seconds before trying fallbacks
    
    return true;
  } catch (err) {
    console.error('❌ Error al forzar navegación:', err);
    return false;
  } finally {
    console.groupEnd();
  }
}

// Fix authentication redirect issues
async function fixAuthRedirect() {
  console.group('🔧 Arreglando problemas de redirección de autenticación');
  
  try {
    // Check if we're already on the dashboard
    if (window.location.pathname === '/dashboard') {
      console.log('✅ Ya estás en el dashboard, no es necesario redirigir');
      return true;
    }
    
    // Check authentication state
    const isAuthenticated = await checkAuthState();
    
    if (isAuthenticated) {
      console.log('Usuario autenticado, intentando redirección al dashboard...');
      debugRouting();
      forceNavigation('/dashboard');
      return true;
    } else {
      console.log('❌ Usuario no autenticado, no se puede redirigir al dashboard');
      return false;
    }
  } catch (err) {
    console.error('❌ Error al arreglar la redirección de autenticación:', err);
    return false;
  } finally {
    console.groupEnd();
  }
}

// Add a fix button to the UI
function addFixButton() {
  const existingButton = document.getElementById('fix-redirect-btn');
  if (existingButton) {
    console.log('Botón de arreglo ya existe en el DOM');
    return;
  }
  
  const button = document.createElement('button');
  button.id = 'fix-redirect-btn';
  button.innerText = 'Forzar redirección al Dashboard';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.style.padding = '10px 15px';
  button.style.backgroundColor = '#3b82f6';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  
  button.addEventListener('click', () => {
    fixAuthRedirect();
  });
  
  document.body.appendChild(button);
  console.log('✅ Botón de arreglo de redirección añadido a la UI');
}

// Run the fix
(async function() {
  console.log('🔧 Iniciando script de arreglo de autenticación y redirección');
  
  // Automatically run when authenticated user loads the login page
  if (window.location.pathname === '/' || window.location.pathname === '/login') {
    setTimeout(async () => {
      const isAuthenticated = await checkAuthState();
      if (isAuthenticated) {
        console.log('Usuario ya autenticado en página de login, redirigiendo al dashboard...');
        fixAuthRedirect();
      }
    }, 1000);
  }
  
  // Add a fix button to any page
  addFixButton();
  
  // Listen for authentication events
  const authListener = supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Cambio en el estado de autenticación:', event);
    
    if (event === 'SIGNED_IN' && session) {
      console.log('Usuario recién autenticado, intentando redirección...');
      setTimeout(() => {
        fixAuthRedirect();
      }, 500);
    }
  });
  
  // Return cleanup function
  return () => {
    authListener.data.subscription.unsubscribe();
  };
})();

// Export functions
export {
  checkAuthState,
  debugRouting,
  forceNavigation,
  fixAuthRedirect
}; 