import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { Login } from "./pages/Login"
import { RedefinirSenha } from "./pages/RedefinirSenha"
import { Dashboard } from "./pages/Dashboard"
import { Usuarios } from "./pages/Usuarios"
import { Acoes } from "./pages/Acoes"
import { Relatorios } from "./pages/Relatorios"
import { Configuracoes } from "./pages/Configuracoes"
import { Alertas } from "./pages/Alertas"
import { ModoTv } from "./pages/ModoTv"

function RotaPrivada({ children }: { children: React.ReactNode }) {
  const { usuario } = useAuth()
  const token = localStorage.getItem("@Goiana:token")

  if (!usuario || !token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />

          <Route
            path="/dashboard"
            element={
              <RotaPrivada>
                <Dashboard />
              </RotaPrivada>
            }
          />
          <Route
            path="/acoes"
            element={
              <RotaPrivada>
                <Acoes />
              </RotaPrivada>
            }
          />
          <Route
            path="/usuarios"
            element={
              <RotaPrivada>
                <Usuarios />
              </RotaPrivada>
            }
          />
          <Route
            path="/relatorios"
            element={
              <RotaPrivada>
                <Relatorios />
              </RotaPrivada>
            }
          />
          <Route
            path="/alertas"
            element={
              <RotaPrivada>
                <Alertas />
              </RotaPrivada>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <RotaPrivada>
                <Configuracoes />
              </RotaPrivada>
            }
          />
          <Route
            path="/modo-tv"
            element={
              <RotaPrivada>
                <ModoTv />
              </RotaPrivada>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
