(async function () {
    const msgEl = document.getElementById('msg');

    // Clear local app session
    try {
      localStorage.removeItem('cookimeUser');
    } catch (e) {
      // ignore
    }

    // Try sign out via Supabase client if available
    try {
      if (window.supabaseClient && typeof window.supabaseClient.auth?.signOut === 'function') {
        await window.supabaseClient.auth.signOut();
        msgEl.textContent = 'Déconnecté depuis Supabase. Redirection...';
      } else if (window.supabase && typeof window.supabase.auth?.signOut === 'function') {
        await window.supabase.auth.signOut();
        msgEl.textContent = 'Déconnecté depuis Supabase. Redirection...';
      }
    } catch (err) {
      // Log but continue with client-side logout
      console.warn('Supabase signOut failed:', err);
      msgEl.textContent = 'Déconnexion locale effectuée. Redirection...';
    }

    // Ensure redirect to login.html
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 800);
  })();