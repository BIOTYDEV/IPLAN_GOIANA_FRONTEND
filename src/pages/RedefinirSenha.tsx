/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle } from "@phosphor-icons/react"
import { api } from "@/services/api"

import bgTimbrado from "@/assets/bg-timbrado.png"
import logoGoiana from "@/assets/logo-goiana.png"

export function RedefinirSenha() {
  const navigate = useNavigate()

  // Três etapas: solicitar e-mail -> digitar código e senha nova -> Sucesso
  const [etapa, setEtapa] = useState<"solicitar" | "codigo" | "sucesso">(
    "solicitar",
  )
  const [carregando, setCarregando] = useState(false)

  // Dados do formulário
  const [email, setEmail] = useState("")
  const [codigo, setCodigo] = useState("")
  const [novaSenha, setNovaSenha] = useState("")

  // ETAPA 1: Pede para o Back-End enviar o e-mail
  const handleEnviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return alert("Preencha o e-mail cadastrado.")

    setCarregando(true)
    try {
      await api.post("/auth/esqueci-senha", { email })
      setEtapa("codigo")
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        "Erro ao solicitar código. Verifique se o e-mail existe."
      alert(msg)
    } finally {
      setCarregando(false)
    }
  }

  // ETAPA 2: Envia o código e a nova senha para o Back-End validar
  const handleRedefinir = async (e: React.FormEvent) => {
    e.preventDefault()
    if (codigo.length < 6) return alert("O código deve ter 6 dígitos.")
    if (novaSenha.length < 6)
      return alert("A nova senha deve ter no mínimo 6 caracteres.")

    setCarregando(true)
    try {
      await api.post("/auth/redefinir-senha", {
        email,
        token: codigo,
        novaSenha,
      })
      setEtapa("sucesso")
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Código inválido ou expirado."
      alert(msg)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#f8f9fc] p-4 font-sans">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-multiply"
        style={{ backgroundImage: `url(${bgTimbrado})` }}
      ></div>

      <div className="relative z-10 flex w-full max-w-md flex-col rounded-3xl border border-gray-100 bg-white p-10 shadow-2xl">
        {etapa !== "sucesso" && (
          <button
            onClick={() => navigate("/login")}
            className="absolute top-8 left-8 text-gray-400 transition-colors hover:text-[#313a70]"
            title="Voltar para o Login"
          >
            <ArrowLeft size={24} weight="bold" />
          </button>
        )}

        <div className="mt-4 mb-6 flex w-full justify-center">
          <img
            src={logoGoiana}
            alt="Prefeitura de Goiana"
            className="h-16 object-contain"
          />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#313a70]">
            Recuperação de Senha
          </h1>
        </div>

        {/* ETAPA 1: DIGITAR E-MAIL */}
        {etapa === "solicitar" && (
          <form onSubmit={handleEnviarCodigo} className="w-full space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold tracking-wider text-[#313a70] uppercase">
                E-mail Institucional
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@goiana.pe.gov.br"
                className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:border-[#45b7d1]"
                required
              />
            </div>

            <p className="py-2 text-center text-sm leading-relaxed font-medium text-gray-500">
              Enviaremos um código de segurança de 6 dígitos para o seu e-mail
              cadastrado.
            </p>

            <Button
              type="submit"
              disabled={carregando}
              className="h-12 w-full rounded-xl bg-[#45b7d1] text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#3ba2ba]"
            >
              {carregando ? "Enviando E-mail..." : "Receber Código"}
            </Button>
          </form>
        )}

        {/* ETAPA 2: DIGITAR CÓDIGO E NOVA SENHA */}
        {etapa === "codigo" && (
          <form
            onSubmit={handleRedefinir}
            className="animate-in fade-in slide-in-from-right-4 w-full space-y-5"
          >
            <div className="space-y-2">
              <Label className="text-xs font-bold tracking-wider text-[#313a70] uppercase">
                Código de 6 Dígitos
              </Label>
              <Input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                maxLength={6}
                className="h-14 rounded-xl border-gray-200 bg-gray-50 text-center text-2xl font-black tracking-[0.5em] text-[#313a70] focus:border-[#45b7d1]"
                required
              />
              <p className="mt-1 text-center text-xs text-gray-400">
                Enviado para: {email}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-xs font-bold tracking-wider text-[#313a70] uppercase">
                Criar Nova Senha
              </Label>
              <Input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="••••••••"
                className="h-12 rounded-xl border-gray-200 bg-gray-50 focus:border-[#45b7d1]"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={carregando}
              className="mt-4 h-12 w-full rounded-xl bg-[#313a70] text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1e2446]"
            >
              {carregando ? "Validando..." : "Redefinir Senha"}
            </Button>
          </form>
        )}

        {/* ETAPA 3: SUCESSO */}
        {etapa === "sucesso" && (
          <div className="animate-in zoom-in-95 flex flex-col items-center justify-center space-y-4 py-4">
            <CheckCircle size={64} weight="fill" className="text-emerald-500" />
            <h2 className="text-xl font-bold text-[#313a70]">
              Senha Alterada!
            </h2>
            <p className="text-center text-sm font-medium text-gray-500">
              Sua senha foi redefinida com sucesso. Você já pode acessar o
              sistema novamente.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="mt-6 h-12 w-full rounded-xl bg-[#313a70] text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1e2446]"
            >
              Fazer Login
            </Button>
          </div>
        )}

        <div className="mt-8 w-full border-t border-gray-100 pt-6 text-center">
          <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            © {new Date().getFullYear()} Prefeitura de Goiana
          </p>
        </div>
      </div>
    </div>
  )
}
