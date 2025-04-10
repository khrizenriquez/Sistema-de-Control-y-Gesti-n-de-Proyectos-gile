import { render } from 'preact'
import './style.css'
import { App } from './app'
import { ThemeProvider } from './context/ThemeContext'

render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
  document.getElementById('app')!
)
