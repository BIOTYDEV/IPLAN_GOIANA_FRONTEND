/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Suitcase, CheckCircle, Clock, Warning } from "@phosphor-icons/react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

type Acao = {
  id: number
  titulo: string
  status: string
  prazo: string
  eixoId?: number
  eixo?: { id: number; nome: string }
  ods?: { codigo: string; nome: string }
  secretaria: { sigla: string; nome: string }
  responsavelId: number
}
type Eixo = { id: number; nome: string }
type Secretaria = { id: number; nome: string }

export function Dashboard() {
  const { usuario: usuarioLogado } = useAuth()

  const rolesComVisaoGlobal = ["ADMIN", "PREFEITO", "PLANEJAMENTO"]
  const temVisaoGlobal = rolesComVisaoGlobal.includes(usuarioLogado?.role || "")

  const [acoes, setAcoes] = useState<Acao[]>([])
  const [eixos, setEixos] = useState<Eixo[]>([])
  const [secretarias, setSecretarias] = useState<Secretaria[]>([])

  const [filtroSecretaria, setFiltroSecretaria] = useState("TODAS")
  const [filtroEixo, setFiltroEixo] = useState("TODOS")
  const [filtroODS, setFiltroODS] = useState("TODOS")

  useEffect(() => {
    async function carregarDados() {
      try {
        const [resAcoes, resEixos, resSecretarias] = await Promise.all([
          api.get("/acoes"),
          api.get("/eixos"),
          api.get("/secretarias"),
        ])
        setAcoes(resAcoes.data)
        setEixos(resEixos.data)
        setSecretarias(resSecretarias.data)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      }
    }
    carregarDados()
  }, [])

  const acoesFiltradas = acoes.filter((acao) => {
    if (!temVisaoGlobal && acao.responsavelId !== Number(usuarioLogado?.id))
      return false

    const matchSecretaria =
      filtroSecretaria === "TODAS" || acao.secretaria?.nome === filtroSecretaria
    const matchEixo =
      filtroEixo === "TODOS" ||
      (acao.eixoId || acao.eixo?.id)?.toString() === filtroEixo

    const matchODS =
      filtroODS === "TODOS" ||
      acao.ods?.nome === filtroODS ||
      acao.ods?.codigo === filtroODS

    return matchSecretaria && matchEixo && matchODS
  })

  const total = acoesFiltradas.length
  const concluidas = acoesFiltradas.filter(
    (a) => a.status === "CONCLUIDA",
  ).length
  const emAndamento = acoesFiltradas.filter(
    (a) => a.status === "EM_ANDAMENTO",
  ).length
  const atrasadas = acoesFiltradas.filter((a) => a.status === "ATRASADA").length
  const naoIniciadas = acoesFiltradas.filter(
    (a) => a.status === "NAO_INICIADA",
  ).length

  const statusData = [
    { name: "Concluídas", value: concluidas, color: "#54b948" },
    { name: "Em andamento", value: emAndamento, color: "#f3c344" },
    { name: "Atrasadas", value: atrasadas, color: "#48549e" },
    { name: "Não iniciadas", value: naoIniciadas, color: "#9ca7b8" },
  ]

  const agrupadoPorEixo = acoesFiltradas.reduce(
    (acc: Record<string, number>, acao) => {
      const nomeEixo = acao.eixo?.nome || "Sem Eixo"
      acc[nomeEixo] = (acc[nomeEixo] || 0) + 1
      return acc
    },
    {},
  )

  const eixoData = Object.keys(agrupadoPorEixo)
    .map((key) => ({ name: key, value: agrupadoPorEixo[key] }))
    .sort((a, b) => b.value - a.value)

  const rankingSecretarias = Object.values(
    acoesFiltradas.reduce((acc: any, acao) => {
      const sec = acao.secretaria?.nome || "Sem Secretaria"
      if (!acc[sec])
        acc[sec] = { nome: sec, total: 0, concluidas: 0, andamento: 0 }
      acc[sec].total += 1
      if (acao.status === "CONCLUIDA") acc[sec].concluidas += 1
      if (acao.status === "EM_ANDAMENTO") acc[sec].andamento += 1
      return acc
    }, {}),
  )
    .map((item: any) => ({
      ...item,
      progressoGeral:
        Math.round(((item.concluidas + item.andamento) / item.total) * 100) ||
        0,
    }))
    .sort((a: any, b: any) => b.progressoGeral - a.progressoGeral)

  const hoje = new Date()
  const alertasAtivos = acoesFiltradas
    .filter((a) => a.status !== "CONCLUIDA" && a.prazo)
    .map((acao) => {
      const dataPrazo = new Date(acao.prazo)
      const diffDias = Math.ceil(
        (dataPrazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
      )
      if (acao.status === "ATRASADA" || diffDias < 0)
        return {
          id: acao.id,
          tipo: "ATRASADO",
          dias: Math.abs(diffDias),
          titulo: acao.titulo,
          secretaria: acao.secretaria?.nome,
        }
      if (diffDias <= 7)
        return {
          id: acao.id,
          tipo: "PROXIMO",
          dias: diffDias,
          titulo: acao.titulo,
          secretaria: acao.secretaria?.nome,
        }
      return null
    })
    .filter(Boolean)
    .slice(0, 3)

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col justify-between gap-4 md:mb-8 xl:flex-row xl:items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#313a70] md:text-3xl dark:text-white">
            Dashboard Geral
          </h1>
          <p className="mt-1 text-sm text-gray-500 md:text-base dark:text-gray-400">
            Visão consolidada do Plano de Ação
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:gap-4 xl:w-auto">
          <select
            value={filtroSecretaria}
            onChange={(e) => setFiltroSecretaria(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm outline-none focus:border-[#45b7d1] sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="TODAS">Todas as Secretarias</option>
            {secretarias.map((sec) => (
              <option key={sec.id} value={sec.nome}>
                {sec.nome}
              </option>
            ))}
          </select>
          <select
            value={filtroEixo}
            onChange={(e) => setFiltroEixo(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm outline-none focus:border-[#45b7d1] sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="TODOS">Todos os Eixos</option>
            {eixos.map((eixo) => (
              <option key={eixo.id} value={eixo.id.toString()}>
                {eixo.nome}
              </option>
            ))}
          </select>
          <select
            value={filtroODS}
            onChange={(e) => setFiltroODS(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm outline-none focus:border-[#45b7d1] sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="TODOS">Todas as ODS</option>
            <option value="ODS 3">ODS 3</option>
            <option value="ODS 4">ODS 4</option>
            <option value="ODS 9">ODS 9</option>
          </select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
        <Card className="rounded-2xl border-gray-100 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <CardContent className="flex items-center gap-4 p-4 md:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e5f5f9] text-[#45b7d1] md:h-14 md:w-14 dark:bg-slate-700">
              <Suitcase size={28} weight="regular" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 md:text-sm dark:text-gray-400">
                Total de Ações
              </p>
              <h2 className="text-2xl font-extrabold text-[#313a70] md:text-3xl dark:text-white">
                {total}
              </h2>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-gray-100 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <CardContent className="flex items-center gap-4 p-4 md:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef8eb] text-[#54b948] md:h-14 md:w-14 dark:bg-slate-700">
              <CheckCircle size={28} weight="regular" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 md:text-sm dark:text-gray-400">
                Concluídas
              </p>
              <h2 className="text-2xl font-extrabold text-[#313a70] md:text-3xl dark:text-white">
                {concluidas}
              </h2>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-gray-100 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <CardContent className="flex items-center gap-4 p-4 md:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fdf8e9] text-[#f3c344] md:h-14 md:w-14 dark:bg-slate-700">
              <Clock size={28} weight="regular" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 md:text-sm dark:text-gray-400">
                Em Andamento
              </p>
              <h2 className="text-2xl font-extrabold text-[#313a70] md:text-3xl dark:text-white">
                {emAndamento}
              </h2>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-gray-100 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <CardContent className="flex items-center gap-4 p-4 md:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f0f2f8] text-[#48549e] md:h-14 md:w-14 dark:bg-slate-700 dark:text-blue-400">
              <Warning size={28} weight="regular" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 md:text-sm dark:text-gray-400">
                Atrasadas
              </p>
              <h2 className="text-2xl font-extrabold text-[#313a70] md:text-3xl dark:text-white">
                {atrasadas}
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-gray-100 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#313a70] md:text-xl dark:text-white">
              Status Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusData}
                margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(107, 114, 128, 0.2)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  dx={-10}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-gray-100 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#313a70] md:text-xl dark:text-white">
              Desempenho por Eixo
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={
                  eixoData.length > 0
                    ? eixoData
                    : [{ name: "Sem Dados", value: 0 }]
                }
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="rgba(107, 114, 128, 0.2)"
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  width={80}
                />
                <Bar
                  dataKey="value"
                  fill="#45b7d1"
                  radius={[0, 4, 4, 0]}
                  barSize={25}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-12">
        <Card className="rounded-2xl border-gray-100 shadow-sm xl:col-span-8 dark:border-slate-800 dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-[#313a70] md:text-xl dark:text-white">
              Ranking de Secretarias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankingSecretarias.length === 0 ? (
              <p className="py-4 text-sm text-gray-400">
                Nenhum dado encontrado.
              </p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-125 text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-bold tracking-wider text-gray-400 uppercase dark:border-slate-700">
                      <th className="pb-4 font-semibold">Secretaria</th>
                      <th className="pb-4 font-semibold">Progresso</th>
                      <th className="pb-4 text-center font-semibold">
                        Concluídas
                      </th>
                      <th className="pb-4 text-center font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingSecretarias.map((item: any, index: number) => (
                      <tr
                        key={index}
                        className="border-b border-gray-50 hover:bg-gray-50/50 dark:border-slate-700/50 dark:hover:bg-slate-700/30"
                      >
                        <td className="py-4 font-bold text-[#313a70] dark:text-gray-300">
                          {item.nome}
                        </td>
                        <td className="py-4 pr-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                              <div
                                style={{
                                  width: `${(item.concluidas / item.total) * 100}%`,
                                }}
                                className="bg-[#54b948]"
                              ></div>
                              <div
                                style={{
                                  width: `${(item.andamento / item.total) * 100}%`,
                                }}
                                className="bg-[#f3c344]"
                              ></div>
                            </div>
                            <span className="w-8 text-xs font-bold text-gray-500">
                              {item.progressoGeral}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-center font-semibold text-gray-600 dark:text-gray-400">
                          {item.concluidas}
                        </td>
                        <td className="py-4 text-center font-semibold text-gray-600 dark:text-gray-400">
                          {item.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col rounded-2xl border-gray-100 shadow-sm xl:col-span-4 dark:border-slate-800 dark:bg-slate-800">
          <CardHeader className="flex flex-row items-center gap-3 border-b border-gray-50 pb-4 dark:border-slate-700/50">
            <Warning size={24} className="text-[#f3c344]" />
            <CardTitle className="text-lg font-bold text-[#313a70] md:text-xl dark:text-white">
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pt-4">
            <div className="flex-1 space-y-4">
              {alertasAtivos.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Tudo em dia! Nenhum alerta no momento.
                </p>
              ) : (
                alertasAtivos.map((alerta: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      {alerta.tipo === "ATRASADO" ? (
                        <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-[#48549e] dark:bg-blue-900/30 dark:text-blue-400">
                          Atrasado
                        </span>
                      ) : (
                        <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                          Prazo Próximo
                        </span>
                      )}
                      <span className="text-xs font-semibold text-[#48549e] dark:text-gray-400">
                        {alerta.tipo === "ATRASADO"
                          ? `${alerta.dias} dias`
                          : `Vence em ${alerta.dias} dias`}
                      </span>
                    </div>
                    <h4 className="line-clamp-1 text-sm font-bold text-[#313a70] dark:text-white">
                      {alerta.titulo}
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">
                      {alerta.secretaria}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 text-center">
              <Link
                to="/alertas"
                className="text-sm font-bold text-[#45b7d1] hover:text-[#313a70] dark:hover:text-white"
              >
                Ver todos os alertas
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
