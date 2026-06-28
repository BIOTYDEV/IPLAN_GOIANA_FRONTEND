/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { DashboardLayout } from "@/components/DashboardLayout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  User,
  Bell,
  Shield,
  Buildings,
  Target,
  GlobeHemisphereWest,
  Plus,
  Trash,
  PencilSimple,
  Camera,
} from "@phosphor-icons/react"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { Badge } from "@/components/ui/badge"

type Secretaria = { id: number; nome: string; sigla: string }
type Eixo = { id: number; nome: string; descricao?: string }
type Ods = { id: number; codigo: string; nome: string; descricao?: string }

const secretariaSchema = z.object({
  nome: z.string().min(3, "Mínimo de 3 caracteres"),
  sigla: z.string().min(2, "Mínimo de 2 caracteres").toUpperCase(),
})
const eixoSchema = z.object({
  nome: z.string().min(3, "Mínimo de 3 caracteres"),
})
const odsSchema = z.object({
  codigo: z.string().min(1, "Obrigatório").max(10, "Máximo 10 caracteres"),
  nome: z.string().min(3, "Mínimo de 3 caracteres"),
})

export function Configuracoes() {
  const { usuario } = useAuth()
  const isAdmin = usuario?.role === "ADMIN"

  const [secretarias, setSecretarias] = useState<Secretaria[]>([])
  const [eixos, setEixos] = useState<Eixo[]>([])
  const [ods, setOds] = useState<Ods[]>([])

  const [modalSec, setModalSec] = useState(false)
  const [editingSec, setEditingSec] = useState<number | null>(null)

  const [modalEixo, setModalEixo] = useState(false)
  const [editingEixo, setEditingEixo] = useState<number | null>(null)

  const [modalOds, setModalOds] = useState(false)
  const [editingOds, setEditingOds] = useState<number | null>(null)

  const fotoInputRef = useRef<HTMLInputElement>(null)
  const [fazendoUpload, setFazendoUpload] = useState(false)

  const [notifPrazo, setNotifPrazo] = useState(true)
  const [notifConcluida, setNotifConcluida] = useState(true)
  const [notifRelatorio, setNotifRelatorio] = useState(false)

  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")

  const formSec = useForm<z.infer<typeof secretariaSchema>>({
    resolver: zodResolver(secretariaSchema),
    defaultValues: { nome: "", sigla: "" },
  })
  const formEixo = useForm<z.infer<typeof eixoSchema>>({
    resolver: zodResolver(eixoSchema),
    defaultValues: { nome: "" },
  })
  const formOds = useForm<z.infer<typeof odsSchema>>({
    resolver: zodResolver(odsSchema),
    defaultValues: { codigo: "", nome: "" },
  })

  const carregarDadosAdmin = useCallback(async () => {
    if (!isAdmin) return
    try {
      const [resSec, resEixos, resOds] = await Promise.all([
        api.get("/secretarias"),
        api.get("/eixos"),
        api.get("/ods"),
      ])
      setSecretarias(resSec.data)
      setEixos(resEixos.data)
      setOds(resOds.data)
    } catch (error) {
      console.error("Erro ao carregar dados admin:", error)
    }
  }, [isAdmin])

  useEffect(() => {
    carregarDadosAdmin()

    if (usuario?.id) {
      setNotifPrazo(
        localStorage.getItem(`@Goiana:notifPrazo_${usuario.id}`) !== "false",
      )
      setNotifConcluida(
        localStorage.getItem(`@Goiana:notifConc_${usuario.id}`) !== "false",
      )
      setNotifRelatorio(
        localStorage.getItem(`@Goiana:notifRel_${usuario.id}`) === "true",
      )
    }
  }, [carregarDadosAdmin, usuario?.id])

  const mostrarErro = (error: any, acao: string) => {
    const msg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Erro de conexão com o servidor."
    alert(
      `Ocorreu um erro ao ${acao}:\n\n${Array.isArray(msg) ? msg.join(", ") : msg}`,
    )
  }

  const onSubmitSec = async (values: z.infer<typeof secretariaSchema>) => {
    try {
      if (editingSec) await api.patch(`/secretarias/${editingSec}`, values)
      else await api.post("/secretarias", values)
      setModalSec(false)
      setEditingSec(null)
      formSec.reset()
      carregarDadosAdmin()
    } catch (error) {
      mostrarErro(error, "Salvar Secretaria")
    }
  }

  const onSubmitEixo = async (values: z.infer<typeof eixoSchema>) => {
    try {
      if (editingEixo) await api.patch(`/eixos/${editingEixo}`, values)
      else await api.post("/eixos", values)
      setModalEixo(false)
      setEditingEixo(null)
      formEixo.reset()
      carregarDadosAdmin()
    } catch (error) {
      mostrarErro(error, "Salvar Eixo")
    }
  }

  const onSubmitOds = async (values: z.infer<typeof odsSchema>) => {
    try {
      if (editingOds) await api.patch(`/ods/${editingOds}`, values)
      else await api.post("/ods", values)
      setModalOds(false)
      setEditingOds(null)
      formOds.reset()
      carregarDadosAdmin()
    } catch (error) {
      mostrarErro(error, "Salvar ODS")
    }
  }

  const handleDelete = async (rota: string, id: number) => {
    if (
      !confirm(
        "Deseja realmente excluir este item? Ele pode estar vinculado a ações existentes.",
      )
    )
      return
    try {
      await api.delete(`/${rota}/${id}`)
      carregarDadosAdmin()
    } catch (error) {
      mostrarErro(error, `Excluir ${rota}`)
    }
  }

  const abrirEdicaoSec = (sec: Secretaria) => {
    setEditingSec(sec.id)
    formSec.reset({ nome: sec.nome, sigla: sec.sigla })
    setModalSec(true)
  }
  const abrirEdicaoEixo = (eixo: Eixo) => {
    setEditingEixo(eixo.id)
    formEixo.reset({ nome: eixo.nome })
    setModalEixo(true)
  }
  const abrirEdicaoOds = (item: Ods) => {
    setEditingOds(item.id)
    formOds.reset({ codigo: item.codigo, nome: item.nome })
    setModalOds(true)
  }

  const handleAtualizarSenha = async () => {
    if (!novaSenha || novaSenha.length < 6)
      return alert("A nova senha deve ter no mínimo 6 caracteres.")
    if (novaSenha !== confirmarSenha) return alert("As senhas não conferem.")
    try {
      await api.patch(`/usuarios/${usuario?.id}`, { senha: novaSenha })
      alert("Sua senha foi atualizada com sucesso!")
      setSenhaAtual("")
      setNovaSenha("")
      setConfirmarSenha("")
    } catch (error: any) {
      alert(
        `Erro ao atualizar a senha: ${error.response?.data?.message || "Verifique sua conexão"}`,
      )
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !usuario) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      setFazendoUpload(true)

      const response = await api.post(
        `/usuarios/${usuario.id}/foto`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      )

      const chaves = Object.keys(localStorage)
      const chaveUsuario = chaves.find(
        (k) =>
          k.toLowerCase().includes("usuario") ||
          k.toLowerCase().includes("user"),
      )

      if (chaveUsuario) {
        const userCache = JSON.parse(localStorage.getItem(chaveUsuario) || "{}")
        userCache.fotoPerfil = response.data.fotoPerfil
        localStorage.setItem(chaveUsuario, JSON.stringify(userCache))
      }

      alert("Foto atualizada com sucesso!")
      window.location.reload()
    } catch (error) {
      console.error("Erro no upload da foto:", error) // <-- Corrigido aqui
      alert("Falha ao enviar a foto. Tente novamente.")
    } finally {
      setFazendoUpload(false)
    }
  }

  const handleToggleNotif = (
    key: string,
    value: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    setter(value)
    localStorage.setItem(`@Goiana:${key}_${usuario?.id}`, String(value))
  }

  const getInitials = (name?: string) => {
    if (!name) return "AD"
    const names = name.split(" ")
    if (names.length >= 2)
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const baseURL = api.defaults.baseURL
  const fotoPerfil = (usuario as any)?.fotoPerfil

  return (
    <DashboardLayout>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-[#313a70] md:text-3xl dark:text-white">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-gray-500 md:text-base dark:text-gray-400">
          Gerencie suas preferências de conta e do sistema
        </p>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <div className="scrollbar-hide mb-6 w-full overflow-x-auto pb-2">
          <TabsList className="inline-flex h-auto min-w-max justify-start rounded-full border border-gray-100 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <TabsTrigger
              value="perfil"
              className="shrink-0 rounded-full px-4 py-2 text-xs font-bold text-gray-500 data-[state=active]:bg-[#313a70] data-[state=active]:text-white md:px-6 md:py-2.5 md:text-sm dark:text-gray-400 dark:data-[state=active]:bg-blue-600"
            >
              <User size={18} className="mr-2 hidden sm:block" weight="bold" />{" "}
              Meu Perfil
            </TabsTrigger>
            <TabsTrigger
              value="notificacoes"
              className="shrink-0 rounded-full px-4 py-2 text-xs font-bold text-gray-500 data-[state=active]:bg-[#313a70] data-[state=active]:text-white md:px-6 md:py-2.5 md:text-sm dark:text-gray-400 dark:data-[state=active]:bg-blue-600"
            >
              <Bell size={18} className="mr-2 hidden sm:block" weight="bold" />{" "}
              Notificações
            </TabsTrigger>
            <TabsTrigger
              value="seguranca"
              className="shrink-0 rounded-full px-4 py-2 text-xs font-bold text-gray-500 data-[state=active]:bg-[#313a70] data-[state=active]:text-white md:px-6 md:py-2.5 md:text-sm dark:text-gray-400 dark:data-[state=active]:bg-blue-600"
            >
              <Shield
                size={18}
                className="mr-2 hidden sm:block"
                weight="bold"
              />{" "}
              Segurança
            </TabsTrigger>

            {isAdmin && (
              <>
                <div className="mx-2 hidden w-px bg-gray-200 sm:block dark:bg-slate-700"></div>
                <TabsTrigger
                  value="secretarias"
                  className="shrink-0 rounded-full px-4 py-2 text-xs font-bold text-gray-500 data-[state=active]:bg-[#313a70] data-[state=active]:text-white md:px-6 md:py-2.5 md:text-sm dark:text-gray-400 dark:data-[state=active]:bg-blue-600"
                >
                  <Buildings
                    size={18}
                    className="mr-2 hidden sm:block"
                    weight="bold"
                  />{" "}
                  Secretarias
                </TabsTrigger>
                <TabsTrigger
                  value="eixos"
                  className="shrink-0 rounded-full px-4 py-2 text-xs font-bold text-gray-500 data-[state=active]:bg-[#313a70] data-[state=active]:text-white md:px-6 md:py-2.5 md:text-sm dark:text-gray-400 dark:data-[state=active]:bg-blue-600"
                >
                  <Target
                    size={18}
                    className="mr-2 hidden sm:block"
                    weight="bold"
                  />{" "}
                  Eixos
                </TabsTrigger>
                <TabsTrigger
                  value="ods"
                  className="shrink-0 rounded-full px-4 py-2 text-xs font-bold text-gray-500 data-[state=active]:bg-[#313a70] data-[state=active]:text-white md:px-6 md:py-2.5 md:text-sm dark:text-gray-400 dark:data-[state=active]:bg-blue-600"
                >
                  <GlobeHemisphereWest
                    size={18}
                    className="mr-2 hidden sm:block"
                    weight="bold"
                  />{" "}
                  ODS
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        {/* ABA: MEU PERFIL */}
        <TabsContent
          value="perfil"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none"
        >
          <Card className="rounded-2xl border-gray-100 shadow-sm md:rounded-3xl dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="border-b border-gray-50 p-4 pb-4 md:p-8 md:pb-6 dark:border-slate-800/50">
              <CardTitle className="text-lg font-bold text-[#313a70] md:text-xl dark:text-white">
                Informações Pessoais
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Atualize sua foto e visualize seus dados cadastrais.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-8">
              <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:gap-6 sm:text-left">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#45b7d1] text-3xl font-bold text-white shadow-inner md:h-28 md:w-28 md:text-4xl">
                    {fazendoUpload ? (
                      <span className="animate-spin text-lg">⏳</span>
                    ) : fotoPerfil ? (
                      <img
                        src={`${baseURL}/usuarios/foto/${fotoPerfil}`}
                        alt="Foto de perfil"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(usuario?.nome)
                    )}
                  </div>
                  <button
                    onClick={() => fotoInputRef.current?.click()}
                    disabled={fazendoUpload}
                    className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#313a70] text-white shadow-md transition-transform hover:scale-110 disabled:opacity-50 dark:bg-blue-600"
                  >
                    <Camera size={16} weight="fill" />
                  </button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fotoInputRef}
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <div>
                  <h3 className="text-lg font-bold text-[#313a70] md:text-xl dark:text-white">
                    {usuario?.nome}
                  </h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {usuario?.role}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Nome Completo
                  </Label>
                  <Input
                    defaultValue={usuario?.nome}
                    disabled
                    className="h-12 rounded-xl border-gray-200 bg-gray-50 text-gray-600 opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                    E-mail Institucional
                  </Label>
                  <Input
                    defaultValue={usuario?.email}
                    disabled
                    className="h-12 rounded-xl border-gray-200 bg-gray-50 text-gray-600 opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: NOTIFICAÇÕES */}
        <TabsContent
          value="notificacoes"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none"
        >
          <Card className="rounded-2xl border-gray-100 shadow-sm md:rounded-3xl dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="border-b border-gray-50 p-4 pb-4 md:p-8 md:pb-6 dark:border-slate-800/50">
              <CardTitle className="text-lg font-bold text-[#313a70] md:text-xl dark:text-white">
                Preferências de Alertas
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Escolha como você deseja ser avisado no sistema e por e-mail.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-8">
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-colors hover:border-[#45b7d1]/30 hover:bg-blue-50/30 sm:flex-row sm:items-center md:p-5 dark:border-slate-700 dark:bg-slate-800">
                <div className="space-y-1">
                  <Label className="text-base font-bold text-[#313a70] dark:text-white">
                    Alertas de Prazo
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receber e-mail quando uma ação estiver próxima do
                    vencimento.
                  </p>
                </div>
                <Switch
                  checked={notifPrazo}
                  onCheckedChange={(val) =>
                    handleToggleNotif("notifPrazo", val, setNotifPrazo)
                  }
                  className="self-start data-[state=checked]:bg-[#45b7d1] sm:self-auto"
                />
              </div>
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-colors hover:border-[#45b7d1]/30 hover:bg-blue-50/30 sm:flex-row sm:items-center md:p-5 dark:border-slate-700 dark:bg-slate-800">
                <div className="space-y-1">
                  <Label className="text-base font-bold text-[#313a70] dark:text-white">
                    Ações Concluídas
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ser notificado no sistema quando uma tarefa for finalizada.
                  </p>
                </div>
                <Switch
                  checked={notifConcluida}
                  onCheckedChange={(val) =>
                    handleToggleNotif("notifConc", val, setNotifConcluida)
                  }
                  className="self-start data-[state=checked]:bg-[#45b7d1] sm:self-auto"
                />
              </div>
              <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-colors hover:border-[#45b7d1]/30 hover:bg-blue-50/30 sm:flex-row sm:items-center md:p-5 dark:border-slate-700 dark:bg-slate-800">
                <div className="space-y-1">
                  <Label className="text-base font-bold text-[#313a70] dark:text-white">
                    Relatórios Automáticos
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receber um resumo semanal em PDF no seu e-mail
                    institucional.
                  </p>
                </div>
                <Switch
                  checked={notifRelatorio}
                  onCheckedChange={(val) =>
                    handleToggleNotif("notifRel", val, setNotifRelatorio)
                  }
                  className="self-start data-[state=checked]:bg-[#45b7d1] sm:self-auto"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: SEGURANÇA */}
        <TabsContent
          value="seguranca"
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none"
        >
          <Card className="rounded-2xl border-gray-100 shadow-sm md:rounded-3xl dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="border-b border-gray-50 p-4 pb-4 md:p-8 md:pb-6 dark:border-slate-800/50">
              <CardTitle className="text-lg font-bold text-[#313a70] md:text-xl dark:text-white">
                Alterar Senha
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Mantenha sua conta segura atualizando sua senha regularmente.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-w-md space-y-4 p-4 md:space-y-5 md:p-8">
              <div className="space-y-2">
                <Label className="text-xs font-bold tracking-wider text-[#313a70] uppercase dark:text-gray-300">
                  Senha Atual
                </Label>
                <Input
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:border-[#45b7d1] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold tracking-wider text-[#313a70] uppercase dark:text-gray-300">
                  Nova Senha
                </Label>
                <Input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:border-[#45b7d1] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold tracking-wider text-[#313a70] uppercase dark:text-gray-300">
                  Confirmar Nova Senha
                </Label>
                <Input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 rounded-xl border-gray-200 bg-gray-50 text-gray-900 focus:border-[#45b7d1] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="pt-2 md:pt-4">
                <Button
                  onClick={handleAtualizarSenha}
                  className="h-12 w-full rounded-xl bg-[#45b7d1] text-base font-bold text-white shadow-sm hover:bg-[#3ba2ba] dark:bg-blue-600"
                >
                  Salvar Nova Senha
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABAS ADMIN: SECRETARIAS / EIXOS / ODS */}
        {isAdmin && (
          <>
            <TabsContent
              value="secretarias"
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none"
            >
              <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#313a70] dark:text-white">
                    Órgãos e Secretarias
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Departamentos responsáveis por executar as ações.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingSec(null)
                    formSec.reset({ nome: "", sigla: "" })
                    setModalSec(true)
                  }}
                  className="w-full gap-2 rounded-xl bg-[#45b7d1] text-white shadow-sm hover:bg-[#3ba2ba] md:w-auto dark:bg-blue-600"
                >
                  <Plus weight="bold" /> Nova
                </Button>
              </div>
              <Card className="overflow-hidden rounded-2xl border-gray-100 bg-white shadow-sm md:rounded-3xl dark:border-slate-800 dark:bg-slate-900">
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-150">
                    <TableHeader className="bg-gray-50/50 dark:bg-slate-800/50">
                      <TableRow>
                        <TableHead className="py-4 pl-6 text-xs font-bold tracking-wider text-gray-400">
                          NOME DA SECRETARIA
                        </TableHead>
                        <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                          SIGLA
                        </TableHead>
                        <TableHead className="pr-6 text-right text-xs font-bold tracking-wider text-gray-400">
                          AÇÕES
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {secretarias.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="py-6 text-center text-gray-400"
                          >
                            Nenhuma cadastrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        secretarias.map((sec) => (
                          <TableRow
                            key={sec.id}
                            className="border-b border-gray-50 transition-colors hover:bg-gray-50/30 dark:border-slate-800 dark:hover:bg-slate-800/50"
                          >
                            <TableCell className="py-4 pl-6 font-bold text-[#313a70] dark:text-white">
                              {sec.nome}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="rounded-full border-gray-200 bg-gray-50 font-semibold text-gray-600 shadow-none dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300"
                              >
                                {sec.sigla}
                              </Badge>
                            </TableCell>
                            <TableCell className="pr-6 text-right">
                              <div className="flex justify-end gap-3 text-[#9ca7b8] dark:text-gray-500">
                                <button
                                  onClick={() => abrirEdicaoSec(sec)}
                                  className="transition-colors hover:text-[#45b7d1] dark:hover:text-blue-400"
                                  title="Editar"
                                >
                                  <PencilSimple size={20} weight="bold" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDelete("secretarias", sec.id)
                                  }
                                  className="transition-colors hover:text-red-500"
                                  title="Excluir"
                                >
                                  <Trash size={20} weight="bold" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent
              value="eixos"
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none"
            >
              <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#313a70] dark:text-white">
                    Eixos Estratégicos
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pilares do plano de governo municipal.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingEixo(null)
                    formEixo.reset({ nome: "" })
                    setModalEixo(true)
                  }}
                  className="w-full gap-2 rounded-xl bg-[#45b7d1] text-white shadow-sm hover:bg-[#3ba2ba] md:w-auto dark:bg-blue-600"
                >
                  <Plus weight="bold" /> Novo
                </Button>
              </div>
              <Card className="overflow-hidden rounded-2xl border-gray-100 bg-white shadow-sm md:rounded-3xl dark:border-slate-800 dark:bg-slate-900">
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-125">
                    <TableHeader className="bg-gray-50/50 dark:bg-slate-800/50">
                      <TableRow>
                        <TableHead className="py-4 pl-6 text-xs font-bold tracking-wider text-gray-400">
                          NOME DO EIXO
                        </TableHead>
                        <TableHead className="pr-6 text-right text-xs font-bold tracking-wider text-gray-400">
                          AÇÕES
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eixos.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="py-6 text-center text-gray-400"
                          >
                            Nenhum cadastrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        eixos.map((eixo) => (
                          <TableRow
                            key={eixo.id}
                            className="border-b border-gray-50 transition-colors hover:bg-gray-50/30 dark:border-slate-800 dark:hover:bg-slate-800/50"
                          >
                            <TableCell className="py-4 pl-6 font-bold text-[#313a70] dark:text-white">
                              {eixo.nome}
                            </TableCell>
                            <TableCell className="pr-6 text-right">
                              <div className="flex justify-end gap-3 text-[#9ca7b8] dark:text-gray-500">
                                <button
                                  onClick={() => abrirEdicaoEixo(eixo)}
                                  className="transition-colors hover:text-[#45b7d1] dark:hover:text-blue-400"
                                >
                                  <PencilSimple size={20} weight="bold" />
                                </button>
                                <button
                                  onClick={() => handleDelete("eixos", eixo.id)}
                                  className="transition-colors hover:text-red-500"
                                >
                                  <Trash size={20} weight="bold" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent
              value="ods"
              className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none"
            >
              <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#313a70] dark:text-white">
                    Metas ODS
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Objetivos de Desenvolvimento Sustentável (ONU).
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingOds(null)
                    formOds.reset({ codigo: "", nome: "" })
                    setModalOds(true)
                  }}
                  className="w-full gap-2 rounded-xl bg-[#45b7d1] text-white shadow-sm hover:bg-[#3ba2ba] md:w-auto dark:bg-blue-600"
                >
                  <Plus weight="bold" /> Nova
                </Button>
              </div>
              <Card className="overflow-hidden rounded-2xl border-gray-100 bg-white shadow-sm md:rounded-3xl dark:border-slate-800 dark:bg-slate-900">
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-150">
                    <TableHeader className="bg-gray-50/50 dark:bg-slate-800/50">
                      <TableRow>
                        <TableHead className="py-4 pl-6 text-xs font-bold tracking-wider text-gray-400">
                          CÓDIGO
                        </TableHead>
                        <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                          NOME DA META
                        </TableHead>
                        <TableHead className="pr-6 text-right text-xs font-bold tracking-wider text-gray-400">
                          AÇÕES
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ods.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="py-6 text-center text-gray-400"
                          >
                            Nenhuma cadastrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        ods.map((item) => (
                          <TableRow
                            key={item.id}
                            className="border-b border-gray-50 transition-colors hover:bg-gray-50/30 dark:border-slate-800 dark:hover:bg-slate-800/50"
                          >
                            <TableCell className="py-4 pl-6">
                              <Badge className="border-none bg-blue-50 font-bold text-[#48549e] shadow-none dark:bg-blue-900/30 dark:text-blue-400">
                                {item.codigo}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-[#313a70] dark:text-white">
                              {item.nome}
                            </TableCell>
                            <TableCell className="pr-6 text-right">
                              <div className="flex justify-end gap-3 text-[#9ca7b8] dark:text-gray-500">
                                <button
                                  onClick={() => abrirEdicaoOds(item)}
                                  className="transition-colors hover:text-[#45b7d1] dark:hover:text-blue-400"
                                >
                                  <PencilSimple size={20} weight="bold" />
                                </button>
                                <button
                                  onClick={() => handleDelete("ods", item.id)}
                                  className="transition-colors hover:text-red-500"
                                >
                                  <Trash size={20} weight="bold" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Modais Restritos ao ADMIN */}
      {isAdmin && (
        <>
          <Dialog open={modalSec} onOpenChange={setModalSec}>
            <DialogContent className="w-[95vw] rounded-2xl bg-white sm:max-w-md md:rounded-3xl dark:border-slate-800 dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#313a70] md:text-2xl dark:text-white">
                  {editingSec ? "Editar Secretaria" : "Cadastrar Secretaria"}
                </DialogTitle>
              </DialogHeader>
              <Form {...formSec}>
                <form
                  onSubmit={formSec.handleSubmit(onSubmitSec)}
                  className="space-y-4 py-4"
                >
                  <FormField
                    control={formSec.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                          Nome Completo
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
                    control={formSec.control}
                    name="sigla"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                          Sigla
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="rounded-xl bg-gray-50 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-col justify-end gap-3 pt-4 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl sm:w-auto dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
                      onClick={() => setModalSec(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="w-full rounded-xl bg-[#313a70] text-white hover:bg-[#1e2446] sm:w-auto dark:bg-blue-600"
                    >
                      Salvar
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={modalEixo} onOpenChange={setModalEixo}>
            <DialogContent className="w-[95vw] rounded-2xl bg-white sm:max-w-md md:rounded-3xl dark:border-slate-800 dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#313a70] md:text-2xl dark:text-white">
                  {editingEixo ? "Editar Eixo" : "Cadastrar Eixo"}
                </DialogTitle>
              </DialogHeader>
              <Form {...formEixo}>
                <form
                  onSubmit={formEixo.handleSubmit(onSubmitEixo)}
                  className="space-y-4 py-4"
                >
                  <FormField
                    control={formEixo.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                          Título do Eixo
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
                  <div className="flex flex-col justify-end gap-3 pt-4 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl sm:w-auto dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
                      onClick={() => setModalEixo(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="w-full rounded-xl bg-[#313a70] text-white hover:bg-[#1e2446] sm:w-auto dark:bg-blue-600"
                    >
                      Salvar
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={modalOds} onOpenChange={setModalOds}>
            <DialogContent className="w-[95vw] rounded-2xl bg-white sm:max-w-md md:rounded-3xl dark:border-slate-800 dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#313a70] md:text-2xl dark:text-white">
                  {editingOds ? "Editar ODS" : "Cadastrar ODS"}
                </DialogTitle>
              </DialogHeader>
              <Form {...formOds}>
                <form
                  onSubmit={formOds.handleSubmit(onSubmitOds)}
                  className="space-y-4 py-4"
                >
                  <FormField
                    control={formOds.control}
                    name="codigo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                          Código
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="rounded-xl bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            placeholder="Ex: ODS 3"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formOds.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                          Nome / Objetivo
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
                  <div className="flex flex-col justify-end gap-3 pt-4 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl sm:w-auto dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
                      onClick={() => setModalOds(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="w-full rounded-xl bg-[#313a70] text-white hover:bg-[#1e2446] sm:w-auto dark:bg-blue-600"
                    >
                      Salvar
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  )
}
