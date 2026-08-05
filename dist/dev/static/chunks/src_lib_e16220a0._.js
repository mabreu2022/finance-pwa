(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/db/database.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FinanceDatabase",
    ()=>FinanceDatabase,
    "auth",
    ()=>auth,
    "contasPagar",
    ()=>contasPagar,
    "contasReceber",
    ()=>contasReceber,
    "dashboard",
    ()=>dashboard,
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dexie$2f$import$2d$wrapper$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/dexie/import-wrapper.mjs [app-client] (ecmascript)");
;
class FinanceDatabase extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dexie$2f$import$2d$wrapper$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"] {
    users;
    contas;
    constructor(){
        super('FinanceDB');
        this.version(2).stores({
            users: '++id, email',
            contas: '++id, userId, descricao, categoria, status, tipo, dataVencimento, createdAt'
        });
    }
}
const db = new FinanceDatabase();
const auth = {
    async register (email, password, name) {
        const existingUser = await db.users.where('email').equals(email).first();
        if (existingUser) {
            throw new Error('Usuário já existe');
        }
        const now = new Date();
        const userId = await db.users.add({
            email,
            password,
            name,
            createdAt: now,
            updatedAt: now
        });
        const user = await db.users.get(userId);
        if (!user) throw new Error('Erro ao criar usuário');
        return user;
    },
    async login (email, password) {
        const user = await db.users.where('email').equals(email).first();
        if (!user) {
            throw new Error('Usuário não encontrado');
        }
        if (user.password !== password) {
            throw new Error('Senha incorreta');
        }
        // Salvar sessão
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name
        }));
        return user;
    },
    logout () {
        localStorage.removeItem('currentUser');
    },
    getCurrentUser () {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },
    isAuthenticated () {
        return this.getCurrentUser() !== null;
    }
};
const contasPagar = {
    async getAll (userId) {
        return await db.contas.where({
            userId,
            tipo: 'pagar'
        }).reverse().sortBy('createdAt');
    },
    async getById (id, userId) {
        return await db.contas.where({
            id,
            userId
        }).first();
    },
    async getByStatus (status, userId) {
        return await db.contas.where({
            userId,
            tipo: 'pagar',
            status
        }).toArray();
    },
    async getPendentes (userId) {
        return await db.contas.where({
            userId,
            tipo: 'pagar',
            status: 'pendente'
        }).toArray();
    },
    async getAtrasadas (userId) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const pendentes = await this.getPendentes(userId);
        return pendentes.filter((conta)=>{
            const vencimento = new Date(conta.dataVencimento);
            return vencimento < hoje;
        });
    },
    async create (conta) {
        const now = new Date();
        return await db.contas.add({
            ...conta,
            createdAt: now,
            updatedAt: now
        });
    },
    async update (id, userId, conta) {
        const existing = await this.getById(id, userId);
        if (!existing) throw new Error('Conta não encontrada');
        await db.contas.update(id, {
            ...conta,
            updatedAt: new Date()
        });
    },
    async delete (id, userId) {
        const existing = await this.getById(id, userId);
        if (!existing) throw new Error('Conta não encontrada');
        await db.contas.delete(id);
    },
    async getTotalPendente (userId) {
        const pendentes = await this.getPendentes(userId);
        return pendentes.reduce((total, conta)=>total + conta.valor, 0);
    },
    async getTotalPago (userId, mes, ano) {
        const pagos = await this.getByStatus('pago', userId);
        if (mes !== undefined && ano !== undefined) {
            const filtrados = pagos.filter((conta)=>{
                if (!conta.dataPagamento) return false;
                const data = new Date(conta.dataPagamento);
                return data.getMonth() === mes && data.getFullYear() === ano;
            });
            return filtrados.reduce((total, conta)=>total + conta.valor, 0);
        }
        return pagos.reduce((total, conta)=>total + conta.valor, 0);
    }
};
const contasReceber = {
    async getAll (userId) {
        return await db.contas.where({
            userId,
            tipo: 'receber'
        }).reverse().sortBy('createdAt');
    },
    async getById (id, userId) {
        return await db.contas.where({
            id,
            userId
        }).first();
    },
    async getByStatus (status, userId) {
        return await db.contas.where({
            userId,
            tipo: 'receber',
            status
        }).toArray();
    },
    async getPendentes (userId) {
        return await db.contas.where({
            userId,
            tipo: 'receber',
            status: 'pendente'
        }).toArray();
    },
    async getAtrasadas (userId) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const pendentes = await this.getPendentes(userId);
        return pendentes.filter((conta)=>{
            const vencimento = new Date(conta.dataVencimento);
            return vencimento < hoje;
        });
    },
    async create (conta) {
        const now = new Date();
        return await db.contas.add({
            ...conta,
            createdAt: now,
            updatedAt: now
        });
    },
    async update (id, userId, conta) {
        const existing = await this.getById(id, userId);
        if (!existing) throw new Error('Conta não encontrada');
        await db.contas.update(id, {
            ...conta,
            updatedAt: new Date()
        });
    },
    async delete (id, userId) {
        const existing = await this.getById(id, userId);
        if (!existing) throw new Error('Conta não encontrada');
        await db.contas.delete(id);
    },
    async getTotalPendente (userId) {
        const pendentes = await this.getPendentes(userId);
        return pendentes.reduce((total, conta)=>total + conta.valor, 0);
    },
    async getTotalRecebido (userId, mes, ano) {
        const recebidos = await this.getByStatus('recebido', userId);
        if (mes !== undefined && ano !== undefined) {
            const filtrados = recebidos.filter((conta)=>{
                if (!conta.dataPagamento) return false;
                const data = new Date(conta.dataPagamento);
                return data.getMonth() === mes && data.getFullYear() === ano;
            });
            return filtrados.reduce((total, conta)=>total + conta.valor, 0);
        }
        return recebidos.reduce((total, conta)=>total + conta.valor, 0);
    }
};
const dashboard = {
    async getResumo (userId) {
        const [totalPagar, totalReceber, atrasadasPagar, atrasadasReceber] = await Promise.all([
            contasPagar.getTotalPendente(userId),
            contasReceber.getTotalPendente(userId),
            contasPagar.getAtrasadas(userId),
            contasReceber.getAtrasadas(userId)
        ]);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const todasContasHoje = await db.contas.where({
            userId
        }).filter((conta)=>{
            const vencimento = new Date(conta.dataVencimento);
            vencimento.setHours(0, 0, 0, 0);
            return vencimento.getTime() === hoje.getTime() && conta.status === 'pendente';
        }).toArray();
        return {
            totalPagar,
            totalReceber,
            saldo: totalReceber - totalPagar,
            contasAtrasadas: atrasadasPagar.length + atrasadasReceber.length,
            contasHoje: todasContasHoje.length
        };
    },
    async getDadosMensais (userId, ano) {
        const meses = [
            'Jan',
            'Fev',
            'Mar',
            'Abr',
            'Mai',
            'Jun',
            'Jul',
            'Ago',
            'Set',
            'Out',
            'Nov',
            'Dez'
        ];
        const dados = await Promise.all(meses.map(async (mes, index)=>{
            const [receitas, despesas] = await Promise.all([
                contasReceber.getTotalRecebido(userId, index, ano),
                contasPagar.getTotalPago(userId, index, ano)
            ]);
            return {
                mes,
                receitas,
                despesas
            };
        }));
        return dados;
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/auth/AuthContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$database$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db/database.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const currentUser = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$database$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"].getCurrentUser();
            setUser(currentUser);
            setLoading(false);
        }
    }["AuthProvider.useEffect"], []);
    const login = async (email, password)=>{
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$database$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"].login(email, password);
        setUser({
            id: user.id,
            email: user.email,
            name: user.name
        });
    };
    const register = async (email, password, name)=>{
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$database$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"].register(email, password, name);
        // Após registro, faz login automático
        await login(email, password);
    };
    const logout = ()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2f$database$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"].logout();
        setUser(null);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            login,
            register,
            logout,
            loading
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/lib/auth/AuthContext.tsx",
        lineNumber: 47,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "NiO5z6JIqzX62LS5UWDgIqbZYyY=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_lib_e16220a0._.js.map