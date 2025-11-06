export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-5xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-dark-navy">
            Bienvenido a <span className="text-soft-blue">Calixo</span>
          </h1>
          <p className="text-xl text-neutral-gray max-w-2xl mx-auto">
            La plataforma social para desconexión digital. Acepta retos, personaliza tu avatar CALI 
            y comparte tu progreso con una comunidad que valora el bienestar digital.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="card">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Retos Diarios</h3>
            <p className="text-neutral-gray">
              Completa desafíos de desconexión y gana monedas para personalizar tu avatar.
            </p>
          </div>

          <div className="card">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">Avatar CALI</h3>
            <p className="text-neutral-gray">
              Personaliza tu avatar con accesorios únicos que desbloqueas al completar retos.
            </p>
          </div>

          <div className="card">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">Comunidad</h3>
            <p className="text-neutral-gray">
              Comparte tu progreso, sigue a otros usuarios y participa en retos sociales.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <a href="/auth/signup" className="btn-primary">
            Comenzar Ahora
          </a>
          <a href="/auth/login" className="btn-secondary">
            Iniciar Sesión
          </a>
        </div>

        {/* Status Badge */}
        <div className="text-center mt-8">
          <span className="inline-block px-4 py-2 bg-accent-green/10 text-accent-green rounded-full text-sm font-medium">
            🚧 Proyecto en Desarrollo - Fase 1
          </span>
        </div>
      </div>
    </main>
  );
}

