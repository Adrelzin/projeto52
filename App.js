import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Alert
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScrollView } from 'react-native';

import { login, cadastrar } from './auth';

const Stack = createNativeStackNavigator();


// ================= LOGIN =================
function TelaLogin({ navigation }) {
  const [email, setEmail] = React.useState('');
  const [senha, setSenha] = React.useState('');

  const fazerLogin = () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha email e senha");
      return;
    }

    login(email, senha)
      .then(() => {
        Alert.alert("Sucesso", "Login realizado!");

        navigation.reset({
          index: 0,
          routes: [{ name: 'Cotacao' }],
        });
      })
      .catch((error) => {
        if (error.code === "auth/user-not-found") {
          Alert.alert("Erro", "Usuário não encontrado");
        } else if (error.code === "auth/wrong-password") {
          Alert.alert("Erro", "Senha incorreta");
        } else {
          Alert.alert("Erro", "Falha ao fazer login");
        }
      });
  };

  return (
    <View style={styles.container}>
      <Image
        style={styles.tinyLogo}
        source={{
          uri: 'https://marketplace.canva.com/A5alg/MAESXCA5alg/1/tl/canva-user-icon-MAESXCA5alg.png',
        }}
      />

      <View style={styles.container_inputs}>
        <Text>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu email"
          onChangeText={setEmail}
          value={email}
        />

        <Text>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite sua senha"
          onChangeText={setSenha}
          value={senha}
          secureTextEntry
        />
      </View>

      <View style={styles.container_btn}>
        <TouchableOpacity style={styles.botao} onPress={fazerLogin}>
          <Text style={styles.texto}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botao}
          onPress={() => navigation.navigate('Cadastro')}
        >
          <Text style={styles.texto}>Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


// ================= CADASTRO =================
function TelaCadastro({ navigation }) {
  const [nome, setNome] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [senha, setSenha] = React.useState('');

  const salvar = () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha email e senha");
      return;
    }

    cadastrar(email, senha)
      .then((res) => {
        console.log("CADASTRO OK", res);

        Alert.alert("Sucesso", "Você foi cadastrado");

        setTimeout(() => {
          navigation.goBack();
        }, 500);
      })
      .catch((error) => {
        console.log("ERRO CADASTRO:", error.code);

        if (error.code === "auth/email-already-in-use") {
          Alert.alert("Erro", "Email já está em uso");
        } else if (error.code === "auth/weak-password") {
          Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
        } else if (error.code === "auth/invalid-email") {
          Alert.alert("Erro", "Email inválido");
        } else {
          Alert.alert("Erro", "Erro ao cadastrar");
        }
      });
  }

  return (
    <View style={styles.container}>
      <View style={styles.container_inputs}>
        <Text>Nome</Text>
        <TextInput style={styles.input} onChangeText={setNome} value={nome} />

        <Text>Email</Text>
        <TextInput style={styles.input} onChangeText={setEmail} value={email} />

        <Text>Senha</Text>
        <TextInput
          style={styles.input}
          onChangeText={setSenha}
          value={senha}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.botao} onPress={salvar}>
        <Text style={styles.texto}>Cadastrar</Text>
      </TouchableOpacity>
    </View>
  );
}


// ================= TELA DE COTAÇÃO =================
function TelaCotacao() {
  const [moedas, setMoedas] = React.useState({});
  const [dataHora, setDataHora] = React.useState("");

  const buscarCotacoes = async () => {
    try {
      const response = await fetch(
        "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,CAD-BRL,USDT-BRL,GBP-BRL,ARS-BRL,BTC-BRL,LTC-BRL,JPY-BRL,CHF-BRL,AUD-BRL,CNY-BRL,ILS-BRL,ETH-BRL,XRP-BRL,DOGE-BRL"
      );

      const data = await response.json();

      const resultado = {
        USD: data.USDBRL,
        EUR: data.EURBRL,
        CAD: data.CADBRL,
        USDT: data.USDTBRL,
        GBP: data.GBPBRL,
        ARS: data.ARSBRL,
        BTC: data.BTCBRL,
        LTC: data.LTCBRL,
        JPY: data.JPYBRL,
        CHF: data.CHFBRL,
        AUD: data.AUDBRL,
        CNY: data.CNYBRL,
        ILS: data.ILSBRL,
        ETH: data.ETHBRL,
        XRP: data.XRPBRL,
        DOGE: data.DOGEBRL,
      };

      setMoedas(resultado);

      setDataHora(data.USDBRL.create_date);
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Erro ao buscar cotações");
    }
  };

  React.useEffect(() => {
    buscarCotacoes();
  }, []);

  const renderCard = (code, nome, flag) => {
    const item = moedas[code];

    return (
      <View style={styles.card}>
        <Image source={{ uri: flag }} style={styles.bandeira} />

        <Text style={styles.moeda}>
          {nome} ({code})
        </Text>

        <Text style={styles.codigo}>{code}-BRL</Text>

        <Text style={styles.valor}>
          R$ {item ? parseFloat(item.bid).toFixed(2) : "0.00"}
        </Text>
      </View>
    );
  };

 return (
  <ScrollView contentContainerStyle={styles.scrollContainer}>

    <Text style={styles.titulo}>Cotação de Moedas</Text>

    <Text style={styles.subtitulo}>
      Atualizado em: {dataHora}
    </Text>

    {/* GRID */}
    <View style={styles.grid}>

      {renderCard("USD", "Dólar Americano", "https://flagcdn.com/w80/us.png")}
      {renderCard("EUR", "Euro", "https://flagcdn.com/w80/eu.png")}
      {renderCard("CAD", "Dólar Canadense", "https://flagcdn.com/w80/ca.png")}
      {renderCard("USDT", "Dólar Turismo", "https://flagcdn.com/w80/us.png")}
      {renderCard("GBP", "Libra Esterlina", "https://flagcdn.com/w80/gb.png")}
      {renderCard("ARS", "Peso Argentino", "https://flagcdn.com/w80/ar.png")}
      {renderCard("BTC", "Bitcoin", "https://cryptologos.cc/logos/bitcoin-btc-logo.png")}
      {renderCard("LTC", "Litecoin", "https://cryptologos.cc/logos/litecoin-ltc-logo.png")}
      {renderCard("JPY", "Iene Japonês", "https://flagcdn.com/w80/jp.png")}
      {renderCard("CHF", "Franco Suíço", "https://flagcdn.com/w80/ch.png")}
      {renderCard("AUD", "Dólar Australiano", "https://flagcdn.com/w80/au.png")}
      {renderCard("CNY", "Yuan Chinês", "https://flagcdn.com/w80/cn.png")}
      {renderCard("ILS", "Shekel Israelense", "https://flagcdn.com/w80/il.png")}
      {renderCard("ETH", "Ethereum", "https://cryptologos.cc/logos/ethereum-eth-logo.png")}
      {renderCard("XRP", "XRP", "https://cryptologos.cc/logos/xrp-xrp-logo.png")}
      {renderCard("DOGE", "Dogecoin", "https://cryptologos.cc/logos/dogecoin-doge-logo.png")}

    </View>

    <TouchableOpacity style={styles.botao} onPress={buscarCotacoes}>
      <Text style={styles.texto}>Atualizar Cotações</Text>
    </TouchableOpacity>

  </ScrollView>
 )
}

// ================= APP =================
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={TelaLogin} />
        <Stack.Screen name="Cadastro" component={TelaCadastro} />
        <Stack.Screen name="Cotacao" component={TelaCotacao} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


// ================= ESTILOS =================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAEBD7',
    alignItems: 'center',
    justifyContent: 'center'
  },

  titulo: {
    fontSize: 22,
    fontWeight: 'bold'
  },

  subtitulo: {
    marginTop: 5,
    marginBottom: 20
  },

  tinyLogo: {
    width: 50,
    height: 50
  },

  input: {
    backgroundColor: '#fff',
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: 200
  },

  botao: {
    backgroundColor: '#149e02ff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    width: 200
  },

  texto: {
    color: '#fff',
    fontWeight: 'bold'
  },

  container_btn: {
    gap: 10,
    marginTop: 10,
    width: 200
  },

  container_inputs: {
    width: 400,
    marginTop: 20
  },

  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
    width: 250
  },

  cardTitulo: {
    fontSize: 18
  },

  valor: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5
  },

  bandeira: {
    width: 50,
    height: 35,
    marginBottom: 10
  },

  moeda: {
    fontSize: 16,
    fontWeight: "bold"
  },

  codigo: {
    fontSize: 14,
    color: "gray"
  },

  valor: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
    width: "47%", // 👈 faz ficar 2 por linha
  },

  bandeira: {
    width: 40,
    height: 30,
    marginBottom: 8,
  },
});