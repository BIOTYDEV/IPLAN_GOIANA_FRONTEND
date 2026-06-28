/* eslint-disable react-hooks/set-state-in-effect */
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
  Trash,
  Plus,
  PencilSimple,
  MagnifyingGlass,
} from "@phosphor-icons/react"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"

type Usuario = {
  id: number
  nome: string
  email: string
  role: string
  secretaria?: { nome: string; sigla: string }
}
const usuarioSchema = z.object({
  nome: z.string().min(3, "Mínimo 3 caracteres."),
  email: z.string().email("E-mail inválido."),
  senha: z.string().optional(),
  role: z.string().refine((val) => val !== "0", "Selecione o perfil."),
})
type UsuarioValues = z.infer<typeof usuarioSchema>

export function Usuarios() {
  const { usuario: usuarioLogado } = useAuth()
  const isAdmin = usuarioLogado?.role === "ADMIN"

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [busca, setBusca] = useState("")
  const [filtroPerfil, setFiltroPerfil] = useState("TODOS")

  const [modalAberto, setModalAberto] = useState(false)
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<number | null>(null)

  const form = useForm<UsuarioValues>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { nome: "", email: "", senha: "", role: "0" },
  })

  async function carregarUsuarios() {
    try {
      const response = await api.get("/usuarios")
      setUsuarios(response.data)
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    }
  }

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const usuariosVisiveis = usuarios.filter((user) => {
    const termo = busca.toLowerCase()
    const matchBusca =
      user.nome.toLowerCase().includes(termo) ||
      user.email.toLowerCase().includes(termo)
    const matchPerfil = filtroPerfil === "TODOS" || user.role === filtroPerfil
    return matchBusca && matchPerfil
  })

  async function onSubmit(values: UsuarioValues) {
    try {
      const payload: any = {
        nome: values.nome,
        email: values.email,
        role: values.role,
      }
      if (values.senha && values.senha.length > 0) {
        if (values.senha.length < 6)
          return form.setError("senha", { message: "Mínimo 6 caracteres." })
        payload.senha = values.senha
      }

      if (usuarioEmEdicao) {
        await api.patch(`/usuarios/${usuarioEmEdicao}`, payload)
      } else {
        if (!values.senha || values.senha.length < 6)
          return form.setError("senha", { message: "Senha obrigatória." })
        await api.post("/usuarios", payload)
      }
      fecharModal()
      carregarUsuarios()
    } catch (error: any) {
      console.error(error)
      alert("Erro ao salvar usuário.")
    }
  }

  function abrirModalNovo() {
    setUsuarioEmEdicao(null)
    form.reset({ nome: "", email: "", senha: "", role: "0" })
    setModalAberto(true)
  }
  function abrirModalEdicao(user: Usuario) {
    setUsuarioEmEdicao(user.id)
    form.reset({
      nome: user.nome,
      email: user.email,
      senha: "",
      role: user.role,
    })
    setModalAberto(true)
  }
  function fecharModal() {
    setModalAberto(false)
    setTimeout(() => {
      setUsuarioEmEdicao(null)
      form.reset({ nome: "", email: "", senha: "", role: "0" })
    }, 200)
  }

  async function handleExcluir(id: number) {
    if (usuarioLogado?.id === id)
      return alert("Você não pode excluir a si mesmo.")
    try {
      await api.delete(`/usuarios/${id}`)
      carregarUsuarios()
    } catch (error) {
      console.error(error)
      alert("Erro ao excluir usuário.")
    }
  }

  const formatarRole = (role: string) => {
    if (role === "ADMIN") return "Administrador"
    if (role === "PREFEITO") return "Prefeito"
    if (role === "SECRETARIO") return "Secretário / Gestor"
    return role
  }

  const getRoleBadgeClass = (role: string) =>
    role === "ADMIN"
      ? "bg-[#f0f2f8] text-[#48549e] dark:bg-blue-900/30 dark:text-blue-400"
      : "bg-[#f4f7f9] text-gray-600 dark:bg-slate-700 dark:text-gray-300"

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col justify-between gap-4 md:mb-8 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#313a70] md:text-3xl dark:text-white">
            Usuários
          </h1>
          <p className="mt-1 text-sm text-gray-500 md:text-base dark:text-gray-400">
            Controle de acesso e permissões do sistema
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={abrirModalNovo}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#45b7d1] px-5 py-6 text-sm font-bold text-white hover:bg-[#3ba2ba] md:w-auto dark:bg-blue-600"
          >
            <Plus size={18} weight="bold" /> Novo Usuário
          </Button>
        )}
      </div>

      <Card className="mb-6 rounded-2xl border-gray-100 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={20}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pr-4 pl-10 text-sm outline-none focus:border-[#45b7d1] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <select
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 outline-none focus:border-[#45b7d1] md:w-64 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-300"
            value={filtroPerfil}
            onChange={(e) => setFiltroPerfil(e.target.value)}
          >
            <option value="TODOS">Todos os Perfis</option>
            <option value="ADMIN">Administrador</option>
            <option value="PREFEITO">Prefeito</option>
            <option value="SECRETARIO">Secretário / Gestor</option>
          </select>
        </div>
      </Card>

      <Card className="rounded-2xl border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800">
        <div className="w-full overflow-x-auto">
          <Table className="min-w-175">
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 dark:bg-slate-900/50 dark:hover:bg-slate-900/50">
                <TableHead className="py-4 pl-6 text-xs font-bold tracking-wider text-gray-400">
                  NOME / E-MAIL
                </TableHead>
                <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                  PERFIL
                </TableHead>
                <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                  SECRETARIA
                </TableHead>
                <TableHead className="text-xs font-bold tracking-wider text-gray-400">
                  STATUS
                </TableHead>
                {isAdmin && (
                  <TableHead className="pr-6 text-right text-xs font-bold tracking-wider text-gray-400">
                    AÇÕES
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuariosVisiveis.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-gray-500"
                  >
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                usuariosVisiveis.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-b border-gray-50 hover:bg-gray-50/30 dark:border-slate-700/50 dark:hover:bg-slate-700/30"
                  >
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#45b7d1] text-sm font-bold text-white dark:bg-blue-600">
                          {user.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#313a70] dark:text-white">
                            {user.nome}
                          </span>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`rounded-full border-0 px-3 py-1 font-semibold shadow-none ${getRoleBadgeClass(user.role)}`}
                      >
                        {formatarRole(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-gray-600 dark:text-gray-300">
                      {user.secretaria?.nome || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className="rounded-full border-0 bg-[#eef8eb] px-3 py-1 font-semibold text-[#54b948] shadow-none dark:bg-green-900/30">
                        Ativo
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="pr-6 text-right">
                        <div className="flex justify-end gap-3 text-[#9ca7b8] dark:text-gray-500">
                          <button
                            onClick={() => abrirModalEdicao(user)}
                            className="transition-colors hover:text-[#45b7d1] dark:hover:text-blue-400"
                          >
                            <PencilSimple size={20} weight="bold" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="transition-colors hover:text-red-500">
                                <Trash size={20} weight="bold" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="w-[90vw] rounded-3xl sm:w-full dark:border-slate-800 dark:bg-slate-900">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-[#313a70] dark:text-white">
                                  Excluir Usuário?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="dark:text-gray-400">
                                  Deseja remover o acesso de{" "}
                                  <strong>{user.nome}</strong>?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                                <AlertDialogCancel className="mt-0 w-full rounded-xl sm:w-auto dark:border-slate-700 dark:text-gray-300">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleExcluir(user.id)}
                                  className="w-full rounded-xl bg-red-500 text-white hover:bg-red-600 sm:w-auto"
                                >
                                  Sim, Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog
        open={modalAberto}
        onOpenChange={(open) => !open && fecharModal()}
      >
        <DialogContent className="w-[95vw] rounded-3xl bg-white sm:max-w-xl dark:border-slate-800 dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#313a70] md:text-2xl dark:text-white">
              {usuarioEmEdicao ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              <FormField
                control={form.control}
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
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                      E-mail Institucional
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        className="rounded-xl bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                        {usuarioEmEdicao
                          ? "Nova Senha (Opcional)"
                          : "Senha Provisória"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="******"
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
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-[#313a70] dark:text-gray-300">
                        Perfil de Acesso
                      </FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          {...field}
                        >
                          <option value="0">Selecione...</option>
                          <option value="ADMIN">Administrador</option>
                          <option value="PREFEITO">Prefeito</option>
                          <option value="SECRETARIO">
                            Secretário / Gestor
                          </option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                  className="w-full rounded-xl bg-[#48549e] text-white sm:w-auto dark:bg-blue-600"
                >
                  {usuarioEmEdicao ? "Salvar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
