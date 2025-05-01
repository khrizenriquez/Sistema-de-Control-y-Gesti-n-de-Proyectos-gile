import { render } from 'preact'
import './style.css'
import { App } from './app'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'

render(
  <ThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>,
  document.getElementById('app')!
)
