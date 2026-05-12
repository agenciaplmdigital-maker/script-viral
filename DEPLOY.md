# Deploy Script Viral no Vercel

## ⚠️ PONTO CRÍTICO — Variável de Ambiente

### ERRADO (não funciona):
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...

### CORRETO:
ANTHROPIC_API_KEY=sk-ant-...

**SEM o prefixo NEXT_PUBLIC_**

O prefixo NEXT_PUBLIC_ expõe a chave no browser e causa erro de CORS.
Sem o prefixo, a chave fica apenas no servidor (API Routes) — seguro e funcional.

## Passos no Vercel

1. Acesse vercel.com → seu projeto → Settings → Environment Variables
2. Clique em "Add New"
3. Key: `ANTHROPIC_API_KEY`
4. Value: `sk-ant-api03-...` (sua chave completa)
5. Environments: marque Production + Preview + Development (todos os três)
6. Clique Save
7. Vá em Deployments → clique nos 3 pontos → Redeploy

## Estrutura das API Routes

pages/api/analisar.js → analisa imagem do produto (POST /api/analisar)
pages/api/gerar.js    → gera roteiros, hooks, títulos, thumbnails (POST /api/gerar)

Ambas usam process.env.ANTHROPIC_API_KEY (server-side, seguro).
