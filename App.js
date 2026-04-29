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
        Alert.alert("Sucesso", "Cadastro realizado com sucesso!");
        navigation.goBack();
      })
      .catch((error) => {
        console.log("ERRO CADASTRO", error);
        Alert.alert("Erro", error.message);
      });
  };

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
  const [usd, setUsd] = React.useState(null);
  const [eur, setEur] = React.useState(null);
  const [dataHora, setDataHora] = React.useState("");

  const buscarCotacoes = async () => {
    try {
      const response = await fetch(
        "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL"
      );

      const data = await response.json();

      const usdData = data.USDBRL;
      const eurData = data.EURBRL;

      setUsd(parseFloat(usdData.bid));
      setEur(parseFloat(eurData.bid));
      setDataHora(usdData.create_date);

    } catch (error) {
      Alert.alert("Erro", "Erro ao buscar cotações");
    }
  };

  React.useEffect(() => {
    buscarCotacoes();
  }, []);

  return (
    <View style={styles.container}>

      <Text style={styles.titulo}>Cotação de Moedas</Text>

      <Text style={styles.subtitulo}>
        Atualizado em: {dataHora}
      </Text>

      {/* CARD USD */}
      <View style={styles.card}>
        <Image
          source={{ uri: "https://flagcdn.com/w80/us.png" }}
          style={styles.bandeira}
        />
        <Text style={styles.moeda}>Dólar Americano (USD)</Text>
        <Text style={styles.codigo}>USD-BRL</Text>
        <Text style={styles.valor}>
          R$ {usd ? usd.toFixed(2) : "0.00"}
        </Text>
      </View>

      {/* CARD EUR */}
      <View style={styles.card}>
        <Image
          source={{ uri: "https://flagcdn.com/w80/eu.png" }}
          style={styles.bandeira}
        />
        <Text style={styles.moeda}>Euro (EUR)</Text>
        <Text style={styles.codigo}>EUR-BRL</Text>
        <Text style={styles.valor}>
          R$ {eur ? eur.toFixed(2) : "0.00"}
        </Text>
      </View>

      {/* BOTÃO */}
      <TouchableOpacity style={styles.botao} onPress={buscarCotacoes}>
        <Text style={styles.texto}>Atualizar Cotações</Text>
      </TouchableOpacity>

    </View>
  );
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
    width: 200,
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
  }
});