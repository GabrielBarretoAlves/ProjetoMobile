import { AppState } from 'react-native'
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { supaUrl, anonKey } from '@/constants/supabase'

const supabaseUrl = supaUrl;
const supabaseAnonKey = anonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Atualiza o token automaticamente quando o app está em primeiro plano
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

// Função para verificar a sessão
export async function verificarSessao() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Sessão atual:', session);
    
    if (!session) {
      console.log('Nenhuma sessão encontrada');
      return null;
    }

    return session;
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return null;
  }
}