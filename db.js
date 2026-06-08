// Remplacez ces valeurs par votre URL et votre clé anonyme Supabase.
const SUPABASE_URL = 'https://miabrdukcwoadcbbeeld.supabase.co/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pYWJyZHVrY3dvYWRjYmJlZWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDg1ODIsImV4cCI6MjA5NTYyNDU4Mn0.S4ZFkp1szRZlf_M4lwSlfqKZZacprd-YbIhzwxa6s3A';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loginSupabase(email, password) {
  if (!email || !password) {
    return { user: null, error: { message: 'Email et mot de passe requis.' } };
  }

  const { data, error } = await supabaseClient
    .from('users')
    .select('id, username, email, role')
    .eq('email', email)
    .eq('password', password)
    .single();

  return { user: data, error };
}

async function registerSupabase(email, password) {
  if (!email || !password) {
    return { user: null, error: { message: 'Email et mot de passe requis.' } };
  }

  const username = email.split('@')[0] || email;
  const role = 'member';

  const { data, error } = await supabaseClient
    .from('users')
    .insert([{ email, password, username, role }])
    .single();

  return { user: data, error };
}

function isSupabaseConfigured() {
  return SUPABASE_URL !== 'https://miabrdukcwoadcbbeeld.supabase.co/' && SUPABASE_ANON_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pYWJyZHVrY3dvYWRjYmJlZWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDg1ODIsImV4cCI6MjA5NTYyNDU4Mn0.S4ZFkp1szRZlf_M4lwSlfqKZZacprd-YbIhzwxa6s3A';
}

// Récupère un utilisateur par son `id` (depuis la table `users`).
async function getUserById(id) {
  if (!id) return { user: null, error: { message: 'ID requis.' } };

  const { data, error } = await supabaseClient
    .from('users')
    .select('id, username, email, role')
    .eq('id', id)
    .single();

  return { user: data, error };
}

// Récupère un utilisateur par son email (utile si seul l'email est stocké en localStorage).
async function getUserByEmail(email) {
  if (!email) return { user: null, error: { message: 'Email requis.' } };

  const { data, error } = await supabaseClient
    .from('users')
    .select('id, username, email, role')
    .eq('email', email)
    .single();

  return { user: data, error };
}

// Rendre ces helpers accessibles globalement au script client
window.getUserById = getUserById;
window.getUserByEmail = getUserByEmail;
window.supabaseClient = supabaseClient;
