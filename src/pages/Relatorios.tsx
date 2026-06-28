/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { FilePdf, FileXls, DownloadSimple, Funnel } from "@phosphor-icons/react"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

type Acao = {
  id: number
  titulo: string
  status: string
  prazo: string
  progresso: number
  eixoId?: number
  odsId?: number
  eixo?: { id: number; nome: string }
  ods?: { codigo: string; nome: string }
  secretaria: { id: number; sigla: string; nome: string }
  responsavelId: number
  responsavel?: { nome: string }
}

type ItemSelect = { id: number; nome: string; sigla?: string; codigo?: string }

type RelatorioGerado = {
  id: string
  nome: string
  dataGeracao: string
  formato: "PDF" | "Excel"
  tamanho: string
  urlDownload: string
  geradoPor: string
}

export function Relatorios() {
  const { usuario } = useAuth()

  const rolesComVisaoGlobal = ["ADMIN", "PREFEITO"]
  const temVisaoGlobal = rolesComVisaoGlobal.includes(usuario?.role || "")

  const [acoes, setAcoes] = useState<Acao[]>([])
  const [eixos, setEixos] = useState<ItemSelect[]>([])
  const [ods, setOds] = useState<ItemSelect[]>([])
  const [secretarias, setSecretarias] = useState<ItemSelect[]>([])

  const [relatoriosHistorico, setRelatoriosHistorico] = useState<
    RelatorioGerado[]
  >([])

  const [filtroStatus, setFiltroStatus] = useState("TODOS")
  const [filtroSecretaria, setFiltroSecretaria] = useState("TODAS")
  const [filtroEixo, setFiltroEixo] = useState("TODOS")
  const [filtroODS, setFiltroODS] = useState("TODOS")

  const [nomeArquivoInput, setNomeArquivoInput] = useState("")
  const [carregandoListas, setCarregandoListas] = useState(true)

  async function carregarDados() {
    setCarregandoListas(true)
    try {
      const paramsHistorico = {
        roleLogado: usuario?.role,
        usuarioIdLogado: usuario?.id,
      };

      const [resAcoes, resHistorico, resEixos, resOds, resSec] =
        await Promise.all([
          api.get("/acoes"),
          api.get("/relatorios-gerados", { params: paramsHistorico }),
          api.get("/eixos"),
          api.get("/ods"),
          api.get("/secretarias"),
        ])
      setAcoes(resAcoes.data)
      setRelatoriosHistorico(resHistorico.data)
      setEixos(resEixos.data)
      setOds(resOds.data)
      setSecretarias(resSec.data)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setCarregandoListas(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const acoesPermitidas = acoes.filter((acao) => {
    if (temVisaoGlobal) return true
    return acao.responsavelId === Number(usuario?.id)
  })

  // 🛡️ Filtro Avançado
  const acoesFiltradas = acoesPermitidas.filter((acao) => {
    const matchStatus = filtroStatus === "TODOS" || acao.status === filtroStatus
    const matchSecretaria =
      filtroSecretaria === "TODAS" || acao.secretaria?.nome === filtroSecretaria
    const matchEixo =
      filtroEixo === "TODOS" ||
      (acao.eixoId || acao.eixo?.id)?.toString() === filtroEixo
    const matchODS =
      filtroODS === "TODOS" ||
      acao.ods?.nome === filtroODS ||
      acao.ods?.codigo === filtroODS

    return matchStatus && matchSecretaria && matchEixo && matchODS
  })

  const formatarDataBr = (dataIso: string) => {
    if (!dataIso) return "-"
    return new Intl.DateTimeFormat("pt-BR").format(new Date(dataIso))
  }

  const formatarDataIsoParaExibicao = (dataIso: string) => {
    const data = new Date(dataIso)
    return (
      data.toLocaleDateString("pt-BR") +
      " às " +
      data.toLocaleTimeString("pt-BR").slice(0, 5)
    )
  }

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

  const adicionarAoHistoricoBackend = async (
    nome: string,
    formato: "PDF" | "Excel",
    tamanhoBytes: number,
  ) => {
    const tamanhoFormatado =
      tamanhoBytes > 1024 * 1024
        ? `${(tamanhoBytes / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(tamanhoBytes / 1024)} KB`

    try {
      await api.post("/relatorios-gerados", {
        nome,
        formato,
        tamanho: tamanhoFormatado,
        geradoPorId: Number(usuario?.id),
      })
      carregarDados()
    } catch (error: any) {
      console.error("Erro ao salvar histórico do relatório no banco:", error)
      alert(
        "O arquivo baixou, mas houve um erro ao registrar no histórico oficial: " +
          (error.response?.data?.message || error.message),
      )
    }
  }

  const obterNomeArquivo = (extensao: ".pdf" | ".xlsx") => {
    const dataFormatada = new Date().toISOString().slice(0, 10)
    if (nomeArquivoInput.trim() !== "") {
      let nomeLimpo = nomeArquivoInput.trim().replace(/[^a-zA-Z0-9-_]/g, "_")
      if (!nomeLimpo.endsWith(extensao)) nomeLimpo += extensao
      return nomeLimpo
    }
    return `Relatorio_Acoes_${dataFormatada}${extensao}`
  }

  const construirPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const dataAtual = new Date()

    doc.setFontSize(18)
    doc.setTextColor(49, 58, 112)
    doc.text("Prefeitura Municipal de Goiana", 105, 15, { align: "center" })
    doc.setFontSize(14)
    doc.text("Relatório de Monitoramento de Ações", 105, 22, {
      align: "center",
    })

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(
      `Emitido em: ${dataAtual.toLocaleDateString("pt-BR")} às ${dataAtual.toLocaleTimeString("pt-BR")}`,
      15,
      30,
    )

    // Mostrando os filtros aplicados no PDF
    const filtroSecText =
      filtroSecretaria !== "TODAS" ? ` | Sec: ${filtroSecretaria}` : ""
    const filtroStatusText =
      filtroStatus !== "TODOS"
        ? ` | Status: ${filtroStatus.replace("_", " ")}`
        : ""
    doc.text(`Filtros: Base Geral${filtroSecText}${filtroStatusText}`, 15, 35)

    const columns = [
      "Título da Ação",
      "Secretaria",
      "Responsável",
      "Prazo",
      "Status",
    ]

    const rows = acoesFiltradas.map((acao) => [
      acao.titulo,
      acao.secretaria?.sigla || "-",
      acao.responsavel?.nome || "Não atribuído",
      formatarDataBr(acao.prazo),
      acao.status.replace("_", " "),
    ])

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 40,
      theme: "striped",
      headStyles: {
        fillColor: [69, 183, 209],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
      },
    })

    return doc
  }

  const handleBaixarPdf = async () => {
    if (acoesFiltradas.length === 0) return alert("Não há ações para exportar.")

    const doc = construirPdf()
    const nomeFinal = obterNomeArquivo(".pdf")

    const pdfBlob = doc.output("blob")

    doc.save(nomeFinal)
    await adicionarAoHistoricoBackend(nomeFinal, "PDF", pdfBlob.size)
    setNomeArquivoInput("")
  }

  const handleVisualizarPdf = () => {
    if (acoesFiltradas.length === 0)
      return alert("Não há ações para visualizar.")

    const doc = construirPdf()
    const pdfBlob = doc.output("blob")
    const url = URL.createObjectURL(pdfBlob)
    window.open(url, "_blank")
  }

  const handleBaixarExcel = async () => {
    if (acoesFiltradas.length === 0) return alert("Não há ações para exportar.")

    const nomeFinal = obterNomeArquivo(".xlsx")

    const dadosExcel = acoesFiltradas.map((acao) => ({
      "ID da Ação": acao.id,
      "Título da Ação": acao.titulo,
      "Secretaria (Sigla)": acao.secretaria?.sigla || "-",
      "Gestor Responsável": acao.responsavel?.nome || "Não atribuído",
      "Prazo Limite": formatarDataBr(acao.prazo),
      "Status Atual": acao.status.replace("_", " "),
      "Progresso (%)": acao.progresso,
    }))

    const worksheet = XLSX.utils.json_to_sheet(dadosExcel)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ações Municipais")

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    })
    const excelBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    XLSX.writeFile(workbook, nomeFinal)
    await adicionarAoHistoricoBackend(nomeFinal, "Excel", excelBlob.size)
    setNomeArquivoInput("")
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between md:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#313a70] md:text-3xl dark:text-white">
            Relatórios
          </h1>
          <p className="mt-1 text-sm text-gray-500 md:text-base dark:text-gray-400">
            Geração e exportação de dados do sistema
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <Card className="flex flex-col rounded-2xl border-gray-100 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-[#313a70] dark:text-white">
              Painel de Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Status
                </Label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-[#313a70] outline-none focus:border-[#45b7d1] dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="CONCLUIDA">Apenas Concluídas</option>
                  <option value="EM_ANDAMENTO">Apenas Em Andamento</option>
                  <option value="ATRASADA">Apenas Atrasadas</option>
                  <option value="NAO_INICIADA">Apenas Não Iniciadas</option>
                </select>
              </div>

              <div>
                <Label className="mb-2 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Secretaria
                </Label>
                <select
                  value={filtroSecretaria}
                  onChange={(e) => setFiltroSecretaria(e.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-[#313a70] outline-none focus:border-[#45b7d1] dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                >
                  <option value="TODAS">Todas as Secretarias</option>
                  {secretarias.map((s) => (
                    <option key={s.id} value={s.nome}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="mb-2 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Eixo Estratégico
                </Label>
                <select
                  value={filtroEixo}
                  onChange={(e) => setFiltroEixo(e.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-[#313a70] outline-none focus:border-[#45b7d1] dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                >
                  <option value="TODOS">Todos os Eixos</option>
                  {eixos.map((e) => (
                    <option key={e.id} value={String(e.id)}>
                      {e.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="mb-2 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                  ODS
                </Label>
                <select
                  value={filtroODS}
                  onChange={(e) => setFiltroODS(e.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-[#313a70] outline-none focus:border-[#45b7d1] dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                >
                  <option value="TODOS">Todas as ODS</option>
                  {ods.map((o) => (
                    <option key={o.id} value={o.nome}>
                      {o.codigo} - {o.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={handleVisualizarPdf}
              className="mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#313a70] px-6 text-white shadow-sm hover:bg-[#1e2446] dark:bg-blue-600"
            >
              <Funnel size={20} weight="bold" /> Visualizar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col rounded-2xl border-gray-100 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-[#313a70] dark:text-white">
              Exportação Oficial
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-end gap-4">
            <div>
              <Label className="mb-2 block text-xs font-bold tracking-wider text-gray-400 uppercase">
                Nome do Arquivo (Opcional)
              </Label>
              <Input
                placeholder="Ex: Balanco_Semestral_Saude"
                value={nomeArquivoInput}
                onChange={(e) => setNomeArquivoInput(e.target.value)}
                className="h-12 rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 focus:border-[#45b7d1] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:gap-4">
              <Button
                onClick={handleBaixarPdf}
                className="h-12 flex-1 gap-2 rounded-xl bg-red-50 text-red-600 shadow-none hover:bg-red-100 hover:text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
              >
                <FilePdf size={20} weight="bold" /> Baixar PDF
              </Button>
              <Button
                onClick={handleBaixarExcel}
                className="h-12 flex-1 gap-2 rounded-xl bg-emerald-50 text-emerald-600 shadow-none hover:bg-emerald-100 hover:text-emerald-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
              >
                <FileXls size={20} weight="bold" /> Baixar Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Visualização das Ações */}
      <Card className="mb-8 overflow-hidden rounded-2xl border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="border-b border-gray-50 bg-[#f4f7f9]/50 p-4 md:p-6 dark:border-slate-800 dark:bg-slate-950">
          <CardTitle className="text-lg text-[#313a70] dark:text-white">
            Pré-Visualização do Filtro ({acoesFiltradas.length} Encontradas)
          </CardTitle>
        </CardHeader>
        <div className="w-full overflow-x-auto">
          <Table className="min-w-175">
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50">
                <TableHead className="py-4 pl-6 text-xs font-bold tracking-wider text-gray-400">
                  TÍTULO DA AÇÃO
                </TableHead>
                <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                  SECRETARIA
                </TableHead>
                <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                  RESPONSÁVEL
                </TableHead>
                <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                  PRAZO
                </TableHead>
                <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                  STATUS
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {acoesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-gray-500"
                  >
                    Nenhuma ação atende aos critérios deste filtro.
                  </TableCell>
                </TableRow>
              ) : (
                acoesFiltradas.map((acao) => (
                  <TableRow
                    key={acao.id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50/30 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="py-4 pl-6 font-bold text-[#313a70] dark:text-white">
                      {acao.titulo}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      <Badge
                        variant="outline"
                        className="rounded-full border-gray-200 bg-gray-50 text-gray-600 shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                      >
                        {acao.secretaria?.sigla || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">
                      {acao.responsavel?.nome || "Não atribuído"}
                    </TableCell>
                    <TableCell className="font-medium text-gray-600 dark:text-gray-300">
                      {formatarDataBr(acao.prazo)}
                    </TableCell>
                    <TableCell>{getStatusBadge(acao.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Tabela de Relatórios Históricos */}
      <Card className="overflow-hidden rounded-2xl border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="flex flex-col items-start justify-between gap-2 border-b border-gray-50 bg-[#f4f7f9]/50 p-4 md:flex-row md:items-center md:p-6 dark:border-slate-800 dark:bg-slate-950">
          <div>
            <CardTitle className="text-lg text-[#313a70] dark:text-white">
              Histórico de Relatórios
            </CardTitle>
            <CardDescription className="mt-1 font-medium text-gray-400">
              Registro histórico oficial dos documentos exportados.
            </CardDescription>
          </div>
        </CardHeader>
        <div className="w-full overflow-x-auto">
          <Table className="min-w-175">
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/50">
                <TableHead className="py-4 pl-6 text-xs font-bold tracking-wider text-gray-400">
                  NOME DO ARQUIVO
                </TableHead>
                <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                  GERADO POR
                </TableHead>
                <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                  DATA E HORA
                </TableHead>
                <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                  FORMATO
                </TableHead>
                <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                  TAMANHO
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregandoListas ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-gray-400"
                  >
                    Carregando histórico do servidor...
                  </TableCell>
                </TableRow>
              ) : relatoriosHistorico.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-gray-400"
                  >
                    <DownloadSimple
                      size={48}
                      weight="thin"
                      className="mx-auto mb-4 opacity-50"
                    />
                    Nenhum relatório foi gerado. Utilize os botões acima para
                    exportar seus dados.
                  </TableCell>
                </TableRow>
              ) : (
                relatoriosHistorico.map((relatorio) => (
                  <TableRow
                    key={relatorio.id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50/30 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="py-4 pl-6 font-bold text-[#313a70] dark:text-white">
                      {relatorio.nome}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {relatorio.geradoPor}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {formatarDataIsoParaExibicao(relatorio.dataGeracao)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${relatorio.formato === "PDF" ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-emerald-50 text-emerald-600 dark:bg-green-900/30 dark:text-green-400"}`}
                      >
                        {relatorio.formato}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-400">
                      {relatorio.tamanho}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </DashboardLayout>
  )
}
