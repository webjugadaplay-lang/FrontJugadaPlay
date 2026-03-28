// app/entrar/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Crown } from "lucide-react";
import EntrarForm from "./EntrarForm";

export default function EntrarPage() {
  return (
    <main className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-2 group">
              <Crown className="w-5 h-5 text-yellow-500 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
              <span className="text-sm font-light tracking-wider text-white">
                JUGADA<span className="text-yellow-500 font-medium">PLAY</span>
              </span>
            </Link>
            <button className="text-gray-600 text-xs tracking-wider hover:text-yellow-500 transition-colors">
              ¿NECESITAS AYUDA?
            </button>
          </div>
        </div>
      </header>

      <div className="pt-32 pb-20 px-6 min-h-screen flex items-center justify-center">
        <Suspense fallback={
          <div className="text-yellow-500 text-center">Cargando...</div>
        }>
          <EntrarForm />
        </Suspense>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-yellow-500/10 py-4 px-6 bg-black/80 backdrop-blur-sm">
        <div className="text-center">
          <p className="text-gray-700 text-xs tracking-wide">© 2026 JUGADAPLAY</p>
        </div>
      </footer>
    </main>
  );
}