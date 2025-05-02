/**
 * Script para eliminar y/o prevenir el mensaje erróneo "¡Login exitoso!"
 * 
 * Este script identifica y elimina cualquier elemento DOM que muestre un mensaje 
 * incorrecto de inicio de sesión exitoso cuando no debería.
 */

// Función para eliminar o desactivar el mensaje de login exitoso
function removeLoginSuccessMessage() {
  console.log("Buscando mensajes de login exitoso para eliminar...");
  
  // Buscar en todos los elementos de texto que puedan contener el mensaje
  const selectors = [
    'p', 'div', 'span', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    '.text-green-500', '.text-success', '[class*="success"]'
  ];
  
  // Buscar elementos con el texto
  document.querySelectorAll(selectors.join(', ')).forEach(el => {
    if (el.innerText && (
      el.innerText.includes("Login exitoso") || 
      el.innerText.includes("¡Login exitoso!") ||
      el.innerText.trim() === "¡Login exitoso!"
    )) {
      console.warn("Encontrado mensaje de login exitoso incorrecto:", el);
      
      // Guardar el elemento padre para verificar después
      const parent = el.parentElement;
      
      // Intentar diferentes métodos para eliminar o desactivar el elemento
      try {
        // Método 1: Ocultar el elemento
        el.style.display = 'none';
      } catch (e) {}
      
      try {
        // Método 2: Establecer opacidad a cero
        el.style.opacity = '0';
      } catch (e) {}
      
      try {
        // Método 3: Vaciar el contenido
        el.innerHTML = '';
      } catch (e) {}
      
      try {
        // Método 4: Establecer visibilidad oculta
        el.style.visibility = 'hidden';
      } catch (e) {}
      
      // Método 5: Reemplazar con un elemento vacío si los anteriores fallan
      if (parent && (el.innerText.includes("Login exitoso") || el.innerText.includes("¡Login exitoso!"))) {
        try {
          const emptyEl = document.createElement('span');
          parent.replaceChild(emptyEl, el);
        } catch (e) {}
      }
    }
  });
  
  // Buscar también estilos CSS que podrían estar usando pseudo-elementos para mostrar el mensaje
  const styleSheets = document.styleSheets;
  try {
    for (let i = 0; i < styleSheets.length; i++) {
      const sheet = styleSheets[i];
      const rules = sheet.cssRules || sheet.rules;
      if (!rules) continue;
      
      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j];
        if (rule.selectorText && 
            (rule.selectorText.includes(":before") || rule.selectorText.includes(":after"))) {
          const content = rule.style.content;
          if (content && 
              (content.includes("Login exitoso") || content.includes("¡Login exitoso!"))) {
            console.warn("Encontrado mensaje de login en CSS:", rule);
            try {
              rule.style.content = "none";
            } catch (e) {}
          }
        }
      }
    }
  } catch (e) {
    console.warn("Error al analizar hojas de estilo:", e);
  }
  
  console.log("Búsqueda de mensajes incorrectos completada");
}

// Ejecutar la función inmediatamente
removeLoginSuccessMessage();

// También ejecutar cuando cambie el DOM (para detectar mensajes que se agreguen dinámicamente)
const observer = new MutationObserver((mutations) => {
  removeLoginSuccessMessage();
});

// Iniciar la observación del DOM
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true
});

// Ejecutar periódicamente para mayor seguridad
setInterval(removeLoginSuccessMessage, 1000);

// Exportar la función para usarla en otros lugares si es necesario
export default removeLoginSuccessMessage; 