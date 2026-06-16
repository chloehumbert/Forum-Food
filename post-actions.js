document.addEventListener('DOMContentLoaded', () => {
  const feed = document.getElementById('posts-feed');
  if (!feed) return;

  async function refreshPosts() {
    if (!window.getPosts) return;
    const { data, error } = await window.getPosts();
    if (error) return;
    renderPostsWithActions(data || []);
  }

  function formatTime(date) {
    const value = date ? new Date(date) : new Date();
    return value.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function createPostCard(post) {
    const card = document.createElement('article');
    card.className = 'post-card';

    card.innerHTML = `
      <div class="post-card-header">
        <div class="avatar">${(post.author || 'U').charAt(0).toUpperCase()}</div>
        <div>
          <div class="post-card-title">${post.title || 'Post'}</div>
          <div class="post-card-meta">Par ${post.author || 'Utilisateur'} • ${post.category || ''} • ${formatTime(post.created_at || post.date)}</div>
        </div>
      </div>

      <div class="post-card-body">
        <p class="post-content-text">${post.content || ''}</p>
      </div>

      ${post.image_url ? `<img src="${post.image_url}" alt="${post.title || 'Image du post'}" class="post-image">` : ''}

      <div class="post-actions">
        <button class="edit-post-btn" data-id="${post.id}">Modifier</button>
        <button class="delete-post-btn" data-id="${post.id}">Supprimer</button>
      </div>
    `;

    return card;
  }

  function renderPostsWithActions(posts) {
    feed.innerHTML = '';
    if (!posts.length) {
      feed.innerHTML = '<div class="empty-feed">Aucune publication pour le moment.</div>';
      return;
    }
    posts.forEach((post) => feed.appendChild(createPostCard(post)));
  }

  feed.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.edit-post-btn');
    const deleteBtn = e.target.closest('.delete-post-btn');

    if (deleteBtn) {
      const postId = deleteBtn.dataset.id;
      if (!confirm('Supprimer ce post ?')) return;

      const error = await window.deletePost(postId);
      if (!error) await refreshPosts();
      else alert('Impossible de supprimer le post.');
    }

    if (editBtn) {
      const postId = editBtn.dataset.id;
      const { data } = await window.getPosts();
      const post = (data || []).find((p) => String(p.id) === String(postId));
      if (!post) return;

      openEditModal(post, async (updatedFields) => {
        const updatedPost = await window.updatePost(postId, updatedFields);
        if (updatedPost) await refreshPosts();
      });
    }
  });

  function openEditModal(post, onSave) {
    const overlay = document.createElement('div');
    overlay.className = 'edit-overlay';
    overlay.innerHTML = `
      <div class="edit-modal">
        <h3>Modifier le post</h3>
        <input id="edit-title" type="text" value="${post.title || ''}" placeholder="Titre">
        <select id="edit-category">
          <option value="">Choisir une catégorie</option>
          <option value="entrée">Entrée</option>
          <option value="plat">Plat</option>
          <option value="dessert">Dessert</option>
        </select>
        <textarea id="edit-content" rows="6" placeholder="Contenu">${post.content || ''}</textarea>
        <input id="edit-image-url" type="text" value="${post.image_url || ''}" placeholder="URL image">
        <div class="edit-modal-actions">
          <button id="cancel-edit">Annuler</button>
          <button id="save-edit">Enregistrer</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector('#edit-category').value = post.category || '';

    overlay.querySelector('#cancel-edit').addEventListener('click', () => {
      overlay.remove();
    });

    overlay.querySelector('#save-edit').addEventListener('click', async () => {
      const title = overlay.querySelector('#edit-title').value.trim();
      const category = overlay.querySelector('#edit-category').value;
      const content = overlay.querySelector('#edit-content').value.trim();
      const image_url = overlay.querySelector('#edit-image-url').value.trim();

      if (!title || !category || !content) {
        alert('Titre, catégorie et contenu sont obligatoires.');
        return;
      }

      await onSave({ title, category, content, image_url: image_url || null });
      overlay.remove();
    });
  }

  refreshPosts();
});