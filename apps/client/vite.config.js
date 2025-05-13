import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  // Verificar archivos .env existentes
  const envFiles = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), `.env.${mode}`),
    path.resolve(process.cwd(), `.env.${mode}.local`),
  ];

  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ Archivo ${path.basename(file)} encontrado`);
    }
  });
  
  // Cargar variables de entorno
  const env = {
    ...loadEnv(mode, process.cwd(), ''),
    ...loadEnv(mode, process.cwd(), 'VITE_')
  };
  
  console.log('Cargando configuración de Vite...');
  console.log('Modo:', mode);
  
  // Mostrar variables cargadas (solo nombres, no valores)
  const loadedVars = Object.keys(env).filter(key => key.startsWith('VITE_'));
  console.log('Variables cargadas:', loadedVars);
  
  // Verificación específica de variables de Supabase
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
  
  console.log('VITE_SUPABASE_URL está presente:', !!supabaseUrl);
  console.log('VITE_SUPABASE_ANON_KEY está presente:', !!supabaseKey);
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Faltan variables de Supabase. La autenticación no funcionará correctamente.');
  }
  
  return {
    // Definir variables de entorno como objeto para mayor control
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || ''),
    },
    plugins: [preact()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    css: {
      postcss: './postcss.config.js',
    },
  };
}); 