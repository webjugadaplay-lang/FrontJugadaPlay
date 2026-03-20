// app/entrar/page.tsx
import Link from 'next/link';

export default function EntrarSala() {
  return (
    <main className="min-h-screen bg-gray-100 p-4">
      {/* Simulamos una pantalla de celular */}
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">

        {/* Header de la sala */}
        <div className="bg-green-600 text-white p-4">
          <h1 className="text-xl font-bold">ENTRAR A UNA SALA</h1>
        </div>

        {/* Contenido principal */}
        <div className="p-6 space-y-6">

          {/* Instrucción */}
          <p className="text-gray-600 text-center">
            Escanea el código QR del bar o ingresa el código manualmente
          </p>

          {/* Botón de cámara (simulado) */}
          <button className="w-full bg-gray-200 p-8 rounded-lg flex flex-col items-center">
            <span className="text-4xl mb-2">📷</span>
            <span className="text-gray-600">ESCANEAR QR</span>
          </button>

          {/* Separador "o" */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500">o</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Input manual */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Código de la sala
            </label>
            <input
              type="text"
              placeholder="Ej: FX27"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Botón de ingresar */}
          <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700">
            INGRESAR A LA SALA
          </button>

          {/* Link para volver */}
          <Link href="/">
            <button className="w-full text-gray-500 text-sm hover:text-gray-700">
              ← Volver al inicio
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}