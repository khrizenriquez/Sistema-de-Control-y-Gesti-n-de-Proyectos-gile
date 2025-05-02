import { render } from 'preact'
import './style.css'
import { App } from './app'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'

// Importar los scripts que arreglan problemas
import './fixes/fixLoginMessage'
import './fixes/fixAuthentication' // Script para arreglar redirecciones
import './fixes/jwtDebugger' // Script para diagnosticar problemas JWT

render(
  <ThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>,
  document.getElementById('app') as HTMLElement
)
