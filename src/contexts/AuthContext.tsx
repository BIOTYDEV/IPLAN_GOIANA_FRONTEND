/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { api } from "@/services/api"

type Usuario = {
  id: number
  nome: string
  email: string
  role: string
  fotoPerfil?: string
  secretariaId?: number | null
}

type AuthContextData = {
  usuario: Usuario | null
  isAuthenticated: boolean
  signIn: (credenciais: any) => Promise<void>
  signOut: () => void
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    try {
      const storageUser = localStorage.getItem("@Goiana:usuario")
      const storageToken = localStorage.getItem("@Goiana:token")

      if (storageUser && storageUser !== "undefined" && storageToken) {
        setUsuario(JSON.parse(storageUser))
        api.defaults.headers.common["Authorization"] = `Bearer ${storageToken}`
      } else {
        localStorage.removeItem("@Goiana:usuario")
        localStorage.removeItem("@Goiana:token")
      }
    } catch (error) {
      console.error("Erro ao ler dados de autenticação:", error)
      localStorage.removeItem("@Goiana:usuario")
      localStorage.removeItem("@Goiana:token")
    } finally {
      setCarregando(false)
    }
  }, [])

  async function signIn({ email, senha }: any) {
    try {
      const response = await api.post("/auth/login", {
        email,
        senha,
        username: email,
        password: senha,
      })

      const { access_token, usuario: backendUser } = response.data

      if (!access_token || !backendUser) {
        throw new Error("Resposta inválida do servidor.")
      }

      const dadosUsuario = {
        id: backendUser.id,
        nome: backendUser.nome,
        email: backendUser.email,
        role: backendUser.role,
        fotoPerfil: backendUser.fotoPerfil,
        secretariaId: backendUser.secretariaId,
      }

      setUsuario(dadosUsuario)
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`
      localStorage.setItem("@Goiana:usuario", JSON.stringify(dadosUsuario))
      localStorage.setItem("@Goiana:token", access_token)
    } catch (error) {
      console.error("Falha no login:", error)
      throw error
    }
  }

  function signOut() {
    setUsuario(null)
    localStorage.removeItem("@Goiana:usuario")
    localStorage.removeItem("@Goiana:token")
    delete api.defaults.headers.common["Authorization"]
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a1930]">
        <p className="animate-pulse font-bold text-white">
          Carregando Sistema...
        </p>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: !!usuario,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  return context
}
