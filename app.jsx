import React, { useState, useEffect } from 'react';
import { X, Plus, Info, Upload, ZoomIn } from 'lucide-react';

export default function NatalSolidario() {
  const [cartas, setCartas] = useState([]);
  const [modalNovaCartaAberto, setModalNovaCartaAberto] = useState(false);
  const [modalEscolhaAberto, setModalEscolhaAberto] = useState(false);
  const [modalInfoAberto, setModalInfoAberto] = useState(false);
  const [modalImagemAberto, setModalImagemAberto] = useState(false);
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const [imagemAmpliada, setImagemAmpliada] = useState(null);
  const [cartaSelecionada, setCartaSelecionada] = useState(null);
  const [emailColaborador, setEmailColaborador] = useState('');
  const [senhaRelatorio, setSenhaRelatorio] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  
  const [novaCartaNome, setNovaCartaNome] = useState('');
  const [novaCartaIdade, setNovaCartaIdade] = useState('');
  const [novaCartaDesejo, setNovaCartaDesejo] = useState('');
  const [novaCartaImagem, setNovaCartaImagem] = useState(null);
  const [erroEmail, setErroEmail] = useState('');

  // Carregar cartas do storage ao montar
  useEffect(() => {
    carregarCartas();
  }, []);

  // Carregar cartas do storage
  const carregarCartas = async () => {
    try {
      const resultado = await window.storage.get('natal-cartinhas');
      if (resultado && resultado.value) {
        setCartas(JSON.parse(resultado.value));
      }
    } catch (error) {
      console.log('Primeiro acesso ou erro ao carregar:', error);
    }
  };

  // Salvar cartas no storage
  const salvarCartas = async (novasCartas) => {
    try {
      await window.storage.set('natal-cartinhas', JSON.stringify(novasCartas));
      setCartas(novasCartas);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  // Validar email Zappts
  const validarEmail = (email) => {
    return email.endsWith('@zappts.com.br');
  };

  // Lidar com upload de imagem
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNovaCartaImagem(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Adicionar nova carta
  const adicionarCarta = () => {
    if (novaCartaNome.trim() && novaCartaIdade.trim()) {
      const novaCarta = {
        id: Date.now(),
        nome: novaCartaNome,
        idade: novaCartaIdade,
        desejo: novaCartaDesejo || 'Brinquedo a escolher',
        imagem: novaCartaImagem,
        escolhidosPor: [],
      };
      const novasCartas = [...cartas, novaCarta];
      salvarCartas(novasCartas);
      setNovaCartaNome('');
      setNovaCartaIdade('');
      setNovaCartaDesejo('');
      setNovaCartaImagem(null);
      setModalNovaCartaAberto(false);
    }
  };

  // Deletar carta
  const deletarCarta = (id) => {
    const novasCartas = cartas.filter(c => c.id !== id);
    salvarCartas(novasCartas);
  };

  // Abrir modal de escolha
  const abrirModalEscolha = (carta) => {
    setCartaSelecionada(carta);
    setEmailColaborador('');
    setErroEmail('');
  };

  // Confirmar escolha
  const confirmarEscolha = () => {
    if (!emailColaborador.trim()) {
      setErroEmail('Por favor, digite seu email');
      return;
    }

    if (!validarEmail(emailColaborador)) {
      setErroEmail('Email deve terminar com @zappts.com.br');
      return;
    }

    if (cartaSelecionada) {
      const novasCartas = cartas.map(c => {
        if (c.id === cartaSelecionada.id) {
          if (!c.escolhidosPor.includes(emailColaborador.trim())) {
            return {
              ...c,
              escolhidosPor: [...c.escolhidosPor, emailColaborador.trim()]
            };
          }
        }
        return c;
      });
      salvarCartas(novasCartas);
      setModalEscolhaAberto(false);
      setCartaSelecionada(null);
      setEmailColaborador('');
      setErroEmail('');
    }
  };

  // Remover um colaborador de uma carta
  const removerColaborador = (cartaId, colaborador) => {
    const novasCartas = cartas.map(c =>
      c.id === cartaId
        ? { ...c, escolhidosPor: c.escolhidosPor.filter(col => col !== colaborador) }
        : c
    );
    salvarCartas(novasCartas);
  };

  const totalEscolhas = cartas.reduce((sum, c) => sum + c.escolhidosPor.length, 0);

  // Validar e baixar Relatório
  const validarSenhaEBaixar = () => {
    if (senhaRelatorio === '@People123') {
      setErroSenha('');
      setModalSenhaAberto(false);
      setSenhaRelatorio('');
      baixarRelatorio();
    } else {
      setErroSenha('Senha incorreta! ❌');
    }
  };

  // Baixar Relatório em CSV
  const baixarRelatorio = () => {
    if (cartas.length === 0) return;

    // Criar dados para o CSV
    let conteudo = 'Nº Cartinha,Nome,Idade,Desejo,Zappters que Escolheram,Total de Escolhas\n';
    
    cartas.forEach((carta, index) => {
      const emails = carta.escolhidosPor.join('; ');
      const totalEscolhas = carta.escolhidosPor.length;
      const desejo = carta.desejo ? carta.desejo : 'Brinquedo a escolher';
      
      conteudo += `${index + 1},"${carta.nome}",${carta.idade},"${desejo}","${emails}",${totalEscolhas}\n`;
    });

    // Criar blob e download
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `natal-solidario-relatorio-${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-8" style={{background: 'linear-gradient(135deg, #0c1e3a 0%, #1a2f5a 50%, #0d1929 100%)', backgroundAttachment: 'fixed', position: 'relative', overflow: 'hidden'}}>
      {/* Efeito de Estrelas */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-70"
            style={{
              width: Math.random() * 2 + 'px',
              height: Math.random() * 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `twinkle ${Math.random() * 3 + 2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Cabeçalho */}
        <div className="text-center mb-12">
          {/* Logo Zappts */}
          <div className="inline-block mb-8">
            <div className="text-7xl font-black tracking-wider" style={{color: '#0891b2', fontFamily: 'Arial, sans-serif', fontWeight: 900, letterSpacing: '0.05em'}}>
              zappts
            </div>
          </div>
          
          <h1 className="text-7xl font-black text-white mb-8 drop-shadow-2xl whitespace-nowrap" style={{fontFamily: 'Arial, sans-serif', fontWeight: 900, letterSpacing: '0.02em'}}>🎄 Natal Solidário 2025 🎄</h1>
          <p className="text-3xl text-white mb-8 font-black drop-shadow-lg whitespace-nowrap" style={{fontFamily: 'Arial, sans-serif', fontWeight: 900, letterSpacing: '0.01em'}}>Escolha uma carinha e realize seu sonho de Natal!</p>
          
          <div className="inline-block bg-cyan-500 bg-opacity-30 backdrop-blur px-8 py-4 rounded-xl border-2 border-cyan-400">
            <p className="text-white font-bold text-lg">
              ✨ {cartas.length} cartinhas • {totalEscolhas} escolhas realizadas
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setModalNovaCartaAberto(true)}
            className="bg-cyan-400 hover:bg-cyan-300 text-blue-900 font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
          >
            <Plus size={28} /> Adicionar Nova Cartinha
          </button>
          
          <button
            onClick={() => setModalInfoAberto(true)}
            className="bg-white hover:bg-gray-100 text-blue-700 font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
          >
            <Info size={28} /> Saiba Mais
          </button>

          <button
            onClick={() => setModalSenhaAberto(true)}
            disabled={cartas.length === 0}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg disabled:cursor-not-allowed"
          >
            📊 Baixar Relatório
          </button>
        </div>

        {/* Grid de Cartas */}
        {cartas.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12">
            {cartas.map(carta => (
              <div
                key={carta.id}
                className="relative rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition"
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-400 h-64 flex flex-col justify-between hover:scale-105 transition-transform"
                >
                  {/* Número e Delete */}
                  <div className="flex justify-between items-start">
                    <span className="inline-block bg-blue-700 text-white px-2 py-1 rounded-full text-xs font-black">
                      #{cartas.indexOf(carta) + 1}
                    </span>
                    <button
                      onClick={() => deletarCarta(carta.id)}
                      className="text-blue-800 hover:text-blue-950 transition bg-white rounded-full p-1 shadow-lg"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Imagem com Zoom */}
                  <div className="text-center flex-1 flex items-center justify-center cursor-pointer group relative">
                    {carta.imagem ? (
                      <>
                        <img 
                          src={carta.imagem} 
                          alt={carta.nome} 
                          className="w-20 h-20 object-cover rounded-lg group-hover:opacity-75 transition" 
                          onClick={() => {
                            setImagemAmpliada(carta.imagem);
                            setModalImagemAberto(true);
                          }}
                        />
                        <ZoomIn size={24} className="absolute text-blue-700 opacity-0 group-hover:opacity-100 transition" />
                      </>
                    ) : (
                      <p className="text-5xl cursor-pointer" onClick={() => abrirModalEscolha(carta)}>😊</p>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="text-center cursor-pointer" onClick={() => abrirModalEscolha(carta)}>
                    <p className="font-black text-blue-900 text-sm">{carta.nome}</p>
                    <p className="text-xs text-blue-800 font-semibold">{carta.idade} anos</p>
                    <p className="text-xs text-blue-700 mt-1 italic font-semibold">{carta.desejo}</p>
                  </div>

                  {/* Contador de Escolhas */}
                  <div className="text-center cursor-pointer" onClick={() => abrirModalEscolha(carta)}>
                    <p className="text-xs font-black bg-blue-700 text-white py-1 px-2 rounded-lg">
                      👥 {carta.escolhidosPor.length} {carta.escolhidosPor.length === 1 ? 'escolheu' : 'escolheram'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-blue-800 bg-opacity-50 rounded-xl mb-12 border-2 border-cyan-400 border-opacity-50">
            <p className="text-white text-2xl font-bold drop-shadow">Nenhuma cartinha adicionada ainda. Comece adicionando as crianças! 🎄</p>
          </div>
        )}

        {/* Resumo de Escolhas */}
        {cartas.some(c => c.escolhidosPor.length > 0) && (
          <div className="bg-white bg-opacity-95 rounded-xl p-6 shadow-2xl border-2 border-cyan-400">
            <h2 className="text-3xl font-black text-blue-700 mb-4">📋 Escolhas Realizadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cartas
                .filter(c => c.escolhidosPor.length > 0)
                .map((carta, idx) => (
                  <div key={carta.id} className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-lg border-2 border-cyan-400">
                    <p className="font-black text-blue-700 mb-2">Cartinha #{cartas.indexOf(carta) + 1}</p>
                    <p className="text-gray-800 font-bold">{carta.nome}, {carta.idade} anos</p>
                    <p className="text-sm text-gray-600 mb-3 font-semibold">Desejo: {carta.desejo}</p>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-blue-700">Escolhido por:</p>
                      {carta.escolhidosPor.map((email, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-cyan-300">
                          <span className="text-sm text-gray-700 font-semibold">👤 {email}</span>
                          <button
                            onClick={() => removerColaborador(carta.id, email)}
                            className="text-blue-600 hover:text-blue-800 transition font-bold"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Ampliar Imagem */}
      {modalImagemAberto && imagemAmpliada && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="relative max-w-2xl max-h-96">
            <button
              onClick={() => {
                setModalImagemAberto(false);
                setImagemAmpliada(null);
              }}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition"
            >
              <X size={32} />
            </button>
            <img src={imagemAmpliada} alt="Imagem ampliada" className="rounded-xl shadow-2xl max-w-full max-h-96 object-contain" />
          </div>
        </div>
      )}

      {/* Modal Nova Cartinha */}
      {modalNovaCartaAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl border-2 border-cyan-400">
            <h2 className="text-2xl font-black text-blue-700 mb-4">Adicionar Nova Cartinha 🎁</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-blue-700 mb-1">
                  Nome da carinha:
                </label>
                <input
                  type="text"
                  value={novaCartaNome}
                  onChange={(e) => setNovaCartaNome(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full px-4 py-2 border-2 border-cyan-300 rounded-lg focus:outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200 font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-700 mb-1">
                  Idade:
                </label>
                <input
                  type="text"
                  value={novaCartaIdade}
                  onChange={(e) => setNovaCartaIdade(e.target.value)}
                  placeholder="Ex: 7 anos"
                  className="w-full px-4 py-2 border-2 border-cyan-300 rounded-lg focus:outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200 font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-700 mb-1">
                  O que deseja (opcional):
                </label>
                <input
                  type="text"
                  value={novaCartaDesejo}
                  onChange={(e) => setNovaCartaDesejo(e.target.value)}
                  placeholder="Ex: Boneca, Carrinho, Bola"
                  className="w-full px-4 py-2 border-2 border-cyan-300 rounded-lg focus:outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200 font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-700 mb-2">
                  Adicionar Foto (opcional):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="imageUpload"
                    className="hidden"
                  />
                  <label htmlFor="imageUpload" className="flex-1 px-4 py-2 bg-cyan-200 text-blue-900 font-bold rounded-lg hover:bg-cyan-300 transition cursor-pointer flex items-center gap-2 justify-center">
                    <Upload size={20} /> Escolher Imagem
                  </label>
                  {novaCartaImagem && <span className="text-sm text-green-600 font-bold">✓ Foto adicionada</span>}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalNovaCartaAberto(false);
                  setNovaCartaImagem(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 transition text-lg"
              >
                Cancelar
              </button>
              <button
                onClick={adicionarCarta}
                disabled={!novaCartaNome.trim() || !novaCartaIdade.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Escolher Cartinha */}
      {cartaSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl border-2 border-cyan-400">
            <h2 className="text-2xl font-black text-blue-700 mb-4">Escolher uma Cartinha 🎁</h2>
            
            <div className="bg-gradient-to-br from-emerald-100 to-cyan-100 p-4 rounded-lg mb-6 text-center border-2 border-emerald-400">
              {cartaSelecionada.imagem ? (
                <img src={cartaSelecionada.imagem} alt={cartaSelecionada.nome} className="w-24 h-24 object-cover rounded-lg mx-auto mb-2 cursor-pointer hover:opacity-75" onClick={() => {
                  setImagemAmpliada(cartaSelecionada.imagem);
                  setModalImagemAberto(true);
                }} />
              ) : (
                <p className="text-5xl mb-2">😊</p>
              )}
              <p className="font-black text-lg text-blue-900">{cartaSelecionada.nome}</p>
              <p className="text-blue-800 font-bold">{cartaSelecionada.idade}</p>
              <p className="text-sm text-blue-700 mt-2 font-bold">Desejo: {cartaSelecionada.desejo}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-blue-700 mb-2">
                Seu email Zappts (@zappts.com.br):
              </label>
              <input
                type="email"
                value={emailColaborador}
                onChange={(e) => {
                  setEmailColaborador(e.target.value);
                  setErroEmail('');
                }}
                placeholder="seu.email@zappts.com.br"
                className="w-full px-4 py-2 border-2 border-cyan-300 rounded-lg focus:outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200 font-semibold"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && confirmarEscolha()}
              />
              {erroEmail && <p className="text-red-600 text-sm font-bold mt-1">⚠️ {erroEmail}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCartaSelecionada(null);
                  setEmailColaborador('');
                  setErroEmail('');
                }}
                className="flex-1 px-4 py-2 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 transition text-lg"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEscolha}
                className="flex-1 px-4 py-2 bg-cyan-400 text-blue-900 font-bold rounded-lg hover:bg-cyan-300 transition text-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Senha - Relatório */}
      {modalSenhaAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl border-2 border-cyan-400">
            <h2 className="text-2xl font-black text-blue-700 mb-4">🔒 Acesso ao Relatório</h2>
            <p className="text-gray-700 mb-6 font-semibold">Digite a senha para baixar o relatório:</p>
            
            <div className="mb-6">
              <input
                type="password"
                value={senhaRelatorio}
                onChange={(e) => {
                  setSenhaRelatorio(e.target.value);
                  setErroSenha('');
                }}
                placeholder="Digite a senha"
                className="w-full px-4 py-2 border-2 border-cyan-300 rounded-lg focus:outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-200 font-semibold"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && validarSenhaEBaixar()}
              />
              {erroSenha && <p className="text-red-600 text-sm font-bold mt-2">⚠️ {erroSenha}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalSenhaAberto(false);
                  setSenhaRelatorio('');
                  setErroSenha('');
                }}
                className="flex-1 px-4 py-2 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 transition text-lg"
              >
                Cancelar
              </button>
              <button
                onClick={validarSenhaEBaixar}
                className="flex-1 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition text-lg"
              >
                Baixar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Info - Regras e Prazos */}
      {modalInfoAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl border-2 border-cyan-400 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black text-blue-700">📋 Regras e Prazos</h2>
              <button
                onClick={() => setModalInfoAberto(false)}
                className="text-blue-600 hover:text-blue-800 transition font-bold"
              >
                <X size={28} />
              </button>
            </div>

            <div className="space-y-4 text-gray-800">
              <div>
                <h3 className="font-black text-blue-700 mb-2 text-lg">📅 Cronograma:</h3>
                <ul className="space-y-1 text-sm ml-4 font-semibold">
                  <li>✓ <strong>Abertura das inscrições:</strong> 26/11/2025</li>
                  <li>✓ <strong>Prazo final para inscrição:</strong> 05/12/2025</li>
                  <li>✓ <strong>Distribuição dos vouchers:</strong> 08/12/2025</li>
                  <li>✓ <strong>Entrega dos brinquedos:</strong> 20/12/2025</li>
                </ul>
              </div>

              <div>
                <h3 className="font-black text-blue-700 mb-2 text-lg">🎁 Como Funciona:</h3>
                <ul className="space-y-1 text-sm ml-4 font-semibold">
                  <li>• Cada Zappter participante recebe R$ 50 no saldo do Caju</li>
                  <li>• Pode participar individualmente ou em grupos</li>
                  <li>• Grupos acumulam vouchers para brinquedos de maior valor</li>
                  <li>• Escolha a carinha e compre o brinquedo com o voucher</li>
                </ul>
              </div>

              <div>
                <h3 className="font-black text-blue-700 mb-2 text-lg">📍 Instituição Apoiada:</h3>
                <p className="text-sm font-semibold">Instituto Eden Lar - crianças em situação de vulnerabilidade social</p>
              </div>

              <div className="bg-blue-100 p-3 rounded-lg border-2 border-blue-400">
                <p className="text-sm text-blue-900 font-bold"><strong>💝 Objetivo:</strong> Promover integração entre os Zappters e impactar positivamente a comunidade por meio de uma ação solidária!</p>
              </div>
            </div>

            <button
              onClick={() => setModalInfoAberto(false)}
              className="w-full mt-6 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition text-lg"
            >
              Entendi!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

