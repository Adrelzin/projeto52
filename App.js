import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  StyleSheet, ScrollView, Image, FlatList, Alert, StatusBar, ActivityIndicator
} from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// ─── FIREBASE ───────────────────────────────────────────────────────────────
const firebase = initializeApp({
  apiKey: "AIzaSyC5BVI93vIkRtAXerR31YTE9ek3BzU-4e8",
  authDomain: "aula6-atividade-prog3.firebaseapp.com",
  projectId: "aula6-atividade-prog3",
  storageBucket: "aula6-atividade-prog3.firebasestorage.app",
  messagingSenderId: "466202203055",
  appId: "1:466202203055:web:6a5aa9759cc9429eeb955a"
});
const db   = getFirestore(firebase);
const auth = getAuth(firebase);

// ─── CLOUDINARY ──────────────────────────────────────────────────────────────
const CLOUDINARY = {
  cloud:  'dgpfajxgl',
  preset: 'att7prog_upload',
  get url() { return `https://api.cloudinary.com/v1_1/${this.cloud}/image/upload`; }
};

// ─── FIRESTORE HELPERS ───────────────────────────────────────────────────────
const uid = () => auth.currentUser?.uid;

const db_get = async (colecao) => {
  const snap = await getDoc(doc(db, colecao, uid()));
  return snap.exists() ? snap.data() : null;
};

const db_set = (colecao, dados) => setDoc(doc(db, colecao, uid()), dados);

const buscarFavoritos = async () => {
  const data = await db_get('favoritos');
  return data?.lista ?? [];
};

const buscarPerfil = async () => {
  const data = await db_get('perfis');
  return data ?? {};
};

// ─── PAÍSES API ──────────────────────────────────────────────────────────────
const API_PAISES = 'https://restcountries.com/v3.1';

const buscarTodosPaises = () =>
  fetch(`${API_PAISES}/all?fields=name,capital,flags,region,subregion,population,languages,currencies,continents,timezones`)
    .then(r => r.json())
    .then(lista => lista.sort((a, b) => a.name.common.localeCompare(b.name.common)));

const buscarPaisPorNome = (nome) =>
  fetch(`${API_PAISES}/name/${encodeURIComponent(nome)}?fullText=true&fields=name,capital,flags,region,subregion,population,languages,currencies,continents,timezones`)
    .then(r => r.json())
    .then(data => data?.[0] ?? null);

// ─── CLOUDINARY UPLOAD ───────────────────────────────────────────────────────
async function uploadFoto(uri) {
  const blob = await fetch(uri).then(r => r.blob());
  const form = new FormData();
  form.append('file', blob, 'foto.jpg');
  form.append('upload_preset', CLOUDINARY.preset);
  const res  = await fetch(CLOUDINARY.url, { method: 'POST', body: form });
  const json = await res.json();
  if (!json.secure_url) throw new Error(json.error?.message ?? 'Upload falhou');
  return json.secure_url;
}

// ─── COMPONENTES BASE ────────────────────────────────────────────────────────
const Stack = createNativeStackNavigator();

function Campo({ icone, placeholder, valor, onChange, senha, teclado, capitalizar, aoSubmeter, olho, onOlho, mostrar }) {
  return (
    <View style={g.campo}>
      <Ionicons name={icone} size={18} color="#aaa" style={{ marginRight: 10 }} />
      <TextInput
        style={g.campoTexto}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        value={valor}
        onChangeText={onChange}
        secureTextEntry={senha && !mostrar}
        keyboardType={teclado}
        autoCapitalize={capitalizar ?? 'none'}
        onSubmitEditing={aoSubmeter}
      />
      {olho && (
        <TouchableOpacity onPress={onOlho} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={mostrar ? 'eye-outline' : 'eye-off-outline'} size={18} color="#aaa" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function BarraNavegacao({ nav, ativa }) {
  const abas = [
    { tela: 'TelaPrincipal', rotulo: 'Início',    iconeOn: 'home',   iconeOff: 'home-outline'   },
    { tela: 'Favoritos',     rotulo: 'Favoritos', iconeOn: 'heart',  iconeOff: 'heart-outline'  },
    { tela: 'Perfil',        rotulo: 'Perfil',    iconeOn: 'person', iconeOff: 'person-outline' },
  ];
  return (
    <View style={g.barra}>
      {abas.map(({ tela, rotulo, iconeOn, iconeOff }) => {
        const on = ativa === tela;
        return (
          <TouchableOpacity key={tela} style={g.barraBotao} onPress={() => nav.navigate(tela)}>
            <Ionicons name={on ? iconeOn : iconeOff} size={24} color={on ? AZUL : '#aaa'} />
            <Text style={[g.barraRotulo, on && g.barraRoduloAtivo]}>{rotulo}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TopBar({ esquerda, titulo, direita }) {
  return (
    <View style={g.topBar}>
      <View style={g.topBarLado}>{esquerda}</View>
      <Text style={g.topBarTitulo}>{titulo}</Text>
      <View style={g.topBarLado}>{direita}</View>
    </View>
  );
}

function BotaoPrimario({ texto, onPress, cor, icone, disabled }) {
  return (
    <TouchableOpacity
      style={[g.botao, cor && { backgroundColor: cor }, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      {icone && <Ionicons name={icone} size={18} color="#fff" style={{ marginRight: 8 }} />}
      <Text style={g.botaoTexto}>{texto}</Text>
    </TouchableOpacity>
  );
}

// ─── TELA LOGIN ───────────────────────────────────────────────────────────────
function TelaLogin({ navigation: nav }) {
  const [email, setEmail]   = useState('');
  const [senha, setSenha]   = useState('');
  const [verSenha, setVer]  = useState(false);
  const [erro, setErro]     = useState('');

  const entrar = () => {
    if (!email.trim() || !senha) return setErro('Preencha todos os campos');
    setErro('');
    signInWithEmailAndPassword(auth, email.trim(), senha)
      .then(() => nav.replace('TelaPrincipal'))
      .catch(() => setErro('Email ou senha incorretos'));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEF2FF' }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={g.loginScroll} keyboardShouldPersistTaps="handled">
        <View style={g.loginHero}>
          <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Globe_icon.svg/240px-Globe_icon.svg.png' }} style={g.globo} />
          <Text style={g.loginTitulo}>CONHEÇA{'\n'}O MUNDO</Text>
          <Text style={g.loginSub}>Explore. Descubra. Viaje.</Text>
        </View>

        <View style={g.loginForm}>
          <Campo icone="mail-outline" placeholder="E-mail" valor={email} onChange={setEmail} teclado="email-address" />
          <Campo icone="lock-closed-outline" placeholder="Senha" valor={senha} onChange={setSenha} senha olho onOlho={() => setVer(!verSenha)} mostrar={verSenha} aoSubmeter={entrar} />
          {!!erro && <Text style={g.erro}>{erro}</Text>}
          <BotaoPrimario texto="Entrar" onPress={entrar} />
          <View style={g.linha}>
            <Text style={g.mutado}>Ainda não tem conta?  </Text>
            <TouchableOpacity onPress={() => nav.replace('Cadastro')}>
              <Text style={g.link}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── TELA CADASTRO ────────────────────────────────────────────────────────────
function TelaCadastro({ navigation: nav }) {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', conf: '' });
  const [ver, setVer]   = useState({ senha: false, conf: false });
  const [erro, setErro] = useState('');

  const campo = (chave) => ({
    valor: form[chave],
    onChange: (v) => setForm(f => ({ ...f, [chave]: v }))
  });

  const registrar = () => {
    const { nome, email, senha, conf } = form;
    if (!nome || !email || !senha || !conf) return setErro('Preencha todos os campos!');
    if (senha.length < 6)                   return setErro('Senha: mínimo 6 caracteres.');
    if (senha !== conf)                     return setErro('As senhas não coincidem.');
    setErro('');
    createUserWithEmailAndPassword(auth, email.trim(), senha)
      .then(async ({ user }) => {
        await db_set('perfis', { nome: nome.trim(), foto: null, paisesVisitados: 0, resenhas: 0 });
        Alert.alert('Sucesso', 'Conta criada!');
        nav.replace('TelaPrincipal');
      })
      .catch(e => {
        if (e.code === 'auth/email-already-in-use') setErro('Email já está em uso');
        else setErro(e.message);
      });
  };

  return (
    <SafeAreaView style={g.tela}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={g.voltarBtn} onPress={() => nav.replace('TelaLogin')}>
          <Ionicons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={g.tituloPagina}>Criar Conta</Text>
        <Text style={g.mutado}>Preencha os dados para se cadastrar</Text>

        <View style={{ marginTop: 24 }}>
          <Campo icone="person-outline" placeholder="Nome completo" capitalizar="words" {...campo('nome')} />
          <Campo icone="mail-outline"   placeholder="E-mail"        teclado="email-address" {...campo('email')} />
          <Campo icone="lock-closed-outline" placeholder="Senha"           senha olho onOlho={() => setVer(v => ({ ...v, senha: !v.senha }))} mostrar={ver.senha} {...campo('senha')} />
          <Campo icone="lock-closed-outline" placeholder="Confirmar senha" senha olho onOlho={() => setVer(v => ({ ...v, conf:  !v.conf  }))} mostrar={ver.conf}  {...campo('conf')} aoSubmeter={registrar} />
        </View>

        {!!erro && <Text style={g.erro}>{erro}</Text>}
        <BotaoPrimario texto="Cadastrar" onPress={registrar} />
        <View style={g.linha}>
          <Text style={g.mutado}>Já tem conta?  </Text>
          <TouchableOpacity onPress={() => nav.replace('TelaLogin')}>
            <Text style={g.link}>Faça login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
function TelaPrincipal({ navigation: nav }) {
  const [paises,    setPaises]    = useState([]);
  const [filtro,    setFiltro]    = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarTodosPaises()
      .then(setPaises)
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar os países.'))
      .finally(() => setCarregando(false));
  }, []);

  const lista = paises.filter(p =>
    p.name.common.toLowerCase().includes(filtro.toLowerCase())
  );

  const renderPais = useCallback(({ item: p }) => (
    <TouchableOpacity style={g.cardPais} onPress={() => nav.navigate('Detalhes', { pais: p })}>
      <Image source={{ uri: p.flags.png }} style={g.bandeirinha} />
      <View style={{ flex: 1 }}>
        <Text style={g.nomePais}>{p.name.common}</Text>
        <Text style={g.capitalPais}>Capital: {p.capital?.[0] ?? 'N/A'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  ), []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FF' }}>
      <StatusBar barStyle="light-content" backgroundColor={AZUL} />
      <TopBar
        titulo="Países"
        esquerda={<TouchableOpacity><Ionicons name="menu" size={22} color="#fff" /></TouchableOpacity>}
        direita={<TouchableOpacity><Ionicons name="notifications-outline" size={22} color="#fff" /></TouchableOpacity>}
      />
      <View style={g.buscaWrapper}>
        <Ionicons name="search" size={16} color="#aaa" style={{ marginRight: 8 }} />
        <TextInput style={g.buscaInput} placeholder="Pesquisar país..." placeholderTextColor="#bbb" value={filtro} onChangeText={setFiltro} />
      </View>

      {carregando
        ? <ActivityIndicator size="large" color={AZUL} style={{ marginTop: 40 }} />
        : <FlatList data={lista} keyExtractor={p => p.name.common} renderItem={renderPais} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }} />
      }
      <BarraNavegacao nav={nav} ativa="TelaPrincipal" />
    </View>
  );
}

// ─── TELA DETALHES ────────────────────────────────────────────────────────────
function TelaDetalhes({ route, navigation: nav }) {
  const { pais } = route.params;
  const [favoritado, setFavoritado] = useState(false);

  useEffect(() => {
    buscarFavoritos().then(lista =>
      setFavoritado(lista.some(f => f.nome === pais.name.common))
    );
  }, []);

  const alternarFavorito = async () => {
    try {
      const lista = await buscarFavoritos();
      const jatem = lista.some(f => f.nome === pais.name.common);
      const nova  = jatem
        ? lista.filter(f => f.nome !== pais.name.common)
        : [...lista, { nome: pais.name.common, capital: pais.capital?.[0] ?? 'N/A', bandeira: pais.flags.png, regiao: pais.region, pais }];
      await db_set('favoritos', { lista: nova });
      setFavoritado(!jatem);
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  const infos = [
    ['location-outline',   'Capital',      pais.capital?.[0]],
    ['people-outline',     'População',    pais.population?.toLocaleString()],
    ['chatbubble-outline', 'Idioma',       Object.values(pais.languages  ?? {}).join(', ')],
    ['cash-outline',       'Moeda',        Object.values(pais.currencies ?? {}).map(c => c.name).join(', ')],
    ['earth-outline',      'Região',       pais.region],
    ['map-outline',        'Sub-região',   pais.subregion],
    ['globe-outline',      'Continente',   pais.continents?.[0]],
    ['time-outline',       'Fuso horário', pais.timezones?.[0]],
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <TopBar
        titulo="Detalhes do País"
        esquerda={
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        }
        direita={
          <TouchableOpacity onPress={alternarFavorito}>
            <Ionicons name={favoritado ? 'heart' : 'heart-outline'} size={22} color="#fff" />
          </TouchableOpacity>
        }
      />
      <ScrollView>
        <Image source={{ uri: pais.flags.png }} style={g.bannerPais} />
        <View style={{ padding: 20 }}>
          <Image source={{ uri: pais.flags.png }} style={g.bandeiraDetalhes} />
          <Text style={g.nomeGrande}>{pais.name.common}</Text>
          <Text style={g.nomeOficial}>{pais.name.official}</Text>
          {infos.map(([icone, rotulo, valor]) => (
            <View key={rotulo} style={g.infoLinha}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={icone} size={18} color={AZUL} style={{ marginRight: 10 }} />
                <Text style={g.infoRotulo}>{rotulo}</Text>
              </View>
              <Text style={g.infoValor}>{valor ?? 'N/A'}</Text>
            </View>
          ))}
          <BotaoPrimario
            texto={favoritado ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
            icone={favoritado ? 'heart-dislike' : 'heart'}
            cor={favoritado ? '#e53935' : AZUL}
            onPress={alternarFavorito}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── TELA PERFIL ──────────────────────────────────────────────────────────────
function TelaPerfil({ navigation: nav }) {
  const usuario = auth.currentUser;
  const [perfil, setPerfil] = useState({ nome: '', foto: null });
  const [contadores, setContadores] = useState({ favoritos: 0, paisesVisitados: 0, resenhas: 0 });

  const carregar = useCallback(async () => {
    const [p, favs] = await Promise.all([buscarPerfil(), buscarFavoritos()]);
    setPerfil({ nome: p.nome ?? '', foto: p.foto ?? null });
    setContadores({ favoritos: favs.length, paisesVisitados: p.paisesVisitados ?? 0, resenhas: p.resenhas ?? 0 });
  }, []);

  useEffect(() => {
    const sub = nav.addListener('focus', carregar);
    return sub;
  }, [nav, carregar]);

  const opcoes = [
    { icone: 'pencil-outline',      texto: 'Editar Perfil',  acao: () => {} },
    { icone: 'camera-outline',      texto: 'Alterar Foto',   acao: () => nav.navigate('AlterarFoto') },
    { icone: 'lock-closed-outline', texto: 'Alterar Senha',  acao: () => nav.navigate('AlterarSenha') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FF' }}>
      <StatusBar barStyle="light-content" backgroundColor={AZUL} />
      <TopBar
        titulo="Meu Perfil"
        esquerda={<TouchableOpacity><Ionicons name="menu" size={22} color="#fff" /></TouchableOpacity>}
        direita={<TouchableOpacity><Ionicons name="create-outline" size={22} color="#fff" /></TouchableOpacity>}
      />
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 20, paddingBottom: 24 }}>
        <View style={{ marginTop: 20, marginBottom: 10, position: 'relative' }}>
          <Image
            source={{ uri: perfil.foto ?? 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png' }}
            style={g.avatar}
          />
          <View style={g.avatarCracha}>
            <Ionicons name="camera" size={13} color="#fff" />
          </View>
        </View>

        <Text style={g.perfilNome}>{perfil.nome || usuario?.email?.split('@')[0] || 'Usuário'}</Text>
        <Text style={g.perfilEmail}>{usuario?.email}</Text>

        <View style={g.statsBox}>
          {[
            { num: contadores.favoritos,       rot: 'Favoritos'       },
            { num: contadores.paisesVisitados, rot: 'Países visitados' },
            { num: contadores.resenhas,        rot: 'Resenhas'        },
          ].map(({ num, rot }, i, arr) => (
            <React.Fragment key={rot}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={g.statNum}>{num}</Text>
                <Text style={g.statRot}>{rot}</Text>
              </View>
              {i < arr.length - 1 && <View style={g.statDivisor} />}
            </React.Fragment>
          ))}
        </View>

        <View style={g.menuBox}>
          {opcoes.map(({ icone, texto, acao }, i) => (
            <TouchableOpacity key={texto} style={[g.menuItem, i < opcoes.length - 1 && g.menuBorda]} onPress={acao}>
              <Ionicons name={icone} size={20} color="#444" style={{ marginRight: 14 }} />
              <Text style={g.menuTexto}>{texto}</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={g.menuBox} onPress={() => signOut(auth).then(() => nav.replace('TelaLogin'))}>
          <View style={g.menuItem}>
            <Ionicons name="log-out-outline" size={20} color="#e53935" style={{ marginRight: 14 }} />
            <Text style={[g.menuTexto, { color: '#e53935' }]}>Sair</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
      <BarraNavegacao nav={nav} ativa="Perfil" />
    </View>
  );
}

// ─── TELA FAVORITOS ───────────────────────────────────────────────────────────
function TelaFavoritos({ navigation: nav }) {
  const [lista, setLista] = useState([]);

  useEffect(() => {
    const sub = nav.addListener('focus', () =>
      buscarFavoritos().then(setLista).catch(e => Alert.alert('Erro', e.message))
    );
    return sub;
  }, [nav]);

  const remover = async (nome) => {
    const nova = lista.filter(f => f.nome !== nome);
    await db_set('favoritos', { lista: nova });
    setLista(nova);
  };

  const abrirDetalhes = async (item) => {
    if (item.pais) return nav.navigate('Detalhes', { pais: item.pais });
    const pais = await buscarPaisPorNome(item.nome);
    if (pais) nav.navigate('Detalhes', { pais });
    else Alert.alert('Erro', 'Não foi possível carregar os detalhes.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FF' }}>
      <StatusBar barStyle="light-content" backgroundColor={AZUL} />
      <TopBar
        titulo="Meus Favoritos"
        esquerda={<TouchableOpacity><Ionicons name="menu" size={22} color="#fff" /></TouchableOpacity>}
        direita={<View style={{ width: 36 }} />}
      />
      <FlatList
        data={lista}
        keyExtractor={f => f.nome}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#aaa' }}>Nenhum favorito ainda.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={g.cardFav} onPress={() => abrirDetalhes(item)}>
            <Image source={{ uri: item.bandeira }} style={g.imagemFav} />
            <View style={{ flex: 1, paddingHorizontal: 14 }}>
              <Text style={g.nomePais}>{item.nome}</Text>
              <Text style={g.capitalPais}>Capital: {item.capital}</Text>
            </View>
            <TouchableOpacity onPress={() => remover(item.nome)} style={{ padding: 10 }}>
              <Ionicons name="heart" size={24} color="#e53935" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
      <BarraNavegacao nav={nav} ativa="Favoritos" />
    </View>
  );
}

// ─── TELA ALTERAR FOTO ────────────────────────────────────────────────────────
function TelaAlterarFoto({ navigation: nav }) {
  const [imagem,   setImagem]   = useState(null);
  const [enviando, setEnviando] = useState(false);

  const pedirGaleria = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return Alert.alert('Permissão negada');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true });
    if (!res.canceled) setImagem(res.assets[0]);
  };

  const pedirCamera = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return Alert.alert('Permissão negada');
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
    if (!res.canceled) setImagem(res.assets[0]);
  };

  const salvar = async () => {
    if (!imagem) return Alert.alert('Aviso', 'Escolha uma imagem primeiro');
    setEnviando(true);
    try {
      const url = await uploadFoto(imagem.uri);
      const perfilAtual = await buscarPerfil();
      await db_set('perfis', { ...perfilAtual, foto: url });
      Alert.alert('Sucesso', 'Foto atualizada!');
      nav.goBack();
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={g.tela}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 28 }}>
        <View style={{ position: 'relative', marginBottom: 16 }}>
          <Image
            source={{ uri: imagem?.uri ?? 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png' }}
            style={g.avatarGrande}
          />
          <View style={g.avatarCracha}>
            <Ionicons name="camera" size={13} color="#fff" />
          </View>
        </View>

        <Text style={g.tituloPagina}>{imagem ? 'Imagem selecionada' : 'Escolha uma imagem'}</Text>
        <Text style={[g.mutado, { marginBottom: 28 }]}>Sua foto será enviada para a Cloudinary</Text>

        <TouchableOpacity style={g.botaoOutline} onPress={pedirGaleria}>
          <Ionicons name="images-outline" size={20} color={AZUL} style={{ marginRight: 10 }} />
          <Text style={g.botaoOutlineTexto}>Escolher da Galeria</Text>
        </TouchableOpacity>

        <BotaoPrimario texto="Tirar Foto" icone="camera-outline" onPress={pedirCamera} />

        {imagem && (
          <BotaoPrimario
            texto={enviando ? 'Salvando...' : 'Confirmar e Salvar'}
            icone="cloud-upload-outline"
            cor="#28a745"
            onPress={salvar}
            disabled={enviando}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── TELA ALTERAR SENHA ───────────────────────────────────────────────────────
function TelaAlterarSenha({ navigation: nav }) {
  const [nova,     setNova]     = useState('');
  const [conf,     setConf]     = useState('');
  const [erro,     setErro]     = useState('');
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setErro('');
    if (!nova || !conf)     return setErro('Preencha todos os campos.');
    if (nova.length < 6)    return setErro('Mínimo 6 caracteres.');
    if (nova !== conf)      return setErro('As senhas não coincidem.');
    setSalvando(true);
    try {
      await updatePassword(auth.currentUser, nova);
      Alert.alert('Sucesso', 'Senha alterada!');
      nav.goBack();
    } catch (e) {
      setErro(e.message.includes('requires-recent-login')
        ? 'Saia e entre novamente para alterar a senha.'
        : e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={g.tela}>
      <View style={{ padding: 24 }}>
        <Text style={g.tituloPagina}>Alterar Senha</Text>
        <View style={{ marginTop: 16 }}>
          <Campo icone="lock-closed-outline" placeholder="Nova senha"          valor={nova} onChange={setNova} senha />
          <Campo icone="lock-closed-outline" placeholder="Confirmar nova senha" valor={conf} onChange={setConf} senha aoSubmeter={salvar} />
        </View>
        {!!erro && <Text style={g.erro}>{erro}</Text>}
        <BotaoPrimario texto={salvando ? 'Salvando...' : 'Salvar'} onPress={salvar} disabled={salvando} />
      </View>
    </SafeAreaView>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="TelaLogin" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TelaLogin"      component={TelaLogin} />
        <Stack.Screen name="Cadastro"       component={TelaCadastro} />
        <Stack.Screen name="TelaPrincipal"  component={TelaPrincipal} />
        <Stack.Screen name="Detalhes"       component={TelaDetalhes} />
        <Stack.Screen name="Favoritos"      component={TelaFavoritos} />
        <Stack.Screen name="Perfil"         component={TelaPerfil} />
        <Stack.Screen name="AlterarFoto"    component={TelaAlterarFoto}  options={{ headerShown: true, title: 'Alterar Foto' }} />
        <Stack.Screen name="AlterarSenha"   component={TelaAlterarSenha} options={{ headerShown: true, title: 'Alterar Senha' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const AZUL = '#1565FF';

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const g = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#fff' },

  // Login
  loginScroll:  { alignItems: 'center', paddingBottom: 40 },
  loginHero:    { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  globo:        { width: 100, height: 100, marginBottom: 14 },
  loginTitulo:  { fontSize: 32, fontWeight: '900', color: AZUL, textAlign: 'center', lineHeight: 38, letterSpacing: 1 },
  loginSub:     { fontSize: 14, color: '#888', marginTop: 8 },
  loginForm:    { width: '100%', paddingHorizontal: 28 },

  // Campo
  campo:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#dde3f0', marginBottom: 14, paddingHorizontal: 14, height: 52, elevation: 1 },
  campoTexto: { flex: 1, fontSize: 15, color: '#222' },

  // Botões
  botao:            { backgroundColor: AZUL, borderRadius: 12, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, elevation: 3, width: '100%' },
  botaoTexto:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  botaoOutline:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: 52, borderWidth: 1.5, borderColor: AZUL, borderRadius: 12, marginTop: 8 },
  botaoOutlineTexto:{ color: AZUL, fontSize: 15, fontWeight: '700' },

  // Misc
  erro:       { color: '#e53935', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  mutado:     { color: '#888', fontSize: 14 },
  link:       { color: AZUL, fontSize: 14, fontWeight: '700' },
  linha:      { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  voltarBtn:  { width: 38, height: 38, borderRadius: 10, backgroundColor: '#f0f4ff', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  tituloPagina:{ fontSize: 26, fontWeight: '800', color: '#111', marginBottom: 6 },

  // TopBar
  topBar:       { backgroundColor: AZUL, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14 },
  topBarTitulo: { color: '#fff', fontSize: 18, fontWeight: '700' },
  topBarLado:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Busca
  buscaWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 14, borderRadius: 12, paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: '#e8eaf0', elevation: 2 },
  buscaInput:   { flex: 1, fontSize: 14, color: '#222' },

  // Card país
  cardPais:   { backgroundColor: '#fff', marginBottom: 10, padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  bandeirinha:{ width: 58, height: 40, marginRight: 14, borderRadius: 6 },
  nomePais:   { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 2 },
  capitalPais:{ color: '#888', fontSize: 13 },

  // Detalhes
  bannerPais:      { width: '100%', height: 200 },
  bandeiraDetalhes:{ width: 52, height: 36, borderRadius: 4, marginBottom: 10 },
  nomeGrande:      { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 2 },
  nomeOficial:     { fontSize: 13, color: '#888', marginBottom: 20 },
  infoLinha:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoRotulo:      { fontSize: 15, color: '#444', fontWeight: '500' },
  infoValor:       { fontSize: 15, color: '#111', fontWeight: '600', maxWidth: '50%', textAlign: 'right' },

  // Perfil
  avatar:      { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff', elevation: 4 },
  avatarCracha:{ position: 'absolute', bottom: 0, right: 0, backgroundColor: AZUL, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarGrande:{ width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: '#e0e7ff' },
  perfilNome:  { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 2 },
  perfilEmail: { fontSize: 13, color: '#888', marginBottom: 18 },
  statsBox:    { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, width: '100%', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, marginBottom: 20 },
  statNum:     { fontSize: 20, fontWeight: '800', color: AZUL },
  statRot:     { fontSize: 11, color: '#888', marginTop: 2, textAlign: 'center' },
  statDivisor: { width: 1, backgroundColor: '#eee' },

  // Menu
  menuBox:  { backgroundColor: '#fff', borderRadius: 16, width: '100%', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, marginBottom: 14, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18 },
  menuBorda:{ borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuTexto:{ flex: 1, fontSize: 15, color: '#222', fontWeight: '500' },

  // Favoritos
  cardFav:  { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  imagemFav:{ width: 90, height: 70 },

  // Barra navegação
  barra:         { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, paddingBottom: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e0e0e0' },
  barraBotao:    { alignItems: 'center', flex: 1 },
  barraRotulo:   { fontSize: 11, color: '#aaa', marginTop: 3 },
  barraRoduloAtivo: { color: AZUL, fontWeight: '600' },
});
