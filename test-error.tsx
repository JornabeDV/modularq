// Este archivo tiene un error intencional para probar las validaciones
const testError = "Este es un string";
const number: number = testError; // Error: no se puede asignar string a number

export default function TestComponent() {
  return (
    <div>
      <h1>Test de Validaciones</h1>
      <p>Este componente tiene errores de TypeScript</p>
    </div>
  );
}
