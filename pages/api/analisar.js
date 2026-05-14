export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const { imagemBase64 } = req.body;
  if (!imagemBase64) return res.status(400).json({ erro: 'Imagem não enviada' });

  const chaveApi = process.env.ANTHROPIC_API_KEY;
  if (!chaveApi) return res.status(500).json({ erro: 'API Key não configurada no servidor' });

  try {
    const base64Data = imagemBase64.includes(',') ? imagemBase64.split(',')[1] : imagemBase64;

    // Detecta o tipo MIME com fallback robusto
    let mediaType = 'image/jpeg';
    if (imagemBase64.includes('data:image/png')) mediaType = 'image/png';
    else if (imagemBase64.includes('data:image/webp')) mediaType = 'image/webp';
    else if (imagemBase64.includes('data:image/gif')) mediaType = 'image/gif';
    else {
      // Fallback: tenta detectar pelo magic number do base64
      const firstBytes = Buffer.from(base64Data, 'base64').slice(0, 4);
      if (firstBytes[0] === 0x89 && firstBytes[1] === 0x50) mediaType = 'image/png';
      else if (firstBytes[0] === 0x47 && firstBytes[1] === 0x49) mediaType = 'image/gif';
      else mediaType = 'image/jpeg';
    }

    console.log('Tipo MIME detectado:', mediaType);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': chaveApi,
        'anthropic-version': '2024-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
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
              text: `Analise esta imagem de produto para TikTok Shop e responda APENAS com um JSON válido, sem markdown, sem explicações:
{
  "produto": "nome do produto identificado",
  "categoria": "uma das opções: organização, maternidade, beleza, eletrônicos, barato→caro, satisfação, moda, esportes, outro",
  "publicoAlvo": "público-alvo ideal para este produto (ex: Mães 25-45 anos)",
  "problema": "principal problema que este produto resolve",
  "beneficio": "principal benefício que o produto oferece",
  "diferencial": "o que diferencia este produto dos concorrentes"
}`
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Erro API Anthropic:', JSON.stringify(err, null, 2));
      return res.status(response.status).json({ erro: err.error?.message || 'Erro na API Anthropic' });
    }

    const data = await response.json();
    const texto = data.content[0].text.trim();

    // Limpa possível markdown do JSON
    const jsonLimpo = texto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    console.log('Resposta da IA:', jsonLimpo);

    try {
      const analise = JSON.parse(jsonLimpo);
      return res.status(200).json(analise);
    } catch (parseErr) {
      console.error('Erro ao fazer parse JSON:', parseErr.message);
      console.error('Texto recebido:', jsonLimpo);
      return res.status(500).json({ erro: `Erro ao fazer parse da resposta: ${parseErr.message}` });
    }
  } catch (err) {
    console.error('Erro ao analisar:', err);
    return res.status(500).json({ erro: `Erro ao processar: ${err.message}` });
  }
}
