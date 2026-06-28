/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  MonitorPlay,
  ChartLineUp,
  CheckCircle,
  Clock,
  WarningCircle,
  SignOut,
  ArrowLeft,
} from "@phosphor-icons/react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

type Acao = {
  id: number
  status: string
  criadoEm: string
  atualizadoEm: string
  secretaria: { nome: string }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#313a70]/95 p-4 shadow-xl backdrop-blur-md">
        <p className="mb-1 text-sm font-bold text-white">{label}</p>
        <p className="text-sm font-semibold text-[#45b7d1]">
          {payload[0].value} ações cadastradas
        </p>
      </div>
    )
  }
  return null
}

export function ModoTv() {
  const { usuario, signOut } = useAuth()
  const navigate = useNavigate()

  const [acoes, setAcoes] = useState<Acao[]>([])
  const [horaLocal, setHoraLocal] = useState(new Date())

  // 🛡️ TRAVA DE ROTA: Só o Prefeito pode acessar essa tela!
  useEffect(() => {
    if (usuario && usuario.role !== "PREFEITO") {
      navigate("/dashboard", { replace: true })
    }
  }, [usuario, navigate])

  useEffect(() => {
    const timer = setInterval(() => setHoraLocal(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Se não for prefeito, nem tenta carregar os dados para poupar o banco
    if (usuario?.role !== "PREFEITO") return

    async function carregarDados() {
      try {
        const response = await api.get("/acoes")
        setAcoes(response.data)
      } catch (error) {
        console.error("Erro ao carregar dados do Modo TV:", error)
      }
    }
    carregarDados()
    const refreshData = setInterval(carregarDados, 5 * 60 * 1000)
    return () => clearInterval(refreshData)
  }, [usuario?.role])

  function handleLogout() {
    signOut()
    navigate("/login")
  }

  // Se não for prefeito, retorna null para não piscar a tela antes do redirecionamento
  if (usuario?.role !== "PREFEITO") return null

  const total = acoes.length
  const concluidas = acoes.filter((a) => a.status === "CONCLUIDA").length
  const emAndamento = acoes.filter((a) => a.status === "EM_ANDAMENTO").length
  const atrasadas = acoes.filter((a) => a.status === "ATRASADA").length

  const percentualAtingido =
    total > 0 ? Math.round((concluidas / total) * 100) : 0

  const atrasosPorSecretaria = acoes
    .filter((a) => a.status === "ATRASADA")
    .reduce((acc: any, acao) => {
      const sec = acao.secretaria?.nome || "Sem Secretaria"
      if (!acc[sec]) acc[sec] = 0
      acc[sec]++
      return acc
    }, {})

  const listaAtrasos = Object.keys(atrasosPorSecretaria).map((sec) => ({
    secretaria: sec,
    quantidade: atrasosPorSecretaria[sec],
  }))

  const gerarDadosDoGrafico = () => {
    const mesesMap = new Map<string, number>()
    const nomesDosMeses = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ]
    const hoje = new Date()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const chaveMes = `${nomesDosMeses[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`
      mesesMap.set(chaveMes, 0)
    }

    acoes.forEach((acao) => {
      const dataCriacao = new Date(acao.criadoEm)
      const chaveMes = `${nomesDosMeses[dataCriacao.getMonth()]}/${dataCriacao.getFullYear().toString().slice(2)}`
      if (mesesMap.has(chaveMes)) {
        mesesMap.set(chaveMes, (mesesMap.get(chaveMes) || 0) + 1)
      }
    })

    return Array.from(mesesMap, ([name, valor]) => ({ name, valor }))
  }

  const dataEvolucaoReal = gerarDadosDoGrafico()
  const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(horaLocal)
  const horaFormatada = horaLocal.toLocaleTimeString("pt-BR", { hour12: false })

  return (
    <div className="flex min-h-screen flex-col overflow-y-auto bg-[#48549e] font-sans text-white">
      {/* HEADER RESPONSIVO */}
      <header className="flex flex-col gap-6 border-b border-white/10 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex items-center gap-4 md:gap-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#45b7d1] md:h-14 md:w-14">
            <MonitorPlay size={32} weight="fill" className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight md:text-2xl">
              Painel Executivo do Prefeito
            </h1>
            <p className="text-sm text-indigo-200 md:text-base">
              Sistema de Gestão de Planos de Ação • Goiana-PE
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8 md:text-right">
          <div>
            <h2 className="text-3xl font-black tracking-widest md:text-4xl">
              {horaFormatada}
            </h2>
            <p className="text-sm font-medium text-indigo-200 capitalize">
              {dataFormatada}
            </p>
          </div>
          <div className="flex flex-row justify-between gap-4 border-t border-white/20 pt-4 md:flex-col md:items-end md:gap-2 md:border-t-0 md:border-l md:pt-0 md:pl-8">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-sm font-bold text-[#45b7d1] transition-colors hover:text-white"
            >
              <ArrowLeft size={16} weight="bold" /> Voltar
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-bold text-red-400 transition-colors hover:text-red-300"
            >
              Sair <SignOut size={16} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT RESPONSIVO */}
      <main className="flex flex-1 flex-col gap-6 p-6 md:p-10">
        {/* CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-4">
              <ChartLineUp
                size={28}
                className="text-[#45b7d1]"
                weight="regular"
              />
            </div>
            <div>
              <h3 className="text-4xl font-black md:text-5xl">
                {percentualAtingido}%
              </h3>
              <p className="mt-2 text-xs font-bold tracking-widest text-indigo-200 uppercase">
                Ações Concluídas
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-4">
              <CheckCircle
                size={28}
                className="text-emerald-400"
                weight="regular"
              />
            </div>
            <div>
              <h3 className="text-4xl font-black md:text-5xl">{concluidas}</h3>
              <p className="mt-2 text-xs font-bold tracking-widest text-indigo-200 uppercase">
                Ações Concluídas
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="mb-4">
              <Clock size={28} className="text-[#f3c344]" weight="regular" />
            </div>
            <div>
              <h3 className="text-4xl font-black md:text-5xl">{emAndamento}</h3>
              <p className="mt-2 text-xs font-bold tracking-widest text-indigo-200 uppercase">
                Ações em Andamento
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-3xl border border-red-500/20 bg-red-500/10 p-6 backdrop-blur-sm">
            <div className="mb-4">
              <WarningCircle
                size={28}
                className="text-red-400"
                weight="regular"
              />
            </div>
            <div>
              <h3 className="text-4xl font-black text-red-100 md:text-5xl">
                {atrasadas}
              </h3>
              <p className="mt-2 text-xs font-bold tracking-widest text-red-300 uppercase">
                Atenção (Atrasos)
              </p>
            </div>
          </div>
        </div>

        {/* GRÁFICO E LISTA */}
        <div className="flex flex-1 flex-col gap-6 lg:grid lg:grid-cols-12">
          {/* Gráfico */}
          <div className="flex min-h-100 flex-col rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8 lg:col-span-8">
            <div className="mb-8 flex items-center gap-3">
              <ChartLineUp
                size={24}
                className="shrink-0 text-[#45b7d1]"
                weight="bold"
              />
              <h3 className="text-lg font-bold md:text-2xl">
                Volume de Ações Registradas (Últimos 6 Meses)
              </h3>
            </div>
            <div className="mt-4 h-75 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dataEvolucaoReal}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#c7d2fe", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#c7d2fe", fontSize: 12 }}
                    dx={-10}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      stroke: "rgba(255,255,255,0.2)",
                      strokeWidth: 1,
                      strokeDasharray: "5 5",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#45b7d1"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#48549e",
                      stroke: "#45b7d1",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: "#45b7d1",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Atenção Necessária */}
          <div className="flex min-h-100 flex-col rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8 lg:col-span-4 lg:h-auto lg:max-h-full">
            <div className="mb-6 flex shrink-0 items-center gap-3">
              <WarningCircle
                size={24}
                className="text-[#f3c344]"
                weight="bold"
              />
              <h3 className="text-lg font-bold md:text-2xl">
                Atenção Necessária
              </h3>
            </div>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-2">
              {listaAtrasos.length === 0 ? (
                <div className="mt-4 flex h-full flex-col items-center justify-center text-indigo-200">
                  <CheckCircle
                    size={48}
                    weight="thin"
                    className="mb-4 opacity-50"
                  />
                  <p className="text-lg font-bold">Excelente!</p>
                  <p className="mt-2 text-center text-sm opacity-70">
                    Nenhuma obra ou etapa com status de Atraso.
                  </p>
                </div>
              ) : (
                listaAtrasos.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/5 bg-[#313a70]/50 p-4 md:p-5"
                  >
                    <h4 className="text-base font-bold text-[#f3c344]">
                      {item.secretaria}
                    </h4>
                    <p className="mt-1 text-sm font-medium text-indigo-100">
                      {item.quantidade}{" "}
                      {item.quantidade === 1
                        ? "obra em atraso"
                        : "obras em atraso"}
                      . Exige atenção.
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
