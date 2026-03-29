import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Crown } from "lucide-react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-black">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="container mx-auto px-6">
          <div className="flex items-center h-20">
            <Link href="/" className="flex items-center space-x-3 group">
              <ArrowLeft className="w-5 h-5 text-yellow-500 group-hover:-translate-x-1 transition-transform" />
              <Crown className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
              <span className="text-lg font-light tracking-wider text-white">
                JUGADA<span className="text-yellow-500 font-medium">PLAY</span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-28 pb-20 px-6 min-h-screen flex items-center justify-center">
        <Suspense fallback={
          <div className="text-yellow-500 text-center">Cargando...</div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}