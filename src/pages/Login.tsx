import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Moon, Sun } from "@phosphor-icons/react"

import bgTimbrado from "@/assets/bg-timbrado.png"
import logoGoiana from "@/assets/logo-goiana.png"

export function Login() {
  const [email, setEmail] = useState(
    () => localStorage.getItem("@Goiana:lembrarEmail") || "",
  )
  const [lembrarMe, setLembrarMe] = useState(
    () => !!localStorage.getItem("@Goiana:lembrarEmail"),
  )
  const [senha, setSenha] = useState("")
  const [carregando, setCarregando] = useState(false)

  // 🌙 ESTADO DO MODO ESCURO NA TELA DE LOGIN
  const [isDark, setIsDark] = useState(() => {
    return (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    )
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
      localStorage.theme = "dark"
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.theme = "light"
    }
  }, [isDark])

  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setCarregando(true)

    try {
      await signIn({ email, senha })

      if (lembrarMe) {
        localStorage.setItem("@Goiana:lembrarEmail", email)
      } else {
        localStorage.removeItem("@Goiana:lembrarEmail")
      }

      navigate("/")
    } catch (error) {
      console.error(error)
      const err = error as {
        response?: { data?: { message?: string | string[] } }
      }
      const msg = err.response?.data?.message || "E-mail ou senha incorretos."
      alert(`Erro no login: ${Array.isArray(msg) ? msg.join(", ") : msg}`)
      setCarregando(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#f8f9fc] p-4 font-sans transition-colors duration-300 dark:bg-slate-950">
      {/* BOTÃO MODO ESCURO ABSOLUTO */}
      <button
        type="button"
        onClick={() => setIsDark(!isDark)}
        className="absolute top-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-500 shadow-md transition-colors hover:text-[#45b7d1] md:top-8 md:right-8 dark:bg-slate-800 dark:text-gray-400 dark:hover:text-blue-400"
        title="Alternar Tema"
      >
        {isDark ? (
          <Sun size={24} weight="fill" />
        ) : (
          <Moon size={24} weight="fill" />
        )}
      </button>

      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-multiply dark:opacity-10 dark:mix-blend-normal"
        style={{ backgroundImage: `url(${bgTimbrado})` }}
      ></div>

      <div className="z-10 flex w-full max-w-md flex-col items-center rounded-3xl border border-gray-100 bg-white p-10 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex w-full justify-center">
          <img
            src={logoGoiana}
            alt="Prefeitura de Goiana"
            className="h-20 object-contain dark:rounded-2xl dark:bg-white/90 dark:p-2"
          />
        </div>

        <p className="mb-8 text-center text-xs font-bold tracking-widest text-gray-400 uppercase">
          Plataforma de Acompanhamento
          <br />
          do Planejamento Governamental
        </p>

        <form onSubmit={handleLogin} className="w-full space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-bold tracking-wider text-[#313a70] uppercase dark:text-gray-300">
              E-mail Institucional
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@goiana.pe.gov.br"
              className="h-12 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:border-[#45b7d1] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold tracking-wider text-[#313a70] uppercase dark:text-gray-300">
              Senha
            </Label>
            <Input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="h-12 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:border-[#45b7d1] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="lembrar"
                checked={lembrarMe}
                onCheckedChange={(checked) => setLembrarMe(checked as boolean)}
                className="rounded-md border-gray-300 data-[state=checked]:border-[#45b7d1] data-[state=checked]:bg-[#45b7d1] dark:border-slate-600"
              />
              <Label
                htmlFor="lembrar"
                className="cursor-pointer text-xs font-semibold text-gray-500 dark:text-gray-400"
              >
                Lembrar-me
              </Label>
            </div>
            <button
              type="button"
              onClick={() => navigate("/redefinir-senha")}
              className="text-xs font-bold text-[#45b7d1] transition-colors hover:text-[#3ba2ba] dark:text-blue-400"
            >
              Esqueceu a Senha?
            </button>
          </div>

          <Button
            type="submit"
            disabled={carregando}
            className="mt-4 h-12 w-full rounded-xl bg-[#313a70] text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1e2446] dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {carregando ? "Autenticando..." : "Entrar no Sistema"}
          </Button>
        </form>

        <div className="mt-8 w-full border-t border-gray-100 pt-6 text-center dark:border-slate-800">
          <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            © {new Date().getFullYear()} Prefeitura de Goiana - Todos os
            direitos reservados
          </p>
        </div>
      </div>
    </div>
  )
}
