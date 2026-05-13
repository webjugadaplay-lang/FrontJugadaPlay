import { Suspense } from "react";
import CrearSalaContent from "./CrearSalaContent";

export default function CrearSalaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-yellow-500">Cargando...</div>
      </div>
    }>
      <CrearSalaContent />
    </Suspense>
  );
}