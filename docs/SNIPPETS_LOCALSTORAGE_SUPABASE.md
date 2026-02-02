LocalStorage Usage Checker para Supabase

Este proyecto proporciona un script seguro para medir cuánto espacio de localStorage estás usando en tu aplicación web que utiliza Supabase, y estimar cuánto espacio libre queda.

Esto es útil para depurar problemas relacionados con tokens, sesiones y almacenamiento en el navegador.

Contexto

Supabase guarda tokens de autenticación (access_token, refresh_token) y sesiones en localStorage.

Cada navegador suele tener un límite aproximado de 5 MB por dominio.

Este script permite saber cuánto espacio estás usando y cuánto te queda disponible.

Script para medir localStorage

Puedes ejecutar este snippet directamente en la consola del navegador o como snippet en DevTools:

(function(){
  let total = 0;
  for (let key in localStorage) {
    if (!localStorage.hasOwnProperty(key)) continue;
    total += ((localStorage[key].length + key.length) * 2); // bytes
  }
  const usedMB = (total / 1024 / 1024).toFixed(2);
  console.log(`Approx localStorage used: ${usedMB} MB`);
  return usedMB;
})();

Cómo usarlo
Opción 1: Consola del navegador

Abre tu aplicación web en el navegador.

Abre DevTools (F12 o Ctrl+Shift+I) → pestaña Console.

Copia y pega el snippet anterior y presiona Enter.

La consola mostrará:

LocalStorage usado: X MB

Espacio libre estimado: Y MB

Opción 2: Snippet en DevTools

Abre DevTools → Sources → Snippets → New Snippet.

Pega el snippet en el nuevo snippet.

Haz click en Run.

Verás los resultados en la consola.

Notas

El límite de 5 MB es aproximado y puede variar según navegador y versión.

Este script no modifica nada en tu localStorage.

Ideal para debug de tokens, sesiones y almacenamiento usado por Supabase.
