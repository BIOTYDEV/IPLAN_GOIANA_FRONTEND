/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Warning,
  Clock,
  CheckCircle,
  SlidersHorizontal,
  CalendarBlank,
  Trash,
  Checks,
} from "@phosphor-icons/react"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "../components/ui/badge"

type Alerta = {
  id: number
  mensagem: string
  tipo: "URGENTE" | "PRAZO" | "INFORMATIVO" | "ATRASO"
  status: "PENDENTE" | "LIDO" | "RESOLVIDO"
  criadoEm: string
  acao?: { titulo: string; prazo: string; secretaria: { nome: string } }
}

export function Alertas() {
  const { usuario } = useAuth()
  const rolesComVisaoGlobal = ["ADMIN", "PREFEITO"]
  const temVisaoGlobal = rolesComVisaoGlobal.includes(usuario?.role || "")

  const [abaAtual, setAbaAtual] = useState<"central" | "regras">("central")
  const [alertas, setAlertas] = useState<Alerta[]>([])

  const [diasAviso, setDiasAviso] = useState("7")
  const [recorrencia, setRecorrencia] = useState("Diariamente")
  const [notificarSistema, setNotificarSistema] = useState(true)
  const [notificarEmailResp, setNotificarEmailResp] = useState(true)
  const [notificarEmailPrefeito, setNotificarEmailPrefeito] = useState(false)

  async function carregarDados() {
    try {
      // 🛡️ Melhoria 1: Pede pro Back-End filtrar direto no banco de dados
      const params = temVisaoGlobal ? {} : { usuarioId: usuario?.id }
      const response = await api.get("/alertas", { params })

      const alertasOrdenados = response.data.sort(
        (a: any, b: any) =>
          new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
      )
      setAlertas(alertasOrdenados)

      if (temVisaoGlobal) {
        const resConfig = await api.get("/alertas/configuracoes/regras")
        if (resConfig.data) {
          setDiasAviso(String(resConfig.data.diasAviso))
          setRecorrencia(resConfig.data.recorrencia)
          setNotificarSistema(resConfig.data.notificarSistema)
          setNotificarEmailResp(resConfig.data.notificarEmailResp)
          setNotificarEmailPrefeito(resConfig.data.notificarEmailPrefeito)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // 🛡️ Melhoria 2: Função para Marcar como Lido em vez de excluir
  async function handleMarcarComoLido(id: number) {
    try {
      await api.patch(`/alertas/${id}`, { status: "LIDO" })
      carregarDados()
    } catch (error) {
      console.error("Erro ao atualizar status do alerta", error)
    }
  }

  async function handleExcluirAlerta(id: number) {
    try {
      await api.delete(`/alertas/${id}`)
      carregarDados()
    } catch (error) {
      console.error("Erro ao excluir alerta", error)
    }
  }

  const salvarRegras = async () => {
    try {
      await api.post("/alertas/configuracoes/regras", {
        diasAviso: Number(diasAviso),
        recorrencia,
        notificarSistema,
        notificarEmailResp,
        notificarEmailPrefeito,
      })
      alert("Regras de notificação salvas com sucesso!")
    } catch (error) {
      console.error(error)
      alert("Erro ao salvar as configurações.")
    }
  }

  const qtdAtrasadas = alertas.filter(
    (a) => a.tipo === "ATRASO" && a.status === "PENDENTE",
  ).length
  const qtdProximas = alertas.filter(
    (a) => a.tipo === "PRAZO" && a.status === "PENDENTE",
  ).length
  const formatarData = (dataIso?: string) =>
    dataIso ? new Intl.DateTimeFormat("pt-BR").format(new Date(dataIso)) : "-"

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#313a70] dark:text-white">
          Alertas e Notificações
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Acompanhamento de prazos gerados automaticamente pelo sistema
        </p>
      </div>

      <div className="mb-8 flex gap-8 border-b border-gray-200 dark:border-slate-800">
        <button
          onClick={() => setAbaAtual("central")}
          className={`pb-4 text-sm font-bold transition-all ${abaAtual === "central" ? "border-b-2 border-[#45b7d1] text-[#45b7d1]" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
        >
          Central de Alertas
        </button>
        {temVisaoGlobal && (
          <button
            onClick={() => setAbaAtual("regras")}
            className={`pb-4 text-sm font-bold transition-all ${abaAtual === "regras" ? "border-b-2 border-[#45b7d1] text-[#45b7d1]" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
          >
            Regras do Sistema
          </button>
        )}
      </div>

      {abaAtual === "central" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 grid grid-cols-2 gap-6">
            <Card className="rounded-2xl border-red-100 bg-red-50 shadow-sm dark:border-red-900/30 dark:bg-slate-900">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-500 shadow-sm dark:bg-red-900/50 dark:text-red-400">
                  <Warning size={24} weight="bold" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-red-500 dark:text-red-400">
                    {qtdAtrasadas}
                  </h2>
                  <p className="text-sm font-bold tracking-wider text-red-400 uppercase dark:text-red-500">
                    Obras Atrasadas
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-yellow-100 bg-[#fdf8e9] shadow-sm dark:border-yellow-900/30 dark:bg-slate-900">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#f3c344] shadow-sm dark:bg-yellow-900/50 dark:text-yellow-400">
                  <Clock size={24} weight="bold" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-[#d4a017] dark:text-yellow-500">
                    {qtdProximas}
                  </h2>
                  <p className="text-sm font-bold tracking-wider text-[#d4a017]/80 uppercase dark:text-yellow-600">
                    Prazos Próximos
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden rounded-2xl border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="p-0">
              {alertas.length === 0 ? (
                <div className="flex flex-col items-center justify-center bg-gray-50/30 py-20 text-gray-400 dark:bg-slate-800/30">
                  <CheckCircle
                    size={56}
                    weight="thin"
                    className="mb-4 text-emerald-400 opacity-80"
                  />
                  <p className="text-xl font-bold text-[#313a70] dark:text-white">
                    Tudo em ordem!
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nenhum alerta gerado pelo Robô da iPlan Goiana.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-gray-100 dark:divide-slate-800">
                  {alertas.map((alerta) => (
                    <div
                      key={alerta.id}
                      className={`flex flex-col gap-4 p-6 transition-colors hover:bg-gray-50/50 md:flex-row md:items-center md:justify-between dark:hover:bg-slate-800/50 ${alerta.status === "LIDO" ? "opacity-60 grayscale transition-all hover:grayscale-0" : ""}`}
                    >
                      <div className="flex items-start gap-5">
                        <div
                          className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm ${alerta.tipo === "ATRASO" ? "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400" : alerta.tipo === "PRAZO" ? "bg-yellow-100 text-[#f3c344] dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-blue-100 text-[#45b7d1] dark:bg-blue-900/30 dark:text-blue-400"}`}
                        >
                          {alerta.tipo === "ATRASO" ? (
                            <Warning size={24} weight="bold" />
                          ) : (
                            <Clock size={24} weight="bold" />
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <h3 className="pr-4 text-base leading-tight font-bold text-[#313a70] dark:text-white">
                            {alerta.mensagem}
                          </h3>
                          {alerta.acao && (
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                              <Badge
                                variant="outline"
                                className="rounded-md border-gray-200 bg-white font-bold text-gray-500 shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                              >
                                {alerta.acao.secretaria?.nome ||
                                  "Secretaria não informada"}
                              </Badge>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                                <CalendarBlank size={14} />
                                <span>
                                  Prazo original:{" "}
                                  {formatarData(alerta.acao.prazo)}
                                </span>
                              </div>
                            </div>
                          )}
                          <p className="mt-1 text-xs font-semibold text-gray-400">
                            Gerado em: {formatarData(alerta.criadoEm)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-row items-center gap-3 md:flex-col md:items-end md:border-l md:border-gray-100 md:pl-4 dark:md:border-slate-700">
                        {alerta.status === "PENDENTE" && (
                          <Button
                            onClick={() => handleMarcarComoLido(alerta.id)}
                            variant="secondary"
                            className="w-full rounded-xl bg-[#e5f5f9] font-bold text-[#45b7d1] hover:bg-[#d0eff5] md:w-36 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                          >
                            <Checks size={18} weight="bold" className="mr-2" />
                            Marcar Lido
                          </Button>
                        )}
                        <Link
                          to="/acoes"
                          className={
                            alerta.status === "LIDO" ? "w-full md:w-36" : ""
                          }
                        >
                          <Button
                            variant="outline"
                            className={`w-full rounded-xl font-bold md:w-36 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800 ${alerta.status === "LIDO" ? "bg-white" : ""}`}
                          >
                            Ver Ação
                          </Button>
                        </Link>
                        {temVisaoGlobal && (
                          <button
                            onClick={() => handleExcluirAlerta(alerta.id)}
                            className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 transition-colors hover:text-red-500 md:mt-2"
                          >
                            <Trash size={14} weight="bold" /> Excluir
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {abaAtual === "regras" && temVisaoGlobal && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="rounded-2xl border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="border-b border-gray-50 pb-6 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <SlidersHorizontal
                  size={24}
                  className="text-[#48549e] dark:text-blue-400"
                  weight="bold"
                />
                <CardTitle className="text-xl font-bold text-[#313a70] dark:text-white">
                  Regras do Robô de Disparo
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid max-w-2xl gap-8">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div>
                    <Label className="mb-2 block text-sm font-bold text-[#313a70] dark:text-gray-300">
                      Aviso de Prazo Próximo
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={diasAviso}
                        onChange={(e) => setDiasAviso(e.target.value)}
                        className="w-24 rounded-xl border-gray-200 bg-white text-center font-bold text-[#313a70] focus:border-[#45b7d1] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        dias antes do vencimento
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-bold text-[#313a70] dark:text-gray-300">
                      Recorrência do Robô
                    </Label>
                    <select
                      value={recorrencia}
                      onChange={(e) => setRecorrencia(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-[#45b7d1] dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                    >
                      <option value="Diariamente">
                        Diariamente à meia-noite (Recomendado)
                      </option>
                      <option value="Semanalmente">Semanalmente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="mb-4 block text-sm font-bold text-[#313a70] dark:text-gray-300">
                    Canais de Notificação
                  </Label>
                  <div className="space-y-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notificarSistema}
                        onChange={(e) => setNotificarSistema(e.target.checked)}
                        className="h-5 w-5 accent-[#45b7d1]"
                      />
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Sistema (Central de Alertas)
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notificarEmailResp}
                        onChange={(e) =>
                          setNotificarEmailResp(e.target.checked)
                        }
                        className="h-5 w-5 accent-[#45b7d1]"
                      />
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        E-mail de cobrança para os responsáveis
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={notificarEmailPrefeito}
                        onChange={(e) =>
                          setNotificarEmailPrefeito(e.target.checked)
                        }
                        className="h-5 w-5 accent-[#45b7d1]"
                      />
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Resumo diário para o Prefeito/Admin
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={salvarRegras}
                    className="w-full rounded-xl bg-[#45b7d1] px-8 py-6 text-base font-bold text-white shadow-sm hover:bg-[#3ba2ba] md:w-auto dark:bg-blue-600"
                  >
                    Salvar Preferências
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}
