/**
 * Componente Profile
 * 
 * Este componente representa a tela principal do aplicativo, onde o usuário pode:
 * - Visualizar seu saldo
 * - Adicionar saldo
 * - Gerenciar suas dívidas (adicionar, visualizar e pagar)
 * - Navegar entre diferentes seções do app
 */

import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList, ScrollView } from "react-native";
import { StatusBar } from 'expo-status-bar';
import { Bank, BellRinging, Bookmark, House, CreditCard, ChartLineUp, User, SignOut } from 'phosphor-react-native';
import { supabase } from '../../../lib/supabase';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

// Interface que define a estrutura de uma dívida
interface Divida {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
}

// Interface que define a estrutura de uma transação
interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'pagamento' | 'adicao';
}

export default function Profile() {
  // Estados para gerenciar os dados do usuário e da aplicação
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saldo, setSaldo] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [valorDigitado, setValorDigitado] = useState('');
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [carregandoDividas, setCarregandoDividas] = useState(true);
  const [modalDividaVisible, setModalDividaVisible] = useState(false);
  const [modalSucessoVisible, setModalSucessoVisible] = useState(false);
  const [novaDivida, setNovaDivida] = useState({
    descricao: '',
    valor: '',
    data_vencimento: '',
  });
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [carregandoTransacoes, setCarregandoTransacoes] = useState(true);
  const [telaAtual, setTelaAtual] = useState<'perfil' | 'extrato'>('perfil');

  // Carrega os dados do usuário quando o componente é montado
  useEffect(() => {
    carregarDados();
  }, []);

  // Função para carregar os dados do usuário e suas dívidas e transações
  async function carregarDados() {
    try {
      console.log('Iniciando carregamento de dados...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Erro ao obter usuário:', userError);
        return;
      }
      
      if (!user) {
        console.log('Usuário não autenticado');
        return;
      }

      console.log('Usuário autenticado, buscando perfil e dívidas...');
      await Promise.all([
        fetchUserProfile(),
        buscarDividas(),
        buscarTransacoes()
      ]);
    } catch (error) {
      console.error('Erro detalhado ao carregar dados:', error);
      alert('Erro de conexão. Verifique sua internet e tente novamente.');
    }
  }

  // Função para buscar o perfil do usuário no banco de dados
  const fetchUserProfile = async () => {
    try {
      console.log('Buscando perfil do usuário...');
      setIsLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Erro ao obter usuário no fetchUserProfile:', userError);
        throw userError;
      }

      if (user) {
        console.log('Usuário encontrado, buscando dados do perfil...');
        const { data, error } = await supabase
          .from('users')
          .select('name, saldo')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar perfil:', error);
          throw error;
        }

        if (data) {
          console.log('Dados do perfil carregados com sucesso');
          setUserName(data.name);
          setSaldo(data.saldo || 0);
        }
      }
    } 
    catch (error) {
      console.error('Erro detalhado ao buscar perfil:', error);
      alert('Erro ao carregar perfil. Verifique sua conexão e tente novamente.');
    } 
    finally {
      setIsLoading(false);
    }
  };

  // Função para adicionar saldo à conta do usuário
  const adicionarSaldo = async () => {
    const valor = parseFloat(valorDigitado);
    if (!isNaN(valor) && valor > 0) {
      try {
        console.log('Iniciando adição de saldo...');
        const novoSaldo = saldo + valor;
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error('Erro ao obter usuário em adicionarSaldo:', userError);
          throw userError;
        }

        if (user) {
          // Atualiza o saldo do usuário na tabela 'users'
          console.log('Atualizando saldo do usuário...');
          const { error: updateError } = await supabase
            .from('users')
            .update({ saldo: novoSaldo })
            .eq('id', user.id);

          if (updateError) {
            console.error('Erro ao atualizar saldo na tabela users:', updateError);
            throw updateError;
          }

          // Registra a adição de saldo na tabela 'historico_saldo'
          console.log('Registrando adição de saldo no histórico...');
          const { error: insertError } = await supabase
            .from('historico_saldo')
            .insert([
              {
                usuario_id: user.id,
                valor: valor,
                data: new Date().toISOString() // Registra a data atual
              }
            ]);

          if (insertError) {
            console.error('Erro ao inserir no historico_saldo:', insertError);
            throw insertError;
          }

          console.log('Saldo atualizado e registrado com sucesso');
          setSaldo(novoSaldo);
          setValorDigitado('');
          setModalVisible(false);
          // Recarrega as transações para atualizar o extrato
          buscarTransacoes(); 
        }
      } 
      catch (error) {
        console.error('Erro detalhado ao adicionar saldo:', error);
        alert('Erro ao adicionar saldo. Verifique sua conexão e tente novamente.');
      }
    }
  };

  // Função para buscar as dívidas do usuário no banco de dados
  async function buscarDividas() {
    try {
      console.log('Iniciando busca de dívidas...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Erro ao obter usuário em buscarDividas:', userError);
        throw userError;
      }
      
      if (!user) {
        console.log('Usuário não autenticado ao buscar dívidas');
        return;
      }

      console.log('Buscando dívidas do usuário...');
      const { data, error } = await supabase
        .from('dividas')
        .select('*')
        .eq('usuario_id', user.id)
        .order('data_vencimento', { ascending: true });

      if (error) {
        console.error('Erro detalhado ao buscar dívidas:', error);
        throw error;
      }
      
      console.log('Dívidas carregadas com sucesso');
      setDividas(data || []);
    } catch (erro) {
      console.error('Erro detalhado ao buscar dívidas:', erro);
      alert('Erro ao carregar dívidas. Verifique sua conexão e tente novamente.');
    } finally {
      setCarregandoDividas(false);
    }
  }

  // Função para pagar uma dívida
  const pagarDivida = async (divida: Divida) => {
    try {
      const valorDoPagamento = divida.valor;
      const descricaoPagamento = divida.descricao;

      if (saldo < valorDoPagamento) {
        alert('Saldo insuficiente para pagar esta dívida');
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Erro ao obter usuário em pagarDivida:', userError);
        throw userError;
      }

      if (!user) {
        alert('Você precisa estar logado para pagar dívidas');
        return;
      }

      // Registra o pagamento na tabela historico_pagamentos
      console.log('Registrando pagamento no histórico...');
      const { error: insertPaymentError } = await supabase
        .from('historico_pagamentos')
        .insert([
          {
            usuario_id: user.id,
            descricao: descricaoPagamento,
            valor: valorDoPagamento,
            data_pagamento: new Date().toISOString()
          }
        ]);

      if (insertPaymentError) {
        console.error('Erro ao registrar pagamento em historico_pagamentos:', insertPaymentError);
        throw insertPaymentError;
      }

      // Atualiza o saldo do usuário
      const novoSaldo = saldo - valorDoPagamento;
      console.log('Atualizando saldo do usuário...');
      const { error: erroSaldo } = await supabase
        .from('users')
        .update({ saldo: novoSaldo })
        .eq('id', user.id);

      if (erroSaldo) {
        console.error('Erro ao atualizar saldo:', erroSaldo);
        throw erroSaldo;
      }

      // Remove a dívida do banco de dados
      console.log('Removendo dívida do banco...');
      const { error: erroRemocao } = await supabase
        .from('dividas')
        .delete()
        .eq('id', divida.id);

      if (erroRemocao) {
        console.error('Erro ao remover dívida:', erroRemocao);
        throw erroRemocao;
      }

      console.log('Dívida paga e registrada com sucesso');
      setSaldo(novoSaldo);
      setDividas(dividas.filter(d => d.id !== divida.id));
      setModalSucessoVisible(true);
      
      setTimeout(() => {
        setModalSucessoVisible(false);
      }, 2000);
      buscarDividas(); // Recarrega as dívidas para atualizar a tela
      buscarTransacoes(); // Recarrega as transações para atualizar o extrato
    } catch (error) {
      console.error('Erro detalhado ao pagar dívida:', error);
      alert('Erro ao pagar dívida. Verifique sua conexão e tente novamente.');
    }
  };

  // Função para buscar as transações do usuário
  async function buscarTransacoes() {
    try {
      console.log('Iniciando busca de transações...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Erro ao obter usuário em buscarTransacoes:', userError);
        throw userError;
      }
      
      if (!user) {
        console.log('Usuário não autenticado ao buscar transações');
        return;
      }

      // Busca as adições de saldo
      console.log('Buscando adições de saldo...');
      const { data: adicoesSaldo, error: erroAdicoes } = await supabase
        .from('historico_saldo')
        .select('*')
        .eq('usuario_id', user.id)
        .order('data', { ascending: false });

      if (erroAdicoes) {
        console.error('Erro ao buscar adições de saldo:', erroAdicoes);
        throw erroAdicoes;
      }

      const adicoesFormatadas = (adicoesSaldo || []).map(adicao => ({
        id: adicao.id,
        descricao: 'Adição de Saldo',
        valor: adicao.valor,
        data: adicao.data,
        tipo: 'adicao' as const
      }));

      // Busca os pagamentos de dívidas do histórico
      console.log('Buscando pagamentos de dívidas...');
      const { data: pagamentosDividas, error: erroPagamentos } = await supabase
        .from('historico_pagamentos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('data_pagamento', { ascending: false });

      if (erroPagamentos) {
        console.error('Erro ao buscar pagamentos de dívidas:', erroPagamentos);
        throw erroPagamentos;
      }

      const pagamentosFormatados = (pagamentosDividas || []).map(pagamento => ({
        id: pagamento.id,
        descricao: pagamento.descricao,
        valor: pagamento.valor,
        data: pagamento.data_pagamento,
        tipo: 'pagamento' as const
      }));

      // Combina e ordena todas as transações por data
      const todasTransacoes = [...adicoesFormatadas, ...pagamentosFormatados]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      console.log('Transações carregadas com sucesso');
      setTransacoes(todasTransacoes);
    } catch (erro) {
      console.error('Erro detalhado ao buscar transações:', erro);
      alert('Erro ao carregar transações. Verifique sua conexão e tente novamente.');
    } finally {
      setCarregandoTransacoes(false);
    }
  }

  // Função para formatar data para exibição no padrão brasileiro (DD/MM/AAAA)
  const formatarDataParaExibicao = (dataString: string) => {
    const data = new Date(dataString);
    if (isNaN(data.getTime())) { // Verifica se a data é inválida
        return "Data Inválida";
    }
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para formatar a data no padrão brasileiro (DD/MM/AAAA) para input
  const formatarData = (text: string) => {
    const cleanedText = text.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    let formattedText = '';

    for (let i = 0; i < cleanedText.length; i++) {
      if (i === 2 || i === 4) {
        formattedText += '/';
      }
      formattedText += cleanedText[i];
    }
    return formattedText.slice(0, 10); // Garante que o comprimento final seja no máximo 10 (DD/MM/YYYY)
  };

  // Função para validar se a data inserida é válida
  const validarData = (data: string) => {
    // Remove as barras para validar
    const numeros = data.replace(/\D/g, '');
    if (numeros.length !== 8) return false;

    const dia = parseInt(numeros.slice(0, 2));
    const mes = parseInt(numeros.slice(2, 4));
    const ano = parseInt(numeros.slice(4, 8));

    // Validações básicas
    if (dia < 1 || dia > 31) return false;
    if (mes < 1 || mes > 12) return false;
    if (ano < 1900 || ano > 2100) return false; // Ano ajustado para 1900-2100

    // Validação específica para meses com 30 dias
    if ([4, 6, 9, 11].includes(mes) && dia > 30) return false;

    // Validação para fevereiro
    if (mes === 2) {
      const isBissexto = (ano % 4 === 0 && ano % 100 !== 0) || (ano % 400 === 0);
      if (isBissexto && dia > 29) return false;
      if (!isBissexto && dia > 28) return false;
    }

    return true;
  };

  // Função para adicionar uma nova dívida
  const adicionarDivida = async () => {
    try {
      console.log('Iniciando adição de nova dívida...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Erro ao obter usuário em adicionarDivida:', userError);
        throw userError;
      }

      if (!user) {
        alert('Você precisa estar logado para adicionar dívidas');
        return;
      }

      if (!novaDivida.descricao || !novaDivida.valor || !novaDivida.data_vencimento) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      if (!validarData(novaDivida.data_vencimento)) {
        alert('Por favor, insira uma data válida no formato DD/MM/AAAA');
        return;
      }

      // Extrai os números puros da data_vencimento
      const numerosPuros = novaDivida.data_vencimento.replace(/\D/g, '').slice(0, 8);

      // Garante que temos 8 dígitos (DDMMYYYY) antes de extrair
      if (numerosPuros.length !== 8) {
          console.error("Data não contém 8 dígitos numéricos válidos. Isso deveria ter sido pego pela validação anterior.");
          alert("Erro interno na data. Por favor, tente novamente com uma data válida.");
          return;
      }

      const dia = numerosPuros.slice(0, 2);
      const mes = numerosPuros.slice(2, 4);
      const ano = numerosPuros.slice(4, 8);

      const dataBanco = `${ano}-${mes}-${dia}`;

      console.log('Inserindo nova dívida no banco...');
      const { error } = await supabase
        .from('dividas')
        .insert([{
          usuario_id: user.id,
          descricao: novaDivida.descricao,
          valor: parseFloat(novaDivida.valor.toString()),
          data_vencimento: dataBanco,
        }]);

      if (error) {
        console.error('Erro ao adicionar dívida:', error);
        throw error;
      }

      console.log('Dívida adicionada com sucesso');
      setNovaDivida({ descricao: '', valor: '', data_vencimento: '' });
      setModalDividaVisible(false);
      buscarDividas();
    } catch (error) {
      console.error('Erro detalhado ao adicionar dívida:', error);
      alert('Erro ao adicionar dívida. Verifique sua conexão e tente novamente.');
    }
  };

  // Função para fazer logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      alert('Erro ao sair. Tente novamente.');
    }
  };

  // Função para limpar o extrato
  const limparExtrato = async () => {
    try {
      console.log('Iniciando limpeza do extrato...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Erro ao obter usuário em limparExtrato:', userError);
        throw userError;
      }
      
      if (!user) {
        alert('Você precisa estar logado para limpar o extrato');
        return;
      }

      // Limpa o histórico de saldo
      const { error: erroHistoricoSaldo } = await supabase
        .from('historico_saldo')
        .delete()
        .eq('usuario_id', user.id);

      if (erroHistoricoSaldo) {
        console.error('Erro ao limpar histórico de saldo:', erroHistoricoSaldo);
        throw erroHistoricoSaldo;
      }

      // Limpa o histórico de pagamentos
      const { error: erroHistoricoPagamentos } = await supabase
        .from('historico_pagamentos')
        .delete()
        .eq('usuario_id', user.id);

      if (erroHistoricoPagamentos) {
        console.error('Erro ao limpar histórico de pagamentos:', erroHistoricoPagamentos);
        throw erroHistoricoPagamentos;
      }

      console.log('Extrato limpo com sucesso');
      setTransacoes([]);
      alert('Extrato limpo com sucesso!');
    } catch (error) {
      console.error('Erro detalhado ao limpar extrato:', error);
      alert('Erro ao limpar extrato. Verifique sua conexão e tente novamente.');
    }
  };

  return (
    <View style={Styles.container}>
      <StatusBar style="auto" />
      
      {/* Cabeçalho do aplicativo */}
      <View style={Styles.header}>
        <View style={Styles.headerLeft}>
          <Bank size={32} color="#1abc5c" weight="duotone" />
          <Text style={Styles.leftText}>
            TesteBank
          </Text>
        </View>

        <View style={Styles.headerRight}>
          <BellRinging size={32} color="#1abc5c" weight="duotone" />
          <Bookmark size={32} color="#1abc5c" weight="duotone" />
          <Text style={Styles.rightText}>
          </Text>
        </View>
      </View>

      {/* Nome do usuário */}
      <Text style={Styles.userName}>
        {isLoading ? 'Carregando...' : `Olá, ${userName || 'Usuário'}`}
      </Text>

      {/* Container de saldo */}
      <View style={Styles.containerSaldo}>
        <View style={Styles.infoSaldo}>
          <Text style={Styles.labelSaldo}>Seu saldo:</Text>
          <Text style={Styles.valorSaldo}>R$ {saldo.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={Styles.botaoAdicionar}
          onPress={() => setModalVisible(true)}
        >
          <Text style={Styles.textoBotao}>Adicionar Saldo</Text>
        </TouchableOpacity>
      </View>

      {/* Container de conteúdo (Dívidas ou Extrato) */}
      {telaAtual === 'perfil' ? (
        <View style={Styles.dividasContainer}>
          <View style={Styles.dividasHeader}>
            <Text style={Styles.dividasTitulo}>Suas Dívidas</Text>
            <TouchableOpacity
              style={Styles.botaoAdicionar}
              onPress={() => setModalDividaVisible(true)}
            >
              <Text style={Styles.textoBotao}>Nova Dívida</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de dívidas */}
          {carregandoDividas ? (
            <Text style={Styles.carregando}>Carregando dívidas...</Text>
          ) : (
            <FlatList
              data={dividas}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={Styles.cardDivida}>
                  <View style={Styles.cardContent}>
                    <View style={Styles.cardHeader}>
                      <Text style={Styles.descricaoDivida}>{item.descricao}</Text>
                      <Text style={Styles.valorDivida}>R$ {item.valor.toFixed(2)}</Text>
                    </View>
                    <View style={Styles.cardFooter}>
                      <Text style={Styles.dataVencimento}>
                        Comprado em: {formatarDataParaExibicao(item.data_vencimento)}
                      </Text>
                      <TouchableOpacity
                        style={Styles.botaoPagar}
                        onPress={() => pagarDivida(item)}
                      >
                        <Text style={Styles.textoBotaoPagar}>Pagar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              contentContainerStyle={Styles.flatListContent}
            />
          )}
        </View>
      ) : (
        <View style={Styles.dividasContainer}>
          <View style={Styles.dividasHeader}>
            <Text style={Styles.dividasTitulo}>Extrato</Text>
            <TouchableOpacity
              style={[Styles.botaoAdicionar, Styles.botaoLimpar]}
              onPress={limparExtrato}
            >
              <Text style={Styles.textoBotao}>Limpar Extrato</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de transações */}
          {carregandoTransacoes ? (
            <Text style={Styles.carregando}>Carregando extrato...</Text>
          ) : (
            <FlatList
              data={transacoes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={Styles.cardDivida}>
                  <View style={Styles.cardContent}>
                    <View style={Styles.cardHeader}>
                      <Text style={Styles.descricaoDivida}>{item.descricao}</Text>
                      <Text style={[
                        Styles.valorDivida,
                        item.tipo === 'adicao' ? Styles.valorPositivo : Styles.valorNegativo
                      ]}>
                        {item.tipo === 'adicao' ? '+' : '-'} R$ {item.valor.toFixed(2)}
                      </Text>
                    </View>
                    <View style={Styles.cardFooter}>
                      <Text style={Styles.dataVencimento}>
                        Data: {formatarDataParaExibicao(item.data)}
                      </Text>
                      <Text style={[
                        Styles.tipoTransacao,
                        item.tipo === 'adicao' ? Styles.tipoAdicao : Styles.tipoPagamento
                      ]}>
                        {item.tipo === 'adicao' ? 'Adição' : 'Pagamento'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              contentContainerStyle={Styles.flatListContent}
            />
          )}
        </View>
      )}

      {/* Menu de navegação inferior */}
      <View style={Styles.footer}>
        <TouchableOpacity 
          style={Styles.footerItem}
          onPress={() => setTelaAtual('perfil')}
        >
          <User 
            size={24} 
            color={telaAtual === 'perfil' ? "#1abc5c" : "#808080"} 
            weight="duotone" 
          />
          <Text style={[
            Styles.footerText,
            telaAtual === 'perfil' ? {} : Styles.footerTextInactive
          ]}>Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={Styles.footerItem}
          onPress={() => setTelaAtual('extrato')}
        >
          <ChartLineUp 
            size={24} 
            color={telaAtual === 'extrato' ? "#1abc5c" : "#808080"} 
            weight="duotone" 
          />
          <Text style={[
            Styles.footerText,
            telaAtual === 'extrato' ? {} : Styles.footerTextInactive
          ]}>Extrato</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={Styles.footerItem} onPress={handleLogout}>
          <SignOut size={24} color="#1abc5c" weight="duotone" />
          <Text style={Styles.footerText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para adicionar saldo */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={Styles.centeredView}>
          <View style={Styles.modalView}>
            <Text style={Styles.modalTitle}>Digite o valor</Text>
            <TextInput
              style={Styles.input}
              keyboardType="numeric"
              value={valorDigitado}
              onChangeText={setValorDigitado}
              placeholder="R$ 0,00"
              placeholderTextColor="#808080"
            />
            <View style={Styles.modalButtons}>
              <TouchableOpacity
                style={[Styles.modalButton, Styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={Styles.textoBotao}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[Styles.modalButton, Styles.confirmButton]}
                onPress={adicionarSaldo}
              >
                <Text style={Styles.textoBotao}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para adicionar nova dívida */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalDividaVisible}
        onRequestClose={() => setModalDividaVisible(false)}
      >
        <View style={Styles.centeredView}>
          <View style={Styles.modalView}>
            <Text style={Styles.modalTitle}>Nova Dívida</Text>
            <TextInput
              style={Styles.input}
              value={novaDivida.descricao}
              onChangeText={(text) => setNovaDivida({ ...novaDivida, descricao: text })}
              placeholder="Descrição"
              placeholderTextColor="#808080"
            />
            <TextInput
              style={Styles.input}
              keyboardType="numeric"
              value={novaDivida.valor}
              onChangeText={(text) => {
                const newValor = text.replace(/[^0-9.]/g, ''); // Permite apenas números e um ponto
                setNovaDivida({ 
                  ...novaDivida, 
                  valor: newValor, 
                });
              }}
              placeholder="Valor Total"
              placeholderTextColor="#808080"
            />

            <TextInput
              style={Styles.input}
              value={novaDivida.data_vencimento}
              onChangeText={(text) => {
                // Passa o texto completo para a função formatarData, que fará a limpeza e formatação
                const formattedText = formatarData(text);
                setNovaDivida({ ...novaDivida, data_vencimento: formattedText });
              }}
              placeholder="Data da Compra (DD/MM/AAAA)"
              placeholderTextColor="#808080"
              keyboardType="numeric"
              maxLength={10}
            />
            
            <View style={Styles.modalButtons}>
              <TouchableOpacity
                style={[Styles.modalButton, Styles.cancelButton]}
                onPress={() => setModalDividaVisible(false)}
              >
                <Text style={Styles.textoBotao}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[Styles.modalButton, Styles.confirmButton]}
                onPress={adicionarDivida}
              >
                <Text style={Styles.textoBotao}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de sucesso ao pagar dívida */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalSucessoVisible}
        onRequestClose={() => setModalSucessoVisible(false)}
      >
        <View style={Styles.centeredView}>
          <View style={Styles.modalSucesso}>
            <View style={Styles.modalSucessoContent}>
              <View style={Styles.modalSucessoIcon}>
                <Text style={Styles.modalSucessoEmoji}>🎉</Text>
              </View>
              <Text style={Styles.modalSucessoTitulo}>Parabéns!</Text>
              <Text style={Styles.modalSucessoTexto}>Menos uma dívida!</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Estilos do componente
export const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181a20',
  },
  flatListContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    marginTop: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  leftText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  rightText: {},
  userName: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    color: "#f4f4f4",
    fontSize: 25,
    fontWeight: "800",
  },
  containerSaldo: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e2127',
    marginHorizontal: 20,
    borderRadius: 10,
  },
  infoSaldo: {
    flex: 1,
  },
  labelSaldo: {
    color: '#808080',
    fontSize: 16,
  },
  valorSaldo: {
    color: '#1abc5c',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 5,
  },
  botaoAdicionar: {
    backgroundColor: '#1abc5c',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  textoBotao: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: '#1e2127',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#262930',
    borderRadius: 8,
    padding: 10,
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
  },
  confirmButton: {
    backgroundColor: '#1abc5c',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  bodyText: {
    color: "#181a20",
    fontSize: 20,
    fontWeight: "600",
  },
  dividasContainer: {
    flex: 1,
    backgroundColor: '#1e2127',
    marginHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    padding: 15,
  },
  dividasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividasTitulo: {
    color: '#f4f4f4',
    fontSize: 20,
    fontWeight: '600',
  },
  cardDivida: {
    backgroundColor: '#262930',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descricaoDivida: {
    color: '#f4f4f4',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  valorDivida: {
    color: '#ff3b30',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  dataVencimento: {
    color: '#808080',
    fontSize: 14,
  },
  botaoPagar: {
    backgroundColor: '#1abc5c',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  textoBotaoPagar: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  tipoTransacao: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tipoAdicao: {
    backgroundColor: '#1abc5c20',
    color: '#1abc5c',
  },
  tipoPagamento: {
    backgroundColor: '#ff3b3020',
    color: '#ff3b30',
  },
  valorPositivo: {
    color: '#1abc5c',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  valorNegativo: {
    color: '#ff3b30',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  carregando: {
    color: '#808080',
    textAlign: 'center',
    marginTop: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1e2127',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#262930',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerItem: {
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    color: '#1abc5c',
    fontSize: 12,
    fontWeight: '500',
  },
  footerTextInactive: {
    color: '#808080',
  },
  modalSucesso: {
    backgroundColor: '#1e2127',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalSucessoContent: {
    alignItems: 'center',
  },
  modalSucessoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1abc5c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalSucessoEmoji: {
    fontSize: 40,
  },
  modalSucessoTitulo: {
    color: '#1abc5c',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalSucessoTexto: {
    color: '#f4f4f4',
    fontSize: 18,
    textAlign: 'center',
  },
  botaoLimpar: {
    backgroundColor: '#e74c3c',
  },
});
