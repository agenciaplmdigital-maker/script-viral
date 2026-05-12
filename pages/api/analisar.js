export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const { imagemBase64 } = req.body;
  if (!imagemBase64) return res.status(400).json({ erro: 'Imagem não enviada' });

  const chaveApi = process.env.ANTHROPIC_API_KEY;
  if (!chaveApi) return res.status(500).json({ erro: 'API Key não configurada no servidor' });

  try {
    const base64Data = imagemBase64.includes(',') ? imagemBase64.split(',')[1] : imagemBase64;
    const mediaType = imagemBase64.startsWith('data:image/png') ? 'image/png' :
                      imagemBase64.startsWith('data:image/webp') ? 'image/webp' :
                      imagemBase64.startsWith('data:image/gif') ? 'image/gif' : 'image/jpeg';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': chaveApi,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Data }
            },
            {
              type: 'text',
              text: `Analise esta imagem de produto para TikTok Shop. Responda SOMENTE com JSON puro, sem markdown, sem backticks, sem explicações. Exemplo exato do formato:
{"produto":"nome do produto","categoria":"organização","publicoAlvo":"público ideal","problema":"problema que resolve","beneficio":"benefício principal","diferencial":"diferencial do produto"}

Categorias válidas: organização, maternidade, beleza, eletrônicos, barato→caro, satisfação, moda, esportes, cozinha, pets, outro`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ erro: err.error?.message || 'Erro na API Anthropic' });
    }

    const data = await response.json();
    let texto = data.content[0].text.trim();

    // Remove qualquer markdown que o modelo possa ter adicionado
    texto = texto.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    // Extrai o JSON se vier com texto antes/depois
    const jsonMatch = texto.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido');

    const analise = JSON.parse(jsonMatch[0]);

    return res.status(200).json(analise);
  } catch (err) {
    console.error('Erro ao analisar:', err);
    return res.status(500).json({ erro: `Erro ao processar: ${err.message}` });
  }
}
