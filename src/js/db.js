const SUPABASE_URL = 'https://miabrdukcwoadcbbeeld.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pYWJyZHVrY3dvYWRjYmJlZWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDg1ODIsImV4cCI6MjA5NTYyNDU4Mn0.S4ZFkp1szRZlf_M4lwSlfqKZZacprd-YbIhzwxa6s3A';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// AUTH
// ============================================================

async function loginSupabase(email, password) {
  if (!email || !password) {
    return { user: null, error: { message: 'Email et mot de passe requis.' } };
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    return { user: null, error: error || { message: 'Connexion échouée.' } };
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from('users')
    .select('id, username, email, role')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    return { user: null, error: profileError || { message: 'Profil introuvable.' } };
  }

  return { user: profile, error: null };
}

async function registerSupabase(email, password, username) {
    if (!email || !password || !username) {
    return { user: null, error: { message: 'Tous les champs sont requis.' } };
  }
  const { data, error } = await supabaseClient.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    return { user: null, error: error || { message: 'Inscription échouée.' } };
  }

  const { error: insertError } = await supabaseClient
    .from('users')
    .insert([{
      id: data.user.id,
      email: email.trim().toLowerCase(),
      username,
      role: 'member',
    }]);

  if (insertError) {
    return { user: null, error: insertError };
  }

  const { data: profile, error: fetchError } = await supabaseClient
    .from('users')
    .select('id, username, email, role')
    .eq('id', data.user.id)
    .single();

  if (fetchError || !profile) {
    return { user: null, error: fetchError || { message: 'Profil introuvable après inscription.' } };
  }

  return { user: profile, error: null };
}

async function logoutSupabase() {
  const { error } = await supabaseClient.auth.signOut();
  return { error };
}

async function getCurrentUser() {
  const { data: { session }, error } = await supabaseClient.auth.getSession();

  if (error || !session) return { user: null, error };

  const { data: profile, error: profileError } = await supabaseClient
    .from('users')
    .select('id, username, email, role')
    .eq('id', session.user.id)
    .single();

  return { user: profile || null, error: profileError };
}

// ============================================================
// USERS
// ============================================================

async function getUserById(id) {
  if (!id) return { user: null, error: { message: 'ID requis.' } };

  const { data, error } = await supabaseClient
    .from('users')
    .select('id, username, email, role')
    .eq('id', id)
    .single();

  return { user: data, error };
}

async function getUserByEmail(email) {
  if (!email) return { user: null, error: { message: 'Email requis.' } };

  const { data, error } = await supabaseClient
    .from('users')
    .select('id, username, email, role')
    .eq('email', email)
    .single();

  return { user: data, error };
}

async function updateUserProfile(userId, updates) {
  if (!userId) {
    return { user: null, error: { message: 'Utilisateur non identifié.' } };
  }

  const username = typeof updates.username === 'string' ? updates.username.trim() : '';
  const email = typeof updates.email === 'string' ? updates.email.trim().toLowerCase() : '';
  const password = typeof updates.password === 'string' ? updates.password : '';

  if (!username || !email) {
    return { user: null, error: { message: 'Le nom affiché et l\'email sont requis.' } };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { user: null, error: { message: 'Adresse e-mail invalide.' } };
  }

  const { data: existingUsers, error: checkError } = await supabaseClient
    .from('users')
    .select('id, username, email')
    .or(`username.eq.${username},email.eq.${email}`);

  if (checkError) return { user: null, error: checkError };

  const duplicate = (existingUsers || []).find((u) => u.id !== userId);
  if (duplicate) {
    if (duplicate.username?.toLowerCase() === username.toLowerCase()) {
      return { user: null, error: { message: 'Ce nom d\'utilisateur est déjà utilisé.' } };
    }
    if (duplicate.email?.toLowerCase() === email.toLowerCase()) {
      return { user: null, error: { message: 'Cette adresse e-mail est déjà utilisée.' } };
    }
  }

  if (password) {
    if (password.length < 6) {
      return { user: null, error: { message: 'Le mot de passe doit contenir au moins 6 caractères.' } };
    }
    const { error: pwdError } = await supabaseClient.auth.updateUser({ password });
    if (pwdError) return { user: null, error: pwdError };
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session && session.user.email !== email) {
    const { error: emailError } = await supabaseClient.auth.updateUser({ email });
    if (emailError) return { user: null, error: emailError };
  }

  const { data, error } = await supabaseClient
    .from('users')
    .update({ username, email })
    .eq('id', userId)
    .select('id, username, email, role')
    .single();

  return { user: data, error };
}

// ============================================================
// POSTS
// ============================================================

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
// ============================================================
// LIKES / DISLIKES
// ============================================================

async function getLikes(postId) {
  const { data, error } = await supabaseClient
    .from('post_likes')
    .select('id, post_id, user_id, type')
    .eq('post_id', postId);

  return { data, error };
}

async function toggleLike(postId, userId, type) {
  if (!postId || !userId) {
    return { data: null, error: { message: 'Paramètres de vote invalides.' } };
  }
  if (!['like', 'dislike'].includes(type)) {
    return { data: null, error: { message: 'Type de vote invalide.' } };
  }

  const { data: existingVote, error: fetchError } = await supabaseClient
    .from('post_likes')
    .select('id, type')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Cas 1 : pas encore de vote -> insertion
  if (!existingVote) {
    const { data, error } = await supabaseClient
      .from('post_likes')
      .insert([{ post_id: postId, user_id: userId, type }])
      .select('*')
      .single();

    return { data, error };
  }

  // Cas 2 : clic sur le même vote -> suppression (toggle off)
  if (existingVote.type === type) {
    const { error } = await supabaseClient
      .from('post_likes')
      .delete()
      .eq('id', existingVote.id);

    return { data: null, error };
  }

  // Cas 3 : changement de vote (like <-> dislike) -> mise à jour
  const { data, error } = await supabaseClient
    .from('post_likes')
    .update({ type })
    .eq('id', existingVote.id)
    .select('*')
    .single();

  return { data, error };
}


// ============================================================
// COMMENTAIRES
// ============================================================

async function getComments(postId) {
  const { data, error } = await supabaseClient
    .from('comments')
    .select('id, post_id, user_id, content, created_at, users(username)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('getComments error:', error);
    return [];
  }

  return (data || []).map(c => ({
    ...c,
    author: c.users?.username || 'Anonyme',
  }));
}

async function createComment(postId, content) {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    return { data: null, error: { message: 'Le commentaire ne peut pas être vide.' } };
  }

  const { user } = await getCurrentUser();
  if (!user) {
    return { data: null, error: { message: 'Vous devez être connecté pour commenter.' } };
  }

  const { data, error } = await supabaseClient
    .from('comments')
    .insert([{ post_id: postId, user_id: user.id, content: trimmed }])
    .select('id, post_id, user_id, content, created_at')
    .single();

  if (error) return { data: null, error };

  return { data: { ...data, author: user.username }, error: null };
}

async function deleteComment(commentId) {
  const { error } = await supabaseClient
    .from('comments')
    .delete()
    .eq('id', commentId);

  return { error };
}

async function updateComment(commentId, content) {
  const trimmed = (content || '').trim();
  if (!trimmed) {
    return { data: null, error: { message: 'Le commentaire ne peut pas être vide.' } };
  }

  const { data, error } = await supabaseClient
    .from('comments')
    .update({ content: trimmed })
    .eq('id', commentId)
    .select('id, post_id, user_id, content, created_at')
    .single();

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


async function getPostById(id) {
  const { data, error } = await supabaseClient
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

async function updatePost(postId, updates) {
  const payload = {
    title: (updates.title || '').trim(),
    content: (updates.content || '').trim(),
    category: (updates.category || '').trim(),
    image_url: updates.image_url || null,
  };

  const { data, error } = await supabaseClient
    .from('posts')
    .update(payload)
    .eq('id', postId)
    .select('*')
    .single();

  return error ? null : data;
}

// Rendre ces helpers accessibles globalement au script client
window.getUserById = getUserById;
window.getUserByEmail = getUserByEmail;
window.updateUserProfile = updateUserProfile;
window.createPost = createPost;
window.getPosts = getPosts;
window.supabaseClient = supabaseClient;
window.getPostById = getPostById;
window.updatePost = updatePost;
window.logoutSupabase = logoutSupabase;
window.getCurrentUser = getCurrentUser;
window.getLikes = getLikes;
window.toggleLike = toggleLike;
window.db = {
  getComments,
  createComment,
  deleteComment,
  updateComment,
};