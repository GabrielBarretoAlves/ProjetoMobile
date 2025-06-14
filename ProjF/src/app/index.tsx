import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { Link } from 'expo-router'
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

export default function Login() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      Alert.alert(error.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    router.replace('/(panel)/profile/page')

  }
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.logo}>
          Teste<Text style={styles.logoBank}>Bank</Text>
        </Text>
        <Text style={styles.slogan}>
          Welcome to TesteBank
        </Text>
      </View>

      <View style={styles.form}>
        <View>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Digite seu Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            placeholder="Digite sua Senha"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
          />
        </View>

        <Pressable style={styles.button} onPress={handleSignIn}>
          <Text style={styles.bt}>
            {loading ? 'Carregando...' : 'Entrar'}
          </Text>

        </Pressable>

        <Link href="../(auth)/signup/page" style={styles.link}>
          <Text>
            Ainda não tem uma conta? Cadastre-se
          </Text>
        </Link>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181a20",

  },
  header: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  logo: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 50,
  },
  logoBank: {
    color: "green",
    fontSize: 28,
  },
  slogan: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 23,
    marginBottom: 50,
  },
  form: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 30,
    paddingVertical: 30,
  },
  label: {
    color: "#181a20",
    marginTop: 15,
    marginBottom: 6,
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "grey",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingTop: 14,
  },
  button: {
    backgroundColor: "green",
    paddingTop: 14,
    paddingBottom: 14,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    borderRadius: 8,
    marginTop: 20,
  },
  bt: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    marginTop: 20,
    textAlign: "center",
    fontWeight: "bold"
  },
});