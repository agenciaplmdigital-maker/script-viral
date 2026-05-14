import React, { useState, useRef } from 'react';

export default function Home() {
  const [etapa, setEtapa] = useState('upload');
  const [previewImagem, setPreviewImagem] = useState(null);
  const [imagemBase64, setImagemBase64] = useState(null);
  const [analisando, setAnalisando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('roteiros');
  const [copiado, setCopiado] = useState('');
  const fileInputRef = useRef(null);

  const [dados, setDados] = useState({
    nomeProduto: '',
    categoria: 'organização',
    publicoAlvo: '',
    problema: '',
    beneficio: '',
    preco: '',
    diferencial: ''
  });

  const categorias = ['organização','maternidade','beleza','eletrônicos','barato→caro','satisfação','moda','esportes','cozinha','pets','outro'];

  const copiar = (texto, id) => {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(''), 2000);
  };

  const handleUpload = async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    if (arquivo.size > 5 * 1024 * 1024) { setErro('Imagem muito grande. Máximo 5MB.'); return; }
    const leitor = new FileReader();
    leitor.onload = async (ev) => {
      const base64 = ev.target.result;
      setImagemBase64(base64);
      setPreviewImagem(base64);
      setErro('');
      await analisarImagem(base64);
    };
    leitor.readAsDataURL(arquivo);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const arquivo = e.dataTransfer.files[0];
    if (arquivo && arquivo.type.startsWith('image/')) {
      handleUpload({ target: { files: [arquivo] } });
    }
  };

  const analisarImagem = async (base64) => {
    setAnalisando(true);
    setErro('');
    try {
      // Validação adicional do base64
      if (!base64 || base64.length < 100) {
        throw new Error('Imagem inválida ou vazia');
      }

      const res = await fetch('/api/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagemBase64: base64 })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Erro da API:', data);
        throw new Error(data.erro || `Erro na análise (${res.status})`);
      }

      // Valida os dados retornados
      if (!data.produto) {
        throw new Error('Não consegui identificar o produto na imagem. Tente outra foto.');
      }

      setDados({
        nomeProduto: data.produto || '',
        categoria: categorias.includes(data.categoria) ? data.categoria : 'outro',
        publicoAlvo: data.publicoAlvo || '',
        problema: data.problema || '',
        beneficio: data.beneficio || '',
        preco: '',
        diferencial: data.diferencial || ''
      });
      setEtapa('dados');
    } catch (err) {
      console.error('Erro completo:', err);
      setErro('❌ ' + err.message);
    } finally {
      setAnalisando(false);
    }
  };

  const gerarConteudo = async () => {
    if (!dados.nomeProduto || !dados.publicoAlvo || !dados.problema) {
      setErro('Preencha: Nome do Produto, Público-Alvo e Problema.');
      return;
    }
    setGerando(true);
    setErro('');
    setProgresso('Criando roteiros virais...');
    try {
      const res = await fetch('/api/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dados })
      });
      setProgresso('Finalizando conteúdo...');
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao gerar conteúdo');
      setResultado(data);
      setAbaAtiva('roteiros');
      setEtapa('resultado');
    } catch (err) {
      setErro('Erro: ' + err.message);
    } finally {
      setGerando(false);
      setProgresso('');
    }
  };

  const resetar = () => {
    setEtapa('upload');
    setPreviewImagem(null);
    setImagemBase64(null);
    setResultado(null);
    setErro('');
    setDados({ nomeProduto:'',categoria:'organização',publicoAlvo:'',problema:'',beneficio:'',preco:'',diferencial:'' });
  };

  const parseLista = (texto) => {
    if (!texto) return [];
    return texto.split('\n').map(l => l.replace(/^\d+\.\s*/, '').trim()).filter(l => l.length > 2);
  };

  const parseRoteiros = (texto) => {
    if (!texto) return [];
    return texto.split(/===\s*ROTEIRO \d+:/i)
      .filter(s => s.trim().length > 10)
      .map(s => {
        const linhas = s.split('\n');
        const titulo = linhas[0].replace(/===/g,'').trim();
        const corpo = linhas.slice(1).join('\n').replace(/^---\s*/m,'').trim();
        return { titulo, corpo };
      });
  };

  const abas = [
    { id:'roteiros', label:'🎬 Roteiros' },
    { id:'hooks', label:'🎣 Hooks' },
    { id:'titulos', label:'📝 Títulos' },
    { id:'thumbnails', label:'🎨 Thumbnails' },
  ];

  return (
    <div style={s.root}>
      <style>{css}</style>
      <div style={s.bgBlob1}/><div style={s.bgBlob2}/><div style={s.bgGrid}/>

      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo}>
            <img src="/logo-dark.png" alt="Script Viral" style={s.logoImg} onError={e => e.target.style.display='none'} />
            <span style={s.logoText}>Script <span style={s.logoAcc}>Viral</span></span>
          </div>
          {etapa !== 'upload' && <button style={s.btnReset} onClick={resetar}>+ Novo Produto</button>}
        </div>
      </header>

      <main style={s.main}>

        {etapa === 'upload' && (
          <div style={s.card} className="fadeIn">
            <div style={{textAlign:'center'}}>
              <h1 style={s.headline}>Roteiros Virais para<br/><span style={s.gradText}>TikTok Shop</span></h1>
              <p style={s.sub}>Envie a foto do produto → a IA cria hooks, títulos, thumbnails e roteiros completos prontos para gravar</p>
            </div>

            <div style={s.uploadZone} className={analisando?'pulseUpload':'hoverUpload'}
              onClick={() => !analisando && fileInputRef.current?.click()}
              onDrop={handleDrop} onDragOver={e=>e.preventDefault()}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{display:'none'}}/>
              {previewImagem ? (
                <div style={{position:'relative',width:'100%'}}>
                  <img src={previewImagem} alt="Produto" style={s.previewImg}/>
                  {analisando && (
                    <div style={s.previewOverlay}>
                      <div style={s.spinnerLg} className="spin"/>
                      <p style={{color:'#00f2ff',fontSize:'14px',fontWeight:'600'}}>Identificando produto...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={s.uploadEmpty}>
                  <div style={{fontSize:'48px',lineHeight:'1'}}>📸</div>
                  <p style={{fontSize:'16px',fontWeight:'600',color:'#e2e8f0'}}>Arraste ou clique para enviar</p>
                  <p style={{fontSize:'13px',color:'#475569'}}>JPG, PNG, WebP — máx 5MB</p>
                </div>
              )}
            </div>

            {analisando && (
              <div style={s.statusBar}>
                <div style={s.spinnerSm} className="spin"/>
                <span style={{fontSize:'14px',color:'#00f2ff',fontWeight:'500'}}>Analisando produto com IA...</span>
              </div>
            )}
            {erro && <div style={s.error}>{erro}</div>}
            {previewImagem && !analisando && (
              <button style={s.btnPrimary} className="btnHover" onClick={() => setEtapa('dados')}>Próximo →</button>
            )}

            <div style={s.features}>
              {['🎬 3 Roteiros Completos','🎣 10 Hooks Virais','📝 5 Títulos CTR','🎨 5 Ideas Thumbnail'].map(f=>(
                <div key={f} style={s.pill}>{f}</div>
              ))}
            </div>
          </div>
        )}

        {etapa === 'dados' && (
          <div style={s.card} className="fadeIn">
            <h2 style={s.cardTitle}>Confirme os Dados do Produto</h2>
            <p style={{fontSize:'14px',color:'#64748b',textAlign:'center'}}>A IA preencheu automaticamente — ajuste se necessário</p>

            {previewImagem && (
              <div style={s.productPreview}>
                <img src={previewImagem} alt="Produto" style={s.productThumb}/>
                <div style={{fontSize:'16px',fontWeight:'700',color:'#e2e8f0'}}>{dados.nomeProduto||'Produto identificado'}</div>
              </div>
            )}

            <div style={s.form}>
              {[
                {key:'nomeProduto',label:'📦 Nome do Produto *',ph:'Ex: Organizador de Gaveta Premium'},
                {key:'publicoAlvo',label:'👥 Público-Alvo *',ph:'Ex: Mães 25-45 anos que amam organização'},
                {key:'problema',label:'😩 Problema que Resolve *',ph:'Ex: Gavetas bagunçadas e itens perdidos'},
                {key:'beneficio',label:'✨ Benefício Principal',ph:'Ex: Casa organizada em minutos'},
                {key:'preco',label:'💰 Preço',ph:'Ex: R$ 49,90'},
                {key:'diferencial',label:'⚡ Diferencial',ph:'Ex: Material premium, 3 tamanhos inclusos'},
              ].map(({key,label,ph}) => (
                <div key={key} style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  <label style={s.fieldLabel}>{label}</label>
                  <input style={s.input} className="inputFocus" type="text" placeholder={ph}
                    value={dados[key]} onChange={e=>setDados({...dados,[key]:e.target.value})}/>
                </div>
              ))}
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                <label style={s.fieldLabel}>🏷️ Categoria</label>
                <select style={s.input} className="inputFocus" value={dados.categoria}
                  onChange={e=>setDados({...dados,categoria:e.target.value})}>
                  {categorias.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {erro && <div style={s.error}>{erro}</div>}

            {gerando && (
              <div style={s.gerandoBox}>
                <div style={s.spinnerLg} className="spin"/>
                <p style={{fontSize:'16px',fontWeight:'700',color:'#00f2ff'}}>{progresso}</p>
                <p style={{fontSize:'13px',color:'#475569'}}>Criando 3 roteiros + 10 hooks + títulos + thumbnails...</p>
              </div>
            )}

            <div style={{display:'flex',gap:'12px',width:'100%'}}>
              <button style={s.btnSec} onClick={() => setEtapa('upload')}>← Voltar</button>
              <button style={{...s.btnPrimary,flex:1}} className="btnHover" onClick={gerarConteudo} disabled={gerando}>
                {gerando ? '⚙️ Gerando...' : '✨ Gerar Conteúdo'}
              </button>
            </div>
          </div>
        )}

        {etapa === 'resultado' && resultado && (
          <div style={{width:'100%',maxWidth:'900px',display:'flex',flexDirection:'column',alignItems:'center'}} className="fadeIn">
            <div style={{textAlign:'center',marginBottom:'32px'}}>
              <h2 style={{fontSize:'36px',fontWeight:'900',color:'#fff',letterSpacing:'-1px',marginBottom:'8px'}}>🎬 Conteúdo Pronto!</h2>
              <p style={{fontSize:'15px',color:'#64748b'}}>{dados.nomeProduto} · {dados.categoria}</p>
            </div>

            <div style={s.tabs}>
              {abas.map(a => (
                <button key={a.id} style={{...s.tab,...(abaAtiva===a.id?s.tabAtiva:{})}} onClick={()=>setAbaAtiva(a.id)}>
                  {a.label}
                </button>
              ))}
            </div>

            {abaAtiva === 'roteiros' && (
              <div style={{width:'100%'}}>
                {parseRoteiros(resultado.roteiros).map((r,i) => (
                  <div key={i} style={s.roteiro}>
                    <div style={s.roteiroHeader}>
                      <div style={s.roteiroNum}>Roteiro {i+1}</div>
                      <div style={{fontSize:'15px',fontWeight:'700',color:'#e2e8f0',flex:1}}>{r.titulo}</div>
                      <button style={{...s.copyBtn,...(copiado===`r${i}`?s.copyOk:{})}}
                        onClick={()=>copiar(`ROTEIRO ${i+1}: ${r.titulo}\n\n${r.corpo}`,`r${i}`)}>
                        {copiado===`r${i}`?'✅ Copiado!':'📋 Copiar'}
                      </button>
                    </div>
                    <pre style={s.roteiroBody}>{r.corpo}</pre>
                  </div>
                ))}
              </div>
            )}

            {abaAtiva === 'hooks' && (
              <div style={{width:'100%'}}>
                <div style={s.dica}>💡 Use nos primeiros 2 segundos do vídeo para parar o scroll</div>
                <div style={s.grid}>
                  {parseLista(resultado.hooks).map((h,i) => (
                    <div key={i} style={s.card2}>
                      <div style={s.cardNum}>{i+1}</div>
                      <p style={s.cardText}>{h}</p>
                      <button style={{...s.copyBtn,...(copiado===`h${i}`?s.copyOk:{})}} onClick={()=>copiar(h,`h${i}`)}>
                        {copiado===`h${i}`?'✅':'📋'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {abaAtiva === 'titulos' && (
              <div style={{width:'100%'}}>
                <div style={s.dica}>💡 Cole na descrição do vídeo para maximizar o alcance</div>
                {parseLista(resultado.titulos).map((t,i) => (
                  <div key={i} style={{...s.listItem,marginBottom:'10px'}}>
                    <div style={s.cardNum}>{i+1}</div>
                    <p style={s.listText}>{t}</p>
                    <button style={{...s.copyBtn,...(copiado===`t${i}`?s.copyOk:{})}} onClick={()=>copiar(t,`t${i}`)}>
                      {copiado===`t${i}`?'✅':'📋'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {abaAtiva === 'thumbnails' && (
              <div style={{width:'100%'}}>
                <div style={s.dica}>💡 Instruções visuais para a capa do seu vídeo</div>
                {parseLista(resultado.thumbnails).map((t,i) => (
                  <div key={i} style={{...s.listItem,marginBottom:'10px'}}>
                    <div style={s.cardNum}>{i+1}</div>
                    <p style={s.listText}>{t}</p>
                    <button style={{...s.copyBtn,...(copiado===`th${i}`?s.copyOk:{})}} onClick={()=>copiar(t,`th${i}`)}>
                      {copiado===`th${i}`?'✅':'📋'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button style={{...s.btnPrimary,marginTop:'32px'}} className="btnHover" onClick={resetar}>
              + Novo Produto
            </button>
          </div>
        )}
      </main>

      <footer style={s.footer}>
        <p style={{fontSize:'12px',color:'#334155'}}>© 2026 Script Viral · Powered by Claude AI</p>
      </footer>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:100%;background:#050810;color:#e2e8f0;font-family:'Inter',sans-serif;overflow-x:hidden;}
  #__next{min-height:100vh;display:flex;flex-direction:column;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
  @keyframes blob{0%,100%{transform:translate(0,0)scale(1);}33%{transform:translate(30px,-20px)scale(1.05);}66%{transform:translate(-20px,20px)scale(0.95);}}
  .fadeIn{animation:fadeIn 0.4s ease;}
  .spin{animation:spin 0.8s linear infinite;}
  .btnHover:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,242,255,0.35);}
  .btnHover:disabled{opacity:0.5;cursor:not-allowed;}
  .hoverUpload:hover{border-color:rgba(0,242,255,0.6)!important;background:rgba(0,242,255,0.04)!important;}
  .pulseUpload{border-color:rgba(0,242,255,0.5)!important;}
  .inputFocus:focus{border-color:rgba(0,242,255,0.5)!important;background:rgba(0,242,255,0.04)!important;outline:none;}
  input,select,textarea{font-family:'Inter',sans-serif;}
  pre{white-space:pre-wrap;word-break:break-word;}
  ::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(0,242,255,0.2);border-radius:3px;}
  select option{background:#0d1117;color:#e2e8f0;}
`;

const s = {
  root:{minHeight:'100vh',background:'#050810',color:'#e2e8f0',position:'relative',display:'flex',flexDirection:'column',overflow:'hidden'},
  bgBlob1:{position:'fixed',top:'-20%',left:'-10%',width:'60vw',height:'60vw',maxWidth:'700px',maxHeight:'700px',background:'radial-gradient(circle,rgba(0,242,255,0.08) 0%,transparent 70%)',filter:'blur(80px)',animation:'blob 12s ease-in-out infinite',pointerEvents:'none',zIndex:0},
  bgBlob2:{position:'fixed',bottom:'-20%',right:'-10%',width:'60vw',height:'60vw',maxWidth:'700px',maxHeight:'700px',background:'radial-gradient(circle,rgba(112,0,255,0.08) 0%,transparent 70%)',filter:'blur(80px)',animation:'blob 15s ease-in-out infinite reverse',pointerEvents:'none',zIndex:0},
  bgGrid:{position:'fixed',inset:0,backgroundImage:'radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)',backgroundSize:'36px 36px',pointerEvents:'none',zIndex:0},
  header:{position:'relative',zIndex:10,borderBottom:'1px solid rgba(255,255,255,0.07)',background:'rgba(5,8,16,0.85)',backdropFilter:'blur(16px)',padding:'0 24px'},
  headerInner:{maxWidth:'900px',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',height:'64px'},
  logo:{display:'flex',alignItems:'center',gap:'10px'},
  logoImg:{width:'36px',height:'36px',borderRadius:'8px'},
  logoText:{fontSize:'18px',fontWeight:'800',color:'#fff',letterSpacing:'-0.3px'},
  logoAcc:{background:'linear-gradient(135deg,#00f2ff,#7000ff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'},
  btnReset:{padding:'8px 16px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'8px',color:'#94a3b8',fontSize:'13px',fontWeight:'600',cursor:'pointer'},
  main:{position:'relative',zIndex:5,flex:1,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'40px 20px 60px'},
  card:{width:'100%',maxWidth:'700px',display:'flex',flexDirection:'column',alignItems:'center',gap:'24px'},
  headline:{fontSize:'clamp(28px,5vw,52px)',fontWeight:'900',color:'#fff',lineHeight:'1.15',letterSpacing:'-1.5px',marginBottom:'16px',textAlign:'center'},
  gradText:{background:'linear-gradient(135deg,#00f2ff 0%,#7000ff 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'},
  sub:{fontSize:'16px',color:'#64748b',lineHeight:'1.7',maxWidth:'520px',margin:'0 auto',textAlign:'center'},
  uploadZone:{width:'100%',border:'2px dashed rgba(0,242,255,0.25)',borderRadius:'16px',background:'rgba(0,242,255,0.015)',cursor:'pointer',transition:'all 0.3s',overflow:'hidden',minHeight:'220px',display:'flex',alignItems:'center',justifyContent:'center'},
  uploadEmpty:{display:'flex',flexDirection:'column',alignItems:'center',gap:'10px',padding:'48px 24px'},
  previewImg:{width:'100%',maxHeight:'300px',objectFit:'contain',display:'block',borderRadius:'14px'},
  previewOverlay:{position:'absolute',inset:0,background:'rgba(5,8,16,0.75)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'12px',borderRadius:'14px'},
  spinnerLg:{width:'40px',height:'40px',border:'3px solid rgba(0,242,255,0.15)',borderTop:'3px solid #00f2ff',borderRadius:'50%'},
  spinnerSm:{width:'16px',height:'16px',border:'2px solid rgba(0,242,255,0.2)',borderTop:'2px solid #00f2ff',borderRadius:'50%',flexShrink:0},
  statusBar:{display:'flex',alignItems:'center',gap:'10px',padding:'10px 16px',background:'rgba(0,242,255,0.05)',border:'1px solid rgba(0,242,255,0.15)',borderRadius:'8px',width:'100%'},
  error:{width:'100%',padding:'12px 16px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'8px',color:'#fca5a5',fontSize:'13px'},
  features:{display:'flex',flexWrap:'wrap',gap:'8px',justifyContent:'center'},
  pill:{padding:'6px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:'100px',fontSize:'13px',color:'#94a3b8',fontWeight:'500'},
  btnPrimary:{padding:'14px 32px',background:'linear-gradient(135deg,#00f2ff 0%,#7000ff 100%)',border:'none',borderRadius:'10px',color:'#050810',fontSize:'15px',fontWeight:'800',cursor:'pointer',transition:'all 0.3s',width:'100%',letterSpacing:'0.3px'},
  btnSec:{padding:'14px 24px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'#94a3b8',fontSize:'15px',fontWeight:'600',cursor:'pointer',flex:'0 0 auto'},
  cardTitle:{fontSize:'28px',fontWeight:'800',color:'#fff',textAlign:'center',letterSpacing:'-0.5px'},
  productPreview:{display:'flex',alignItems:'center',gap:'16px',padding:'16px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'12px',width:'100%'},
  productThumb:{width:'60px',height:'60px',objectFit:'cover',borderRadius:'8px',flexShrink:0},
  form:{display:'flex',flexDirection:'column',gap:'16px',width:'100%'},
  fieldLabel:{fontSize:'12px',fontWeight:'700',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.6px'},
  input:{padding:'12px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'#e2e8f0',fontSize:'14px',transition:'all 0.2s',width:'100%'},
  gerandoBox:{display:'flex',flexDirection:'column',alignItems:'center',gap:'12px',padding:'32px',background:'rgba(0,242,255,0.04)',border:'1px solid rgba(0,242,255,0.15)',borderRadius:'12px',width:'100%',textAlign:'center'},
  tabs:{display:'flex',gap:'4px',padding:'4px',background:'rgba(255,255,255,0.04)',borderRadius:'12px',marginBottom:'24px',width:'100%',overflowX:'auto'},
  tab:{flex:1,padding:'10px 8px',background:'transparent',border:'none',borderRadius:'8px',color:'#64748b',fontSize:'13px',fontWeight:'600',cursor:'pointer',transition:'all 0.2s',whiteSpace:'nowrap',minWidth:'80px'},
  tabAtiva:{background:'rgba(0,242,255,0.12)',color:'#00f2ff',boxShadow:'0 0 0 1px rgba(0,242,255,0.2)'},
  dica:{fontSize:'13px',color:'#475569',marginBottom:'16px',padding:'10px 14px',background:'rgba(255,255,255,0.03)',borderRadius:'8px',borderLeft:'3px solid rgba(0,242,255,0.4)'},
  roteiro:{marginBottom:'20px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'14px',overflow:'hidden'},
  roteiroHeader:{display:'flex',alignItems:'center',gap:'12px',padding:'16px 20px',background:'rgba(0,242,255,0.04)',borderBottom:'1px solid rgba(255,255,255,0.07)',flexWrap:'wrap'},
  roteiroNum:{padding:'4px 10px',background:'linear-gradient(135deg,#00f2ff,#7000ff)',borderRadius:'100px',fontSize:'11px',fontWeight:'800',color:'#050810',flexShrink:0},
  roteiroBody:{padding:'20px',fontSize:'13px',lineHeight:'1.8',color:'#94a3b8',fontFamily:'inherit'},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'12px'},
  card2:{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'16px',display:'flex',flexDirection:'column',gap:'8px'},
  listItem:{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'12px',padding:'16px',display:'flex',alignItems:'flex-start',gap:'12px'},
  cardNum:{width:'26px',height:'26px',borderRadius:'50%',background:'linear-gradient(135deg,#00f2ff,#7000ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'800',color:'#050810',flexShrink:0},
  cardText:{fontSize:'13px',lineHeight:'1.6',color:'#94a3b8',flex:1},
  listText:{fontSize:'14px',lineHeight:'1.6',color:'#cbd5e1',flex:1},
  copyBtn:{alignSelf:'flex-end',padding:'6px 12px',background:'rgba(0,242,255,0.08)',border:'1px solid rgba(0,242,255,0.2)',borderRadius:'6px',color:'#00f2ff',fontSize:'12px',fontWeight:'600',cursor:'pointer',transition:'all 0.2s',flexShrink:0,whiteSpace:'nowrap'},
  copyOk:{background:'rgba(34,197,94,0.1)',borderColor:'rgba(34,197,94,0.3)',color:'#4ade80'},
  footer:{position:'relative',zIndex:10,borderTop:'1px solid rgba(255,255,255,0.06)',background:'rgba(5,8,16,0.8)',padding:'20px',textAlign:'center'},
};
