document.addEventListener('DOMContentLoaded', function () {
  // --- Posts preview (only if posts form exists) ---
  const postForm = document.getElementById('post-form');
  if (postForm) {
    const feed = document.getElementById('posts-feed');
    const emptyMessage = document.querySelector('.empty-feed');

    function formatTime(date) {
      return date.toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }

    function createPostCard(author, message) {
      const card = document.createElement('div');
      card.className = 'post-card';

      const header = document.createElement('div');
      header.className = 'post-card-header';
      header.innerHTML = `
        <div class="avatar">${author.charAt(0).toUpperCase()}</div>
        <div>
          <div class="post-card-title">${author}</div>
          <div class="post-card-meta">Publié le ${formatTime(new Date())}</div>
        </div>
      `;

      const body = document.createElement('div');
      body.className = 'post-card-body';
      body.textContent = message;

      card.appendChild(header);
      card.appendChild(body);
      return card;
    }

    postForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const author = postForm.author ? postForm.author.value.trim() : '';
      const message = postForm.message ? postForm.message.value.trim() : '';
      if (!author || !message) return;

      const postCard = createPostCard(author, message);
      if (emptyMessage) { emptyMessage.remove(); }
      feed.prepend(postCard);
      postForm.reset();
      if (postForm.author) postForm.author.focus();
    });
  }

  // --- Login page helpers ---
  const togglePwd = document.getElementById('togglePwd');
  if (togglePwd) {
    togglePwd.addEventListener('click', function () {
      const input = document.getElementById('password');
      input.type = input.type === 'password' ? 'text' : 'password';
      this.textContent = input.type === 'password' ? '👁' : '🙈';
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      let valid = true;
      const email = document.getElementById('email');
      const pwd = document.getElementById('password');
      const emailErr = document.getElementById('emailError');
      const pwdErr = document.getElementById('pwdError');
      const alertError = document.getElementById('alertError');
      const alertSuccess = document.getElementById('alertSuccess');

      if (emailErr) emailErr.textContent = '';
      if (pwdErr) pwdErr.textContent = '';
      if (alertError) alertError.style.display = 'none';
      if (alertSuccess) alertSuccess.style.display = 'none';

      if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        if (emailErr) emailErr.textContent = 'Adresse e-mail invalide.';
        if (email.closest) email.closest('.field-wrap')?.classList.add('has-error');
        valid = false;
      } else {
        if (email.closest) email.closest('.field-wrap')?.classList.remove('has-error');
      }

      if (!pwd.value || pwd.value.length < 6) {
        if (pwdErr) pwdErr.textContent = 'Le mot de passe doit comporter au moins 6 caractères.';
        if (pwd.closest) pwd.closest('.field-wrap')?.classList.add('has-error');
        valid = false;
      } else {
        if (pwd.closest) pwd.closest('.field-wrap')?.classList.remove('has-error');
      }

      if (!valid) { return; }

      if (!window.supabase || !window.supabase.createClient) {
        if (alertError) {
          alertError.style.display = 'flex';
          document.getElementById('alertMsg').textContent = 'Supabase non configuré.';
        }
        return;
      }

      const spinner = document.getElementById('loginSpinner');
      if (spinner) spinner.style.display = 'inline-block';
      const txt = document.querySelector('.btn-login-text');
      const jp = document.querySelector('.btn-login-jp');
      if (txt) txt.style.opacity = '0';
      if (jp) jp.style.opacity = '0';
      document.getElementById('btnLogin').disabled = true;

      const { user, error } = await loginSupabase(email.value.trim(), pwd.value);
      if (error || !user) {
        if (alertError) {
          alertError.style.display = 'flex';
          document.getElementById('alertMsg').textContent = 'Email ou mot de passe incorrect.';
        }
        if (spinner) spinner.style.display = 'none';
        if (txt) txt.style.opacity = '1';
        if (jp) jp.style.opacity = '1';
        document.getElementById('btnLogin').disabled = false;
        return;
      }

      localStorage.setItem('cookimeUser', JSON.stringify(user));
      if (alertSuccess) alertSuccess.style.display = 'flex';
      setTimeout(() => window.location.href = 'posts.html', 800);
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    // Helpers to centralize alert visibility
    function hideAlerts() {
      const err = document.getElementById('alertError');
      const suc = document.getElementById('alertSuccess');
      if (err) { err.style.display = 'none'; }
      if (suc) { suc.style.display = 'none'; }
    }
    function showError(msg) {
      hideAlerts();
      const err = document.getElementById('alertError');
      const alertMsg = document.getElementById('alertMsg');
      if (err) { err.style.display = 'flex'; }
      if (alertMsg) { alertMsg.textContent = msg; }
    }
    function showSuccess(msg) {
      hideAlerts();
      const suc = document.getElementById('alertSuccess');
      const successMsg = document.getElementById('successMsg');
      if (suc) { suc.style.display = 'flex'; }
      if (successMsg) { successMsg.textContent = msg; }
    }

    // Ensure alerts hidden initially
    hideAlerts();

    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      let valid = true;
      const email = document.getElementById('email');
      const pwd = document.getElementById('password');
      const confirmPwd = document.getElementById('confirmPassword');
      const emailErr = document.getElementById('emailError');
      const pwdErr = document.getElementById('pwdError');
      const confirmErr = document.getElementById('confirmError');

      if (emailErr) emailErr.textContent = '';
      if (pwdErr) pwdErr.textContent = '';
      if (confirmErr) confirmErr.textContent = '';
      hideAlerts();

      if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        if (emailErr) emailErr.textContent = 'Adresse e-mail invalide.';
        valid = false;
      }
      if (!pwd.value || pwd.value.length < 6) {
        if (pwdErr) pwdErr.textContent = 'Le mot de passe doit comporter au moins 6 caractères.';
        valid = false;
      }
      if (pwd.value !== confirmPwd.value) {
        if (confirmErr) confirmErr.textContent = 'Les mots de passe ne correspondent pas.';
        valid = false;
      }

      if (!valid) { return; }

      if (!window.supabase || !window.supabase.createClient) {
        showError('Supabase non configuré.');
        return;
      }

      const spinner = document.getElementById('registerSpinner');
      if (spinner) spinner.hidden = false;
      const btnText = document.querySelector('.btn-login-text');
      if (btnText) btnText.style.opacity = '0';

      const { user, error } = await registerSupabase(email.value.trim(), pwd.value);
      if (error || !user) {
        showError(error?.message || 'Erreur lors de l’inscription.');
        if (spinner) spinner.hidden = true;
        if (btnText) btnText.style.opacity = '1';
        return;
      }

      showSuccess('Compte créé avec succès, la BDD répond correctement.');
      if (spinner) spinner.hidden = true;
      if (btnText) btnText.style.opacity = '1';
    });
  }

  // Show server-side flags
  const params = new URLSearchParams(window.location.search);
  if (params.get('error') === '1') {
    const alertError = document.getElementById('alertError');
    const alertMsg = document.getElementById('alertMsg');
    if (alertError) { alertError.style.display = 'flex'; }
    if (alertMsg) { alertMsg.textContent = 'Email ou mot de passe incorrect.'; }
  }
  if (params.get('success') === '1') {
    const alertSuccess = document.getElementById('alertSuccess');
    if (alertSuccess) alertSuccess.style.display = 'flex';
  }

  // --- Account page: récupérer et afficher les informations utilisateur ---
  const accountCard = document.querySelector('.account-card');
  if (accountCard) {
    (async () => {
      const nameEl = document.querySelector('.account-meta .name');
      const emailEl = document.querySelector('.account-meta .email');
      const inputName = document.getElementById('display_name');
      const inputEmail = document.getElementById('email');

      let stored = localStorage.getItem('cookimeUser');
      if (!stored) {
        if (nameEl) nameEl.textContent = 'Visiteur';
        return;
      }

      let userObj;
      try { userObj = JSON.parse(stored); } catch (e) { userObj = null; }
      if (!userObj) return;

      let result;
      if (userObj.id && window.getUserById) {
        result = await window.getUserById(userObj.id);
      } else if (userObj.email && window.getUserByEmail) {
        result = await window.getUserByEmail(userObj.email);
      }

      const user = result?.user || userObj;
      if (user) {
        if (nameEl) nameEl.textContent = user.username || 'Utilisateur';
        if (emailEl) emailEl.textContent = user.email || '';
        if (inputName) inputName.value = user.username || '';
        if (inputEmail) inputEmail.value = user.email || '';
      }
    })();
  }
});
