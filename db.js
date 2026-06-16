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

async function createPost(postData) {
  if (!postData || !postData.user_id) {
    return { data: null, error: { message: 'Vous devez être connecté pour publier.' } };
  }

  const payload = {
    user_id: postData.user_id,
    title: (postData.title || '').trim(),
    content: (postData.content || '').trim(),
    date: postData.date || new Date().toISOString().slice(0, 10),
    author: (postData.author || '').trim() || 'Utilisateur',
    category: (postData.category || '').trim(),
    created_at: postData.created_at || new Date().toISOString(),
    image_url: postData.image_url || null,
  };

  if (!payload.title || !payload.content || !payload.category) {
    return { data: null, error: { message: 'Titre, contenu et catégorie sont requis.' } };
  }

  const { data, error } = await supabaseClient
    .from('posts')
    .insert([payload])
    .select('*')
    .single();

  return { data, error };
}

async function getPosts() {
  const { data, error } = await supabaseClient
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error };
}

async function updateUserProfile(userId, updates) {
  if (!userId) {
    return { user: null, error: { message: 'Utilisateur non identifié.' } };
  }

  const username = typeof updates.username === 'string' ? updates.username.trim() : '';
  const email = typeof updates.email === 'string' ? updates.email.trim().toLowerCase() : '';
  const password = typeof updates.password === 'string' ? updates.password : '';

  if (!username || !email) {
    return { user: null, error: { message: 'Le nom affiché et l’email sont requis.' } };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { user: null, error: { message: 'Adresse e-mail invalide.' } };
  }

  const { data: existingUsers, error: checkError } = await supabaseClient
    .from('users')
    .select('id, username, email')
    .or(`username.eq.${username},email.eq.${email}`);

  if (checkError) {
    return { user: null, error: checkError };
  }

  const duplicate = (existingUsers || []).find((u) => u.id !== userId);
  if (duplicate) {
    if (duplicate.username?.toLowerCase() === username.toLowerCase()) {
      return { user: null, error: { message: 'Ce nom d’utilisateur est déjà utilisé.' } };
    }
    if (duplicate.email?.toLowerCase() === email.toLowerCase()) {
      return { user: null, error: { message: 'Cette adresse e-mail est déjà utilisée.' } };
    }
  }

  const updatePayload = { username, email };
  if (password) {
    if (password.length < 6) {
      return { user: null, error: { message: 'Le mot de passe doit contenir au moins 6 caractères.' } };
    }
    updatePayload.password = password;
  }

  const { data, error } = await supabaseClient
    .from('users')
    .update(updatePayload)
    .eq('id', userId)
    .select('id, username, email, role')
    .single();

  return { user: data, error };
}

async function getPostsByUser(userId) {
  const { data, error } = await supabaseClient
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}
async function deletePost(postId) {
  const { error } = await supabaseClient
    .from("posts")
    .delete()
    .eq("id", postId);

  return error;
}



// Rendre ces helpers accessibles globalement au script client
window.getUserById = getUserById;
window.getUserByEmail = getUserByEmail;
window.updateUserProfile = updateUserProfile;
window.createPost = createPost;
window.getPosts = getPosts;
window.getPostsByUser = getPostsByUser;
window.deletePost = deletePost;
window.supabaseClient = supabaseClient;
