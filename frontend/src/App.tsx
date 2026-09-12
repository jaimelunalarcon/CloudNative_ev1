import type { ReactNode } from "react";
import { Button } from "./components/button";
import { Container } from "./components/container";
import { Footer } from "./components/footer";
import { Gradient, GradientBackground } from "./components/gradient";
import { Navbar } from "./components/navbar";
import { PresupuestosPanel } from "./components/presupuestos-panel";
import { useAuth } from "./auth/AuthContext.tsx";

function AuthScreen({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="overflow-hidden bg-gray-50">
      <GradientBackground />
      <div className="isolate flex min-h-dvh items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md rounded-xl bg-white shadow-md ring-1 ring-black/5">
          <div className="p-7 sm:p-11">
            <h1 className="text-base/6 font-medium">{title}</h1>
            {description ? (
              <p className="mt-1 text-sm/5 text-gray-600">{description}</p>
            ) : null}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SignedInApp() {
  const { tokens, logout } = useAuth();
  const email = tokens?.email ?? "cuenta autenticada";

  return (
    <div className="overflow-hidden">
      <div className="relative">
        <Gradient className="absolute inset-2 bottom-0 rounded-4xl ring-1 ring-black/5 ring-inset" />
        <Container className="relative">
          <Navbar
            banner={
              <span className="flex items-center gap-1 rounded-full bg-fuchsia-950/35 px-3 py-0.5 text-sm/6 font-medium text-white">
                {email}
              </span>
            }
            actions={
              <Button onClick={logout}>Cerrar sesión</Button>
            }
          />
        </Container>
      </div>

      {tokens?.accessToken ? (
        <PresupuestosPanel accessToken={tokens.accessToken} email={email} />
      ) : null}

      <Footer />
    </div>
  );
}

function App() {
  const { status, error, login } = useAuth();

  if (status === "loading") {
    return (
      <AuthScreen
        title="Cargando..."
        description="Procesando el callback de Cognito (pasos 6 a 9) o restaurando la sesión."
      >
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gray-950" />
        </div>
      </AuthScreen>
    );
  }

  if (error) {
    return (
      <AuthScreen
        title="No se pudo iniciar sesión"
        description={error}
      >
        <Button className="w-full" onClick={() => void login()}>
          Reintentar con Cognito
        </Button>
      </AuthScreen>
    );
  }

  if (status === "authenticated") {
    return <SignedInApp />;
  }

  return (
    <AuthScreen
      title="Cloud Native Evaluación Parcial 1"
      description="App Solicitud de presupuesto"
    >
      {/* PASO 1 — el usuario hace clic en Login */}
      <Button className="w-full" onClick={() => void login()}>
        Iniciar sesión con Cognito
      </Button>
    </AuthScreen>
  );
}

export default App;
