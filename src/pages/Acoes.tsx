/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Eye,
  PencilSimple,
  Trash,
  Plus,
  MagnifyingGlass,
  CalendarBlank,
  ChartBar,
  GitCommit,
  User,
  Clock,
} from "@phosphor-icons/react"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

type Acao = {
  id: number
  codigo?: string
  titulo: string
  descricao: string
  status: string
  prazo: string
  indicador: string
  metaQuantitativa: string
  progresso: number
  eixoId: number
  odsId: number
  secretariaId: number
  responsavelId: number
  acaoPaiId?: number | null
  eixo?: { id: number; nome: string }
  ods?: { nome: string }
  secretaria: { sigla: string; nome: string }
  responsavel?: { nome: string }
  subAcoes?: Acao[]
  eventos?: any[]
}
type ItemSelect = { id: number; nome: string; sigla?: string }

const acaoSchema = z.object({
  titulo: z.string().min(5, "Mínimo 5 caracteres."),
  descricao: z.string().min(10, "Mínimo 10 caracteres."),
  prazo: z.string().min(1, "Obrigatório."),
  indicador: z.string().min(1, "Obrigatório."),
  metaQuantitativa: z.string().min(1, "Obrigatório."),
  eixoId: z.string().refine((val) => val !== "0", "Obrigatório."),
  odsId: z.string().refine((val) => val !== "0", "Obrigatório."),
  secretariaId: z.string().refine((val) => val !== "0", "Obrigatório."),
  responsavelId: z.string().refine((val) => val !== "0", "Obrigatório."),
  status: z.string().optional(),
  progresso: z.string().optional(),
  acaoPaiId: z.string().optional(),
})

type AcaoValues = z.infer<typeof acaoSchema>

interface AcaoPayload {
  titulo: string
  descricao: string
  prazo: string
  indicador: string
  metaQuantitativa: string
  eixoId: number
  odsId: number
  secretariaId: number
  responsavelId: number
  status?: string
  progresso?: number
  acaoPaiId?: number | null
}

export function Acoes() {
  const { usuario: usuarioLogado } = useAuth()

  const idSecUser = (usuarioLogado as any)?.secretariaId
  const idUser = usuarioLogado?.id

  const isPrefeito = usuarioLogado?.role === "PREFEITO"
  const isSecretario = usuarioLogado?.role === "SECRETARIO"
  const isAdminOrPlanejamento =
    usuarioLogado?.role === "ADMIN" || usuarioLogado?.role === "PLANEJAMENTO"

  const rolesComVisaoGlobal = ["ADMIN", "PLANEJAMENTO", "PREFEITO"]
  const temVisaoGlobal = rolesComVisaoGlobal.includes(usuarioLogado?.role || "")

  const podeEditar = (acao: Acao) => {
    if (!usuarioLogado || isPrefeito) return false
    if (isAdminOrPlanejamento) return true
    return (
      acao.responsavelId === Number(idUser) ||
      acao.secretariaId === Number(idSecUser)
    )
  }

  const [acoes, setAcoes] = useState<Acao[]>([])
  const [eixos, setEixos] = useState<ItemSelect[]>([])
  const [ods, setOds] = useState<ItemSelect[]>([])
  const [secretarias, setSecretarias] = useState<ItemSelect[]>([])
  const [usuarios, setUsuarios] = useState<ItemSelect[]>([])

  const [busca, setBusca] = useState("")
  const [filtroSecretaria, setFiltroSecretaria] = useState("TODAS")
  const [filtroEixo, setFiltroEixo] = useState("TODOS")
  const [filtroStatus, setFiltroStatus] = useState("TODOS")

  const [modalAberto, setModalAberto] = useState(false)
  const [acaoEmEdicao, setAcaoEmEdicao] = useState<number | null>(null)
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false)
  const [acaoSelecionada, setAcaoSelecionada] = useState<Acao | null>(null)

  const defaultValues: AcaoValues = {
    titulo: "",
    descricao: "",
    prazo: "",
    indicador: "",
    metaQuantitativa: "",
    eixoId: "0",
    odsId: "0",
    secretariaId: "0",
    responsavelId: "0",
    status: "NAO_INICIADA",
    progresso: "0",
    acaoPaiId: "0",
  }

  const form = useForm<AcaoValues>({
    resolver: zodResolver(acaoSchema),
    defaultValues,
  })

  async function carregarDados() {
    try {
      const paramsBusca = {
        roleLogado: usuarioLogado?.role,
        secretariaIdLogado: idSecUser,
        usuarioIdLogado: idUser,
      }

      const [resAcoes, resEixos, resOds, resSec, resUsers] = await Promise.all([
        api.get("/acoes", { params: paramsBusca }),
        api.get("/eixos"),
        api.get("/ods"),
        api.get("/secretarias"),
        api.get("/usuarios"),
      ])

      setAcoes(resAcoes.data)
      setEixos(resEixos.data)
      setOds(resOds.data)
      setSecretarias(resSec.data)
      setUsuarios(resUsers.data)

      if (acaoSelecionada) {
        const atualizada = resAcoes.data.find(
          (a: Acao) => a.id === acaoSelecionada.id,
        )
        if (atualizada) setAcaoSelecionada(atualizada)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const acoesVisiveis = acoes.filter((acao) => {
    if (!temVisaoGlobal) {
      const isMinhaSecretaria =
        idSecUser && acao.secretariaId === Number(idSecUser)
      const isMeuRegistro = acao.responsavelId === Number(idUser)

      if (!isMinhaSecretaria && !isMeuRegistro) return false
    }

    const matchBusca = acao.titulo.toLowerCase().includes(busca.toLowerCase())
    const matchSec =
      filtroSecretaria === "TODAS" || acao.secretaria?.nome === filtroSecretaria
    const matchEixo =
      filtroEixo === "TODOS" ||
      (acao.eixoId || acao.eixo?.id)?.toString() === filtroEixo
    const matchStatus = filtroStatus === "TODOS" || acao.status === filtroStatus

    return matchBusca && matchSec && matchEixo && matchStatus
  })

  async function onSubmit(values: AcaoValues) {
    try {
      const eixoConvertido = Number(values.eixoId);
      const odsConvertido = Number(values.odsId);
      
      const parsedSecId = values.secretariaId !== "0" ? Number(values.secretariaId) : (idSecUser ? Number(idSecUser) : 0);
      const parsedRespId = values.responsavelId !== "0" ? Number(values.responsavelId) : (idUser ? Number(idUser) : 0);
      const paiConvertido = values.acaoPaiId && values.acaoPaiId !== "0" ? Number(values.acaoPaiId) : null;

      if (isNaN(eixoConvertido) || eixoConvertido === 0) return alert("⚠️ Selecione um Eixo Estratégico.");
      if (isNaN(odsConvertido) || odsConvertido === 0) return alert("⚠️ Selecione um ODS.");
      if (isNaN(parsedSecId) || parsedSecId === 0) return alert("⚠️ A Secretaria não foi identificada.");
      if (isNaN(parsedRespId) || parsedRespId === 0) return alert("⚠️ O Gestor não foi identificado.");

      const payload: AcaoPayload = {
        titulo: values.titulo,
        descricao: values.descricao,
        prazo: new Date(values.prazo).toISOString(),
        indicador: values.indicador,
        metaQuantitativa: values.metaQuantitativa,
        eixoId: eixoConvertido,
        odsId: odsConvertido,
        secretariaId: parsedSecId,
        responsavelId: parsedRespId,
        acaoPaiId: paiConvertido,
      };

      if (acaoEmEdicao) {
        payload.status = values.status;
        payload.progresso = Number(values.progresso || 0);
        await api.patch(`/acoes/${acaoEmEdicao}`, {
          ...payload,
          usuarioId: usuarioLogado?.id,
          roleLogado: usuarioLogado?.role,
        });
      } else {
        await api.post("/acoes", {
          ...payload,
          usuarioId: usuarioLogado?.id,
          roleLogado: usuarioLogado?.role,
        });
      }

      fecharModal();
      carregarDados();
    } catch (error: any) {
      console.error("ERRO COMPLETO:", error);
      const msg = error.response?.data?.message || "Verifique sua conexão";
      alert(`Erro no servidor: ${Array.isArray(msg) ? msg.join(", ") : msg}`);
    }
  }

  function abrirModalEdicao(acao: Acao) {
    setAcaoEmEdicao(acao.id)
    form.reset({
      titulo: acao.titulo,
      descricao: acao.descricao,
      prazo: acao.prazo ? acao.prazo.split("T")[0] : "",
      indicador: acao.indicador,
      metaQuantitativa: acao.metaQuantitativa,
      eixoId: String(acao.eixoId || "0"),
      odsId: String(acao.odsId || "0"),
      secretariaId: String(acao.secretariaId || "0"),
      responsavelId: String(acao.responsavelId || "0"),
      status: acao.status || "NAO_INICIADA",
      progresso: String(acao.progresso || "0"),
      acaoPaiId: String(acao.acaoPaiId || "0"),
    })
    setModalAberto(true)
  }

  function abrirModalNova() {
    setAcaoEmEdicao(null)
    form.reset({
      ...defaultValues,
      secretariaId: idSecUser ? String(idSecUser) : "0",
      responsavelId: idUser ? String(idUser) : "0",
    })
    setModalAberto(true)
  }

  function abrirNovaSubAcao(paiId: number) {
    setAcaoEmEdicao(null)
    form.reset({
      ...defaultValues,
      acaoPaiId: String(paiId),
      secretariaId: String(acaoSelecionada?.secretariaId || "0"),
      eixoId: String(acaoSelecionada?.eixoId || "0"),
      odsId: String(acaoSelecionada?.odsId || "0"),
    })
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setTimeout(() => form.reset(defaultValues), 200)
  }

  function abrirDetalhes(acao: Acao) {
    setAcaoSelecionada(acao)
    setModalDetalhesAberto(true)
  }

  async function handleExcluir(id: number, isSubAcao: boolean = false) {
    try {
      await api.delete(
        `/acoes/${id}?usuarioId=${usuarioLogado?.id}&roleLogado=${usuarioLogado?.role}`,
      )
      if (!isSubAcao) setModalDetalhesAberto(false)
      carregarDados()
    } catch (error) {
      console.error(error)
      alert("Erro ao excluir. Verifique se a ação não possui vínculos.")
    }
  }

  const formatarData = (dataIso: string) =>
    dataIso ? new Intl.DateTimeFormat("pt-BR").format(new Date(dataIso)) : "-"

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONCLUIDA":
        return (
          <span className="rounded-full bg-[#eef8eb] px-3 py-1 text-xs font-bold whitespace-nowrap text-[#54b948] dark:bg-green-900/30">
            Concluída
          </span>
        )
      case "EM_ANDAMENTO":
        return (
          <span className="rounded-full bg-[#fdf8e9] px-3 py-1 text-xs font-bold whitespace-nowrap text-[#f3c344] dark:bg-yellow-900/30">
            Em andamento
          </span>
        )
      case "ATRASADA":
        return (
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold whitespace-nowrap text-[#48549e] dark:bg-blue-900/30 dark:text-blue-400">
            Atrasada
          </span>
        )
      default:
        return (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold whitespace-nowrap text-gray-500 dark:bg-slate-700 dark:text-gray-400">
            Não iniciada
          </span>
        )
    }
  }

  const getCodigo = (id: number) => `AC-2026-${String(id).padStart(3, "0")}`

  const travaSecretaria =
    isSecretario &&
    idSecUser !== null &&
    idSecUser !== undefined &&
    idSecUser !== 0
  const travaResponsavel = isSecretario

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col justify-between gap-4 md:mb-8 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#313a70] md:text-3xl dark:text-white">
            Ações e Obras
          </h1>
          <p className="mt-1 text-sm text-gray-500 md:text-base dark:text-gray-400">
            Gerenciamento das Ações do Plano de Governo
          </p>
        </div>

        {!isPrefeito && (
          <Button
            onClick={abrirModalNova}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#45b7d1] px-5 py-6 text-sm font-bold text-white shadow-sm hover:bg-[#3ba2ba] md:w-auto dark:bg-blue-600"
          >
            <Plus size={18} weight="bold" /> Nova Ação Geral
          </Button>
        )}
      </div>

      <Card className="mb-6 rounded-2xl border-gray-100 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={20}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar ações..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pr-4 pl-10 text-sm outline-none focus:border-[#45b7d1] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <select
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 outline-none focus:border-[#45b7d1] md:w-48 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
            value={filtroSecretaria}
            onChange={(e) => setFiltroSecretaria(e.target.value)}
          >
            <option value="TODAS">Secretaria</option>
            {secretarias.map((s) => (
              <option key={s.id} value={s.nome}>
                {s.nome}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 outline-none focus:border-[#45b7d1] md:w-48 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
            value={filtroEixo}
            onChange={(e) => setFiltroEixo(e.target.value)}
          >
            <option value="TODOS">Eixos</option>
            {eixos.map((eixo) => (
              <option key={eixo.id} value={eixo.id.toString()}>
                {eixo.nome}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 outline-none focus:border-[#45b7d1] md:w-40 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="TODOS">Status</option>
            <option value="NAO_INICIADA">Não Iniciada</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="ATRASADA">Atrasada</option>
          </select>
        </div>
      </Card>

      <Card className="rounded-2xl border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-200">
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50">
                <TableHead className="py-4 pl-6 text-xs font-bold tracking-wider text-gray-400">
                  CÓDIGO / AÇÃO GERAL
                </TableHead>
                <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                  SECRETARIA
                </TableHead>
                <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                  PROGRESSO
                </TableHead>
                <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                  STATUS
                </TableHead>
                <TableHead className="pr-6 text-right text-xs font-bold tracking-wider text-gray-400">
                  DETALHES
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {acoesVisiveis.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Nenhuma ação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                acoesVisiveis.map((acao) => (
                  <TableRow
                    key={acao.id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50/30 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="py-5 pl-6 align-top">
                      <div className="flex flex-col gap-3">
                        <div>
                          <span className="text-sm font-extrabold text-[#313a70] dark:text-white">
                            {acao.titulo}
                          </span>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-bold text-[#45b7d1] dark:text-blue-400">
                              {getCodigo(acao.id)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <GitCommit size={14} className="text-gray-400" />
                              {acao.eixo?.nome || "Eixo não definido"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <User size={14} className="text-gray-400" />
                              {acao.responsavel?.nome || "Sem gestor"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <CalendarBlank
                                size={14}
                                className="text-gray-400"
                              />
                              {formatarData(acao.prazo)}
                            </span>
                          </div>
                        </div>
                        {acao.subAcoes && acao.subAcoes.length > 0 && (
                          <div className="mt-2 ml-2 flex flex-col gap-2.5 border-l-2 border-dashed border-gray-200 pl-4 dark:border-slate-700">
                            {acao.subAcoes.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
                              >
                                <span className="font-bold text-gray-600 dark:text-gray-300">
                                  {sub.titulo}
                                </span>
                                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                  <User size={12} className="text-gray-400" />
                                  {sub.responsavel?.nome || "Sem gestor"}
                                </span>
                                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                  <CalendarBlank
                                    size={12}
                                    className="text-gray-400"
                                  />
                                  {formatarData(sub.prazo)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 align-top font-bold text-[#313a70] dark:text-gray-300">
                      {acao.secretaria?.nome || "-"}
                    </TableCell>
                    <TableCell className="py-5 align-top">
                      <div className="flex w-24 items-center gap-3">
                        <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-slate-700">
                          <div
                            className={`h-1.5 rounded-full ${acao.progresso === 100 ? "bg-emerald-500" : "bg-[#45b7d1] dark:bg-blue-500"}`}
                            style={{ width: `${acao.progresso || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#313a70] dark:text-gray-300">
                          {acao.progresso || 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 align-top">
                      {getStatusBadge(acao.status)}
                    </TableCell>
                    <TableCell className="py-5 pr-6 text-right align-top">
                      <button
                        onClick={() => abrirDetalhes(acao)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#f4f7f9] px-3 py-1.5 text-sm font-bold text-[#45b7d1] transition-colors hover:bg-[#e5f5f9] dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700"
                      >
                        <Eye size={18} weight="bold" /> Ver
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-2xl bg-white sm:max-w-3xl dark:border-slate-800 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#313a70] md:text-2xl dark:text-white">
              {acaoEmEdicao ? "Editar Ação" : "Cadastrar Nova Ação/Etapa"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                      Título
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="rounded-xl bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                      Descrição Detalhada
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        className="resize-none rounded-xl bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="eixoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                        Eixo Estratégico
                      </FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          {...field}
                        >
                          <option value="0">Selecione...</option>
                          {eixos.map((e) => (
                            <option key={e.id} value={String(e.id)}>
                              {e.nome}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="odsId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                        ODS Vinculado
                      </FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          {...field}
                        >
                          <option value="0">Selecione...</option>
                          {ods.map((o) => (
                            <option key={o.id} value={String(o.id)}>
                              {o.nome}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secretariaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                        Secretaria Responsável
                      </FormLabel>
                      <FormControl>
                        <select
                          className={`flex h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none dark:border-slate-700 dark:text-white ${
                            travaSecretaria
                              ? "pointer-events-none bg-gray-200 opacity-60 dark:bg-slate-700"
                              : "bg-gray-50 dark:bg-slate-800"
                          }`}
                          {...field}
                        >
                          <option value="0">Selecione...</option>
                          {secretarias.map((s) => (
                            <option key={s.id} value={String(s.id)}>
                              {s.nome}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="responsavelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                        Gestor Responsável
                      </FormLabel>
                      <FormControl>
                        <select
                          className={`flex h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none dark:border-slate-700 dark:text-white ${
                            travaResponsavel
                              ? "pointer-events-none bg-gray-200 opacity-60 dark:bg-slate-700"
                              : "bg-gray-50 dark:bg-slate-800"
                          }`}
                          {...field}
                        >
                          <option value="0">Selecione...</option>
                          {usuarios.map((u) => (
                            <option key={u.id} value={String(u.id)}>
                              {u.nome}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="metaQuantitativa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                        Meta
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="rounded-xl bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="indicador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                        Indicador
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="rounded-xl bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prazo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                        Prazo Limite
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="rounded-xl bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="acaoPaiId"
                render={({ field }) => (
                  <FormItem
                    className={field.value !== "0" ? "block" : "hidden"}
                  >
                    <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                      Vinculado à Obra Geral (Sub-ação)
                    </FormLabel>
                    <FormControl>
                      <select
                        className="pointer-events-none flex h-10 w-full rounded-xl border border-gray-200 bg-blue-50 px-3 text-sm font-semibold text-[#45b7d1] opacity-80 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        {...field}
                      >
                        <option value="0">Nenhuma (Ação Principal)</option>
                        {acoes.map((a) => (
                          <option key={a.id} value={String(a.id)}>
                            {a.titulo}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {acaoEmEdicao && (
                <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 md:grid-cols-2 dark:border-slate-700">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                          Status da Ação
                        </FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-xl border border-gray-200 bg-blue-50 px-3 text-sm font-semibold text-[#313a70] outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            {...field}
                          >
                            <option value="NAO_INICIADA">Não Iniciada</option>
                            <option value="EM_ANDAMENTO">Em Andamento</option>
                            <option value="CONCLUIDA">Concluída</option>
                            <option value="ATRASADA">Atrasada</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="progresso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                          Progresso (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            className="rounded-xl bg-blue-50 font-semibold text-[#313a70] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              <div className="flex flex-col justify-end gap-3 pt-6 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl sm:w-auto dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
                  onClick={fecharModal}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="w-full rounded-xl bg-[#48549e] text-white hover:bg-[#313a70] sm:w-auto dark:bg-blue-600"
                >
                  {acaoEmEdicao ? "Salvar Alterações" : "Salvar Ação"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-3xl bg-[#f4f7f9] p-0 sm:max-w-4xl dark:border-slate-800 dark:bg-slate-900">
          <div className="sticky top-0 z-10 flex flex-col justify-between gap-4 border-b border-gray-100 bg-white px-6 py-6 md:flex-row md:items-start md:px-8 dark:border-slate-800 dark:bg-slate-950">
            <div>
              <DialogTitle className="text-xl font-black tracking-tight text-[#313a70] md:text-2xl dark:text-white">
                Detalhes da Ação
              </DialogTitle>
              <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                {acaoSelecionada?.titulo}
              </p>
            </div>

            {acaoSelecionada && podeEditar(acaoSelecionada) && (
              <div className="flex w-full gap-2 md:w-auto">
                <button
                  onClick={() => {
                    setModalDetalhesAberto(false)
                    abrirModalEdicao(acaoSelecionada)
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-bold text-[#48549e] transition-colors hover:bg-indigo-100 md:flex-none dark:bg-blue-900/30 dark:text-blue-400"
                >
                  <PencilSimple size={16} weight="bold" /> Editar
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 md:flex-none dark:bg-red-900/30 dark:text-red-400">
                      <Trash size={16} weight="bold" /> Excluir
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[90vw] rounded-3xl md:w-auto dark:border-slate-800 dark:bg-slate-900">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-[#313a70] dark:text-white">
                        Excluir Ação
                      </AlertDialogTitle>
                      <AlertDialogDescription className="dark:text-gray-400">
                        Esta operação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col md:flex-row">
                      <AlertDialogCancel className="w-full rounded-xl md:w-auto dark:border-slate-700 dark:text-gray-300">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleExcluir(acaoSelecionada!.id)}
                        className="mt-2 w-full rounded-xl bg-red-500 text-white hover:bg-red-600 md:mt-0 md:w-auto"
                      >
                        Sim, Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          {acaoSelecionada && (
            <div className="px-4 pt-4 pb-8 md:px-8">
              <Tabs defaultValue="detalhes" className="w-full">
                <TabsList className="mb-6 flex h-auto w-full flex-col rounded-xl bg-gray-200/50 p-1 md:inline-flex md:flex-row md:justify-start dark:bg-slate-800">
                  <TabsTrigger
                    value="detalhes"
                    className="rounded-lg px-6 py-2.5 text-sm font-bold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-[#313a70] dark:text-gray-400 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white"
                  >
                    Visão Geral
                  </TabsTrigger>
                  <TabsTrigger
                    value="historico"
                    className="rounded-lg px-6 py-2.5 text-sm font-bold text-gray-500 data-[state=active]:bg-white data-[state=active]:text-[#313a70] dark:text-gray-400 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white"
                  >
                    Histórico
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="detalhes"
                  className="space-y-6 outline-none"
                >
                  <div className="space-y-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-6 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-4 dark:border-slate-800">
                      {getStatusBadge(acaoSelecionada.status)}
                      <Badge
                        variant="outline"
                        className="rounded-full border-gray-200 bg-gray-50 text-gray-600 shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                      >
                        {acaoSelecionada.secretaria.sigla}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                        Descrição da Ação
                      </h4>
                      <p className="rounded-xl bg-[#f8f9fc] p-4 text-sm leading-relaxed text-[#313a70] dark:bg-slate-800 dark:text-gray-300">
                        {acaoSelecionada.descricao}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="flex items-center gap-4 rounded-xl border border-blue-50 bg-[#f4f7f9] p-4 dark:border-blue-900/30 dark:bg-slate-800">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#45b7d1] dark:bg-slate-700">
                          <CalendarBlank size={20} weight="bold" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                            Prazo Limite
                          </p>
                          <p className="text-sm font-extrabold text-[#313a70] dark:text-white">
                            {formatarData(acaoSelecionada.prazo)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 rounded-xl border border-emerald-50 bg-[#eef8eb] p-4 dark:border-emerald-900/30 dark:bg-slate-800">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-500 dark:bg-slate-700">
                          <ChartBar size={20} weight="bold" />
                        </div>
                        <div className="w-full pr-2">
                          <div className="mb-1 flex justify-between">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                              Progresso Geral
                            </p>
                            <p className="text-xs font-extrabold text-[#313a70] dark:text-white">
                              {acaoSelecionada.progresso}%
                            </p>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                            <div
                              className="h-full bg-emerald-500 transition-all"
                              style={{ width: `${acaoSelecionada.progresso}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-6 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                      <h4 className="text-sm font-bold tracking-wider text-[#313a70] uppercase dark:text-white">
                        Etapas ({acaoSelecionada.subAcoes?.length || 0})
                      </h4>
                      {podeEditar(acaoSelecionada) && (
                        <button
                          onClick={() => abrirNovaSubAcao(acaoSelecionada.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-[#45b7d1]/10 px-3 py-1.5 text-xs font-bold text-[#45b7d1] hover:bg-[#45b7d1]/20 dark:bg-blue-900/30"
                        >
                          <Plus size={14} weight="bold" /> Nova Etapa
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {acaoSelecionada.subAcoes?.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex flex-col justify-between gap-4 rounded-xl border border-gray-100 bg-[#f8f9fc] p-4 md:flex-row md:items-center dark:border-slate-700 dark:bg-slate-800"
                        >
                          <div className="flex items-start gap-3">
                            <GitCommit
                              size={20}
                              className="mt-0.5 text-gray-400"
                              weight="bold"
                            />
                            <div>
                              <p className="text-sm font-bold text-[#313a70] dark:text-white">
                                {sub.titulo}
                              </p>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Gestor: {sub.responsavel?.nome}
                              </p>
                            </div>
                          </div>
                          <div className="flex w-full items-center justify-between gap-4 md:w-auto md:justify-end">
                            <div className="flex flex-col items-start md:items-end">
                              <span className="text-xs font-bold text-[#45b7d1]">
                                {sub.progresso}%
                              </span>
                              <div className="mt-1 flex h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                                <div
                                  className="h-full bg-[#45b7d1]"
                                  style={{ width: `${sub.progresso}%` }}
                                />
                              </div>
                            </div>

                            {podeEditar(acaoSelecionada) && (
                              <div className="flex gap-2 border-l border-gray-200 pl-4 dark:border-slate-600">
                                <button
                                  onClick={() => {
                                    setModalDetalhesAberto(false)
                                    abrirModalEdicao(sub)
                                  }}
                                  className="text-gray-400 hover:text-[#45b7d1]"
                                >
                                  <PencilSimple size={18} weight="bold" />
                                </button>
                                <button
                                  onClick={() => handleExcluir(sub.id, true)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <Trash size={18} weight="bold" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="historico" className="outline-none">
                  <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="mb-8 text-lg font-bold text-[#313a70] dark:text-white">
                      Linha do Tempo de Alterações
                    </h3>
                    {acaoSelecionada.eventos &&
                    acaoSelecionada.eventos.length > 0 ? (
                      <div className="relative ml-3 space-y-8 border-l-2 border-dashed border-gray-200 pl-6 dark:border-slate-700">
                        {acaoSelecionada.eventos.map((evento: any) => (
                          <div key={evento.id} className="relative">
                            <span className="absolute top-0 -left-10 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-indigo-50 text-[#48549e] shadow-sm dark:border-slate-900 dark:bg-blue-900 dark:text-blue-300">
                              <Clock size={14} weight="bold" />
                            </span>
                            <div className="rounded-xl border border-gray-100 bg-[#f8f9fc] p-4 dark:border-slate-700 dark:bg-slate-800">
                              <div className="mb-1.5 flex items-center justify-between">
                                <span className="text-xs font-black tracking-widest text-[#45b7d1] uppercase">
                                  {evento.tipo.replace(/_/g, " ")}
                                </span>
                                <span className="text-xs font-semibold text-gray-400">
                                  {new Date(evento.criadoEm).toLocaleString(
                                    "pt-BR",
                                  )}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-[#313a70] dark:text-white">
                                {evento.descricao}
                              </p>
                              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                                <User size={14} className="text-gray-400" />{" "}
                                Feito por:{" "}
                                <span className="font-bold text-gray-700 dark:text-gray-300">
                                  {evento.usuario?.nome || "Sistema"}
                                </span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-gray-400 dark:border-slate-700 dark:bg-slate-800/50">
                        <Clock size={40} className="mb-3 opacity-30" />
                        <p className="font-bold text-[#313a70] dark:text-white">
                          Nenhum registro encontrado.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
