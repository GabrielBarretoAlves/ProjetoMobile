import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'phosphor-react-native'
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name

        },
      },
    })

    if (error) {
      Alert.alert(error.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    router.replace('/')

  }
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={styles.container}>
          <StatusBar style="auto" />

          <Pressable
            style={styles.arrow}
            onPress={() => { router.back() }}
          >
            <ArrowLeft size={32} color='white' />

          </Pressable>

          <View style={styles.header}>
            <Text style={styles.logo}>
              Teste<Text style={styles.logoBank}>Bank</Text>
            </Text>
            <Text style={styles.slogan}>
              Crie a sua Conta.
            </Text>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Nome completo</Text>
              <TextInput
                placeholder="Digite seu nome Completo"
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
            </View>

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
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Pressable style={styles.button} onPress={handleSignup}>
              <Text style={styles.bt}>
                {loading ? 'Carregando...' : 'Entrar'}
              </Text>

            </Pressable>

          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
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
  arrow: {
    paddingHorizontal: 20,
    marginTop: 60,
  },
});