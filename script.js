document.addEventListener('DOMContentLoaded', function () {
  // --- Posts page: create and load posts in Supabase ---
  const postForm = document.getElementById('post-form');
  if (postForm) {
    const STORAGE_BUCKET = 'cookime-image-posts';
    const feed = document.getElementById('posts-feed');
    const emptyMessage = document.querySelector('.empty-feed');
    const statusBox = document.getElementById('postStatus');

    function showStatus(message, type) {
      if (!statusBox) return;
      statusBox.textContent = message;
      statusBox.className = type === 'success' ? 'login-alert login-alert--success' : 'login-alert login-alert--error';
      statusBox.style.display = 'block';
    }

    function formatTime(date) {
      const value = date ? new Date(date) : new Date();
      return value.toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    }

    function createPostCard(post) {
      const card = document.createElement('article');
      card.className = 'post-card';

      const header = document.createElement('div');
      header.className = 'post-card-header';
      header.innerHTML = `
        <div class="avatar">${(post.author || 'U').charAt(0).toUpperCase()}</div>
        <div>
          <div class="post-card-title">${post.title || 'Post'}</div>
          <div class="post-card-meta">Par ${post.author || 'Utilisateur'} • ${post.category || ''} • ${formatTime(post.created_at || post.date)}</div>
        </div>
      `;

      const body = document.createElement('div');
      body.className = 'post-card-body';
      body.textContent = post.content || '';

      card.appendChild(header);
      card.appendChild(body);

      if (post.image_url) {
        const image = document.createElement('img');
        image.src = post.image_url;
        image.alt = post.title || 'Image du post';
        image.style.maxWidth = '30%';
        image.style.borderRadius = '25px';
        image.style.marginTop = '12px';
        card.appendChild(image);
      }

      return card;
    }

    function renderPosts(posts) {
      if (!feed) return;

      feed.innerHTML = '';
      if (!posts || posts.length === 0) {
        feed.innerHTML = '<div class="empty-feed">Aucune publication pour le moment. Écrivez un message pour le voir apparaître ici.</div>';
        return;
      }

      posts.forEach((post) => feed.appendChild(createPostCard(post)));
    }

    async function loadPosts() {
      if (!window.getPosts) return;
      const { data, error } = await window.getPosts();
      if (error) {
        if (statusBox) {
          showStatus('Impossible de charger les publications.', 'error');
        }
        return;
      }
      renderPosts(data || []);
    }

    loadPosts();

    postForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const stored = localStorage.getItem('cookimeUser');
      let userObj = null;
      try { userObj = stored ? JSON.parse(stored) : null; } catch (e) { userObj = null; }

      if (!userObj || !userObj.id) {
        showStatus('Connectez-vous pour publier un post.', 'error');
        return;
      }

      const titleInput = document.getElementById('title');
      const categoryInput = document.getElementById('category');
      const contentInput = document.getElementById('content');
      const imageInput = document.getElementById('image');

      const title = titleInput ? titleInput.value.trim() : '';
      const content = contentInput ? contentInput.value.trim() : '';
      const category = categoryInput ? categoryInput.value : '';

      if (!title || !content || !category) {
        showStatus('Le titre, le contenu et la catégorie sont obligatoires.', 'error');
        return;
      }

      const submitButton = postForm.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;

      try {
        let imageUrl = null;

        if (imageInput && imageInput.files && imageInput.files.length > 0) {
          const file = imageInput.files[0];
          const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
          const storagePath = `posts/${userObj.id}/${fileName}`;

          const storageClient = window.supabaseClient;
          if (!storageClient || !storageClient.storage) {
            showStatus('Le stockage Supabase n’est pas disponible.', 'error');
            if (submitButton) submitButton.disabled = false;
            return;
          }

          const { data: uploadData, error: uploadError } = await storageClient.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, file, { cacheControl: '3600', upsert: false });

          if (uploadError) {
            const detail = uploadError.message || 'Erreur inconnue';
            showStatus('Impossible de téléverser l’image : ' + detail + ' (bucket: ' + STORAGE_BUCKET + ')', 'error');
            if (submitButton) submitButton.disabled = false;
            return;
          }

          const { data: publicUrlData } = storageClient.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(uploadData.path);

          imageUrl = publicUrlData?.publicUrl || null;
        }

        const { data, error } = await window.createPost({
          user_id: userObj.id,
          title,
          content,
          date: new Date().toISOString().slice(0, 10),
          author: userObj.username || userObj.email || 'Utilisateur',
          category,
          created_at: new Date().toISOString(),
          image_url: imageUrl,
        });

        if (error) {
          showStatus(error.message || 'Erreur lors de la publication.', 'error');
          if (submitButton) submitButton.disabled = false;
          return;
        }

        showStatus('Post publié avec succès.', 'success');
        postForm.reset();
        await loadPosts();
        if (submitButton) submitButton.disabled = false;
      } catch (err) {
        showStatus('Une erreur est survenue pendant la publication.', 'error');
        if (submitButton) submitButton.disabled = false;
      }
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
      const loginLink = document.getElementById('loginLink');
      const logoutLink = document.getElementById('logoutLink');
      const accountForm = document.getElementById('accountForm');
      const accountStatus = document.getElementById('accountStatus');

      let currentUser = null;

      let stored = localStorage.getItem('cookimeUser');
      if (loginLink) {
        loginLink.hidden = Boolean(stored);
      }
      if (logoutLink) {
        logoutLink.hidden = !stored;
      }

      if (!stored) {
        if (nameEl) nameEl.textContent = 'Visiteur';
        if (emailEl) emailEl.textContent = 'Connectez-vous pour gérer votre compte.';
        if (accountStatus) {
          accountStatus.textContent = 'Vous devez être connecté pour modifier votre profil.';
          accountStatus.style.display = 'block';
          accountStatus.className = 'login-alert login-alert--error';
        }
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

      currentUser = result?.user || userObj;
      const myPostsContainer = document.getElementById("my-posts");

        async function loadMyPosts() {

          const { data, error } = await window.getPostsByUser(currentUser.id);

          if (error) return;

          myPostsContainer.innerHTML = "";

          if (data.length === 0) {
            myPostsContainer.innerHTML = "<p>Aucun post.</p>";
            return;
          }

          data.forEach(post => {

            const div = document.createElement("div");

            div.className = "post-card";

            div.innerHTML = `
              <h4>${post.title}</h4>
              <p>${post.content}</p>
              <button class="delete-post" data-id="${post.id}">
                Supprimer
              </button>
            `;

            myPostsContainer.appendChild(div);

          });

          document.querySelectorAll(".delete-post").forEach(btn => {

            btn.addEventListener("click", async () => {

              const error = await window.deletePost(btn.dataset.id);

              if (!error) {
                loadMyPosts();
              }

            });

          });

        }
      if (currentUser) {
        loadMyPosts();
        if (nameEl) nameEl.textContent = currentUser.username || 'Utilisateur';
        if (emailEl) emailEl.textContent = currentUser.email || '';
        if (inputName) inputName.value = currentUser.username || '';
        if (inputEmail) inputEmail.value = currentUser.email || '';
      }

      if (accountForm) {
        accountForm.addEventListener('submit', async function (event) {
          event.preventDefault();

          if (!currentUser?.id) {
            if (accountStatus) {
              accountStatus.textContent = 'Vous devez être connecté pour modifier votre profil.';
              accountStatus.className = 'login-alert login-alert--error';
              accountStatus.style.display = 'block';
            }
            return;
          }

          const username = document.getElementById('display_name').value.trim();
          const email = document.getElementById('email').value.trim().toLowerCase();
          const password = document.getElementById('newPassword').value;
          const confirmPassword = document.getElementById('confirmPassword').value;

          if (!username || !email) {
            if (accountStatus) {
              accountStatus.textContent = 'Le nom affiché et l’e-mail sont obligatoires.';
              accountStatus.className = 'login-alert login-alert--error';
              accountStatus.style.display = 'block';
            }
            return;
          }

          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (accountStatus) {
              accountStatus.textContent = 'Veuillez saisir une adresse e-mail valide.';
              accountStatus.className = 'login-alert login-alert--error';
              accountStatus.style.display = 'block';
            }
            return;
          }

          if (password && password.length < 6) {
            if (accountStatus) {
              accountStatus.textContent = 'Le mot de passe doit contenir au moins 6 caractères.';
              accountStatus.className = 'login-alert login-alert--error';
              accountStatus.style.display = 'block';
            }
            return;
          }

          if (password && password !== confirmPassword) {
            if (accountStatus) {
              accountStatus.textContent = 'Les mots de passe ne correspondent pas.';
              accountStatus.className = 'login-alert login-alert--error';
              accountStatus.style.display = 'block';
            }
            return;
          }

          const submitButton = accountForm.querySelector('button[type="submit"]');
          if (submitButton) submitButton.disabled = true;

          const { user: updatedUser, error } = await window.updateUserProfile(currentUser.id, {
            username,
            email,
            password: password || undefined,
          });

          if (submitButton) submitButton.disabled = false;

          if (error) {
            if (accountStatus) {
              accountStatus.textContent = error.message || 'Erreur lors de la mise à jour.';
              accountStatus.className = 'login-alert login-alert--error';
              accountStatus.style.display = 'block';
            }
            return;
          }

          if (updatedUser) {
            currentUser = updatedUser;
            localStorage.setItem('cookimeUser', JSON.stringify(updatedUser));
            if (nameEl) nameEl.textContent = updatedUser.username || 'Utilisateur';
            if (emailEl) emailEl.textContent = updatedUser.email || '';
            if (accountStatus) {
              accountStatus.textContent = 'Profil mis à jour avec succès.';
              accountStatus.className = 'login-alert login-alert--success';
              accountStatus.style.display = 'block';
            }
            accountForm.reset();
            if (inputName) inputName.value = updatedUser.username || '';
            if (inputEmail) inputEmail.value = updatedUser.email || '';
          }
        });
      }
    })();
  }
});
