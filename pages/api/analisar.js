export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const { imagemBase64 } = req.body;
  if (!imagemBase64) return res.status(400).json({ erro: 'Imagem não enviada' });

  const chaveApi = process.env.ANTHROPIC_API_KEY;
  if (!chaveApi) return res.status(500).json({ erro: 'API Key não configurada' });

  try {
    const base64Data = imagemBase64.includes(',') ? imagemBase64.split(',')[1] : imagemBase64;
    
    // Força jpeg para qualquer formato (HEIC, HEIF, etc)
    const mediaType = 'image/jpeg';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': chaveApi,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
            { type: 'text', text: 'Analise este produto. Responda APENAS com JSON puro sem markdown:\n{"produto":"nome","categoria":"outro","publicoAlvo":"público","problema":"problema","beneficio":"beneficio","diferencial":"diferencial"}' }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(200).json({ produto:'', categoria:'outro', publicoAlvo:'', problema:'', beneficio:'', diferencial:'' });

    let texto = data.content[0].text.trim().replace(/```json\s*/gi,'').replace(/```\s*/gi,'').trim();
    const match = texto.match(/\{[\s\S]*\}/);
    const analise = match ? JSON.parse(match[0]) : {};

    return res.status(200).json({
      produto: analise.produto || '',
      categoria: analise.categoria || 'outro',
      publicoAlvo: analise.publicoAlvo || '',
      problema: analise.problema || '',
      beneficio: analise.beneficio || '',
      diferencial: analise.diferencial || ''
    });

  } catch (err) {
    // Sempre retorna campos vazios — usuário preenche manualmente
    return res.status(200).json({ produto:'', categoria:'outro', publicoAlvo:'', problema:'', beneficio:'', diferencial:'' });
  }
}
