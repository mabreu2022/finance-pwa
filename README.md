# Connect Finance - Aplicativo Financeiro PWA

Um aplicativo financeiro completo inspirado no Microsoft Money, desenvolvido como Progressive Web App (PWA) para gerenciar contas a pagar e receber.

## Funcionalidades

### Dashboard
- Visão geral das finanças em tempo real
- Cards com totais a pagar, receber e saldo previsto
- Gráfico de fluxo de caixa mensal
- Lista de contas recentes

### Contas a Pagar
- Cadastro completo de despesas
- Categorização (Moradia, Alimentação, Transporte, etc.)
- Status: Pendente, Pago, Atrasado
- Marcar como pago com data de pagamento
- Edição e exclusão de contas
- Busca por descrição ou categoria

### Contas a Receber
- Cadastro completo de receitas
- Categorização (Salário, Freelance, Vendas, etc.)
- Status: Pendente, Recebido, Atrasado
- Marcar como recebido com data de recebimento
- Edição e exclusão de contas
- Busca por descrição ou categoria

### Relatórios
- Gráficos de pizza por categoria (despesas e receitas)
- Gráfico de barras mensal comparativo
- Totais pagos, recebidos e pendentes
- Análise detalhada por período

### Recursos Técnicos
- **PWA**: Instalável em dispositivos móveis e desktop
- **Armazenamento Local**: IndexedDB para persistência de dados
- **Tema Escuro/Claro**: Alternância automática e manual
- **Design Responsivo**: Interface adaptável a qualquer tela
- **Offline First**: Funciona sem conexão com internet

## Tecnologias Utilizadas

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Dexie.js (IndexedDB)
- Recharts (Gráficos)
- next-pwa

## Como Usar

### Instalação
1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd finance-pwa
```

2. Instale as dependências:
```bash
npm install
```

3. Execute em modo de desenvolvimento:
```bash
npm run dev
```

4. Acesse em `http://localhost:3000`

### Build para Produção
```bash
npm run build
```

Os arquivos estáticos serão gerados na pasta `dist/`.

### Instalação do PWA

#### Android (Chrome)
1. Acesse o site pelo Chrome
2. Toque no menu (três pontos)
3. Selecione "Adicionar à tela inicial"

#### iOS (Safari)
1. Acesse o site pelo Safari
2. Toque no botão compartilhar
3. Selecione "Adicionar à Tela de Início"

#### Desktop (Chrome/Edge)
1. Acesse o site
2. Clique no ícone de instalação na barra de endereço
3. Ou vá em Menu > Instalar Connect Finance

## Estrutura do Projeto

```
finance-pwa/
├── src/
│   ├── app/                    # Páginas do Next.js
│   │   ├── page.tsx           # Dashboard
│   │   ├── contas-pagar/      # Página de contas a pagar
│   │   ├── contas-receber/    # Página de contas a receber
│   │   ├── relatorios/        # Página de relatórios
│   │   ├── layout.tsx         # Layout principal
│   │   └── globals.css        # Estilos globais
│   ├── components/
│   │   ├── ui/                # Componentes shadcn/ui
│   │   └── sidebar.tsx        # Navegação lateral
│   └── lib/
│       ├── db/
│       │   └── database.ts    # Configuração IndexedDB
│       └── utils.ts           # Utilitários
├── public/
│   ├── icons/                 # Ícones do PWA
│   └── manifest.json          # Configuração do PWA
├── next.config.ts             # Configuração Next.js
└── package.json
```

## Características do Design

- **Paleta de Cores**: Gradiente ciano para azul como identidade visual
- **Tipografia**: Geist (Sans) e Geist Mono
- **Componentes**: Cards com sombras suaves e bordas arredondadas
- **Micro-interações**: Hover effects e transições suaves
- **Acessibilidade**: Contraste adequado e navegação por teclado

## Armazenamento de Dados

Todos os dados são armazenados localmente no navegador usando IndexedDB através da biblioteca Dexie.js. Nenhum dado é enviado para servidores externos, garantindo total privacidade.

## Próximas Melhorias

- [ ] Sincronização entre dispositivos
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Notificações push para contas próximas do vencimento
- [ ] Importação de extratos bancários
- [ ] Metas financeiras e orçamentos
- [ ] Múltiplas contas/carteiras

## Licença

MIT License - Livre para uso pessoal e comercial.

---

Desenvolvido com Next.js e shadcn/ui
