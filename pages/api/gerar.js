async function chamarClaude(chaveApi, prompt, maxTokens = 2000) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': chaveApi,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Erro na API');
  }

  const data = await response.json();
  return data.content[0].text;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const { dados } = req.body;
  if (!dados) return res.status(400).json({ erro: 'Dados do produto não enviados' });

  const chaveApi = process.env.ANTHROPIC_API_KEY;
  if (!chaveApi) return res.status(500).json({ erro: 'API Key não configurada no servidor' });

  const { nomeProduto, publicoAlvo, problema, beneficio, preco, diferencial, categoria } = dados;

  const ctx = `
Produto: ${nomeProduto}
Categoria TikTok: ${categoria}
Público-alvo: ${publicoAlvo}
Problema que resolve: ${problema}
Benefício principal: ${beneficio}
Preço: ${preco || 'não informado'}
Diferencial: ${diferencial}`.trim();

  try {
    const promptHooks = `Você é um especialista em TikTok Shop com vídeos que já viralizaram com milhões de views.

${ctx}

Gere 10 HOOKS poderosos para os primeiros 2 segundos do vídeo. Cada hook deve parar o scroll instantaneamente.
Use psicologias diferentes: curiosidade, choque, identificação, prova social, urgência, transformação, polêmica, comparação, segredo, dor.

Formato — retorne APENAS as 10 linhas numeradas, sem explicações:
1. [hook aqui]
2. [hook aqui]
...`;

    const promptTitulos = `Você é um especialista em TikTok Shop que sabe maximizar CTR e views.

${ctx}

Gere 5 TÍTULOS para o vídeo que maximizam o CTR. Devem ser curtos, impactantes e ter emojis estratégicos.

Formato — retorne APENAS as 5 linhas numeradas, sem explicações:
1. [título aqui]
2. [título aqui]
...`;

    const promptThumbnails = `Você é um especialista em TikTok Shop e criação de conteúdo visual viral.

${ctx}

Gere 5 ideias de THUMBNAIL/CAPA para o vídeo. Descreva exatamente o que deve aparecer: expressão facial, texto sobreposto, ângulo, elementos visuais.

Formato — retorne APENAS as 5 linhas numeradas, sem explicações:
1. [descrição da thumbnail]
2. [descrição da thumbnail]
...`;

    const promptRoteiros = `Você é um especialista em roteiros virais para TikTok Shop. Crie roteiros que vendem sem parecer que estão vendendo.

${ctx}

Gere 3 ROTEIROS COMPLETOS com timing, falas e instruções de câmera. Cada roteiro deve ter abordagem diferente.

Use este formato EXATO para cada roteiro:

=== ROTEIRO 1: [NOME DA ABORDAGEM] ===

HOOK (0-2s): [o que falar/fazer para parar o scroll]

DESENVOLVIMENTO (2-15s):
[00-03s] [instrução câmera] - [fala ou ação]
[03-07s] [instrução câmera] - [fala ou ação]
[07-12s] [instrução câmera] - [fala ou ação]
[12-15s] [instrução câmera] - [fala ou ação]

CTA (15-20s): [chamada para ação final — como comprar]

LEGENDA SUGERIDA: [legenda completa com emojis e hashtags]

---

=== ROTEIRO 2: [NOME DA ABORDAGEM] ===
[mesma estrutura]

---

=== ROTEIRO 3: [NOME DA ABORDAGEM] ===
[mesma estrutura]`;

    // Roda em paralelo para ser mais rápido
    const [hooks, titulos, thumbnails, roteiros] = await Promise.all([
      chamarClaude(chaveApi, promptHooks, 800),
      chamarClaude(chaveApi, promptTitulos, 500),
      chamarClaude(chaveApi, promptThumbnails, 600),
      chamarClaude(chaveApi, promptRoteiros, 3000),
    ]);

    return res.status(200).json({ hooks, titulos, thumbnails, roteiros });
  } catch (err) {
    console.error('Erro ao gerar:', err);
    return res.status(500).json({ erro: `Erro ao gerar conteúdo: ${err.message}` });
  }
}
