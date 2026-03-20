// app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header/Navegación */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-600">JugadaPlay</h1>
          <div className="space-x-4">
            <button className="text-gray-600 hover:text-gray-900">
              Iniciar Sesión
            </button>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Registrar Bar
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section (la parte principal) */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-green-600">🏆 LA EMOCIÓN DEL DEPORTE</span>
            <br />
            EN TU BAR ⚽
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Tus clientes predicen el marcador y ganan dinero
          </p>
          <div className="space-x-4">
            <button className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700">
              QUIERO PARA MI BAR
            </button>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700">
              QUIERO JUGAR
            </button>
          </div>
        </div>
      </section>

      {/* Footer básico */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          © 2026 JugadaPlay. Todos los derechos reservados.
        </div>
      </footer>
    </main>
  );
}