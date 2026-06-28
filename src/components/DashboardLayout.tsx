/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode, useEffect, useState } from "react"
import { useLocation, Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
  SquaresFour,
  Target,
  Users,
  FileText,
  Bell,
  Gear,
  MonitorPlay,
  SignOut,
  List,
  X,
  Moon,
  Sun,
} from "@phosphor-icons/react"
import logoGoiana from "@/assets/logo-goiana.png"
import { api } from "@/services/api"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { usuario, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [temAlertaPendente, setTemAlertaPendente] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    {
      path: "/dashboard",
      icon: SquaresFour,
      label: "Dashboard",
      rolesPermitidas: ["ADMIN", "PLANEJAMENTO", "SECRETARIO"],
    },
    {
      path: "/acoes",
      icon: Target,
      label: "Ações",
      rolesPermitidas: ["ADMIN", "PLANEJAMENTO", "SECRETARIO", "PREFEITO"],
    },
    {
      path: "/usuarios",
      icon: Users,
      label: "Usuários",
      rolesPermitidas: ["ADMIN"],
    },
    {
      path: "/relatorios",
      icon: FileText,
      label: "Relatórios",
      rolesPermitidas: ["ADMIN", "PLANEJAMENTO", "SECRETARIO"],
    },
    {
      path: "/alertas",
      icon: Bell,
      label: "Alertas",
      rolesPermitidas: ["ADMIN", "PLANEJAMENTO", "SECRETARIO"],
    },
    {
      path: "/configuracoes",
      icon: Gear,
      label: "Configurações",
      rolesPermitidas: ["ADMIN", "PLANEJAMENTO", "SECRETARIO"],
    },
  ]

  const menusVisiveis = navItems.filter(
    (item) => usuario?.role && item.rolesPermitidas.includes(usuario.role),
  )

  useEffect(() => {
    if (usuario && usuario.role !== "PREFEITO") {
      api
        .get("/alertas")
        .then((res) => {
          const temPendente = res.data.some(
            (alerta: any) =>
              alerta.status === "PENDENTE" || alerta.status === "pendente",
          )
          setTemAlertaPendente(temPendente)
        })
        .catch((err) => console.error("Erro ao checar alertas:", err))
    }
  }, [usuario])

  function handleLogout() {
    signOut()
    navigate("/login")
  }

  const getInitials = (name?: string) => {
    if (!name) return "AD"
    const names = name.split(" ")
    return names.length >= 2
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase()
  }

  const baseURL = api.defaults.baseURL
  const fotoPerfil = (usuario as any)?.fotoPerfil

  return (
    <div className="flex min-h-screen w-full bg-[#f4f7f9] font-sans transition-colors duration-300 dark:bg-gray-900">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 flex h-full w-64 flex-col bg-[#48549e] text-white transition-transform duration-300 md:translate-x-0 dark:bg-gray-950 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-6 md:h-24 md:px-8">
          <img
            src={logoGoiana}
            alt="Prefeitura de Goiana"
            className="h-10 object-contain md:h-12 dark:rounded-2xl dark:bg-white/90 dark:p-2"
          />
          <button
            className="text-white md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        {menusVisiveis.length > 0 && (
          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
            {menusVisiveis.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? "bg-[#45b7d1] text-white shadow-md dark:bg-blue-600"
                      : "text-indigo-100 hover:bg-white/10 hover:text-white dark:text-gray-400"
                  }`}
                >
                  <Icon size={22} weight={active ? "fill" : "regular"} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        )}

        <div
          className={`flex shrink-0 flex-col gap-2 border-t border-white/10 p-4 ${menusVisiveis.length === 0 ? "mt-auto" : ""}`}
        >
          {/* 💡 TRAVA VISUAL: Oculta o Modo TV para quem não é Prefeito */}
          {usuario?.role === "PREFEITO" && (
            <Link
              to="/modo-tv"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-indigo-100 transition-all hover:bg-white/10 hover:text-white"
            >
              <MonitorPlay size={22} /> Modo TV (Prefeito)
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-indigo-100 transition-all hover:bg-white/10 hover:text-white"
          >
            <SignOut size={22} /> Sair
          </button>
        </div>
      </aside>

      <div className="flex w-full flex-1 flex-col transition-all md:ml-64">
        <header className="sticky top-0 z-20 flex h-16 w-full shrink-0 items-center justify-between bg-white px-4 shadow-sm transition-colors duration-300 md:h-20 md:px-8 dark:bg-gray-800">
          <button
            className="text-[#48549e] md:hidden dark:text-gray-300"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <List size={28} weight="bold" />
          </button>

          <div className="flex w-full items-center justify-end gap-4 md:gap-6">
            <button
              onClick={() => setIsDark(!isDark)}
              className="text-gray-400 transition-colors hover:text-[#45b7d1] dark:hover:text-blue-400"
              title="Alternar Tema"
            >
              {isDark ? (
                <Sun size={24} weight="fill" />
              ) : (
                <Moon size={24} weight="fill" />
              )}
            </button>

            {usuario?.role !== "PREFEITO" && (
              <Link
                to="/alertas"
                className="relative text-gray-400 transition-colors hover:text-[#48549e] dark:hover:text-blue-400"
              >
                <Bell size={24} weight="fill" />
                {temAlertaPendente && (
                  <span className="absolute top-0 right-0 flex h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400 ring-2 ring-white dark:ring-gray-800"></span>
                )}
              </Link>
            )}

            <div className="flex items-center gap-3 border-l border-gray-100 pl-4 md:pl-6 dark:border-gray-700">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#45b7d1] text-xs font-bold text-white shadow-sm md:h-10 md:w-10 md:text-sm">
                {fotoPerfil ? (
                  <img
                    src={`${baseURL}/usuarios/foto/${fotoPerfil}`}
                    alt="Perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(usuario?.nome)
                )}
              </div>
              <div className="hidden flex-col md:flex">
                <span className="text-sm font-bold text-[#0f2852] dark:text-white">
                  {usuario?.nome || "Usuário"}
                </span>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-400">
                  {usuario?.role === "ADMIN" ? "Admin Geral" : usuario?.role}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="w-full max-w-full flex-1 overflow-x-hidden p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
