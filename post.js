document.addEventListener("DOMContentLoaded", async () => {
  // --- Récupération de l'ID du post ---
  const postId = parseInt(new URLSearchParams(window.location.search).get("id"), 10);
  if (!postId) {
    alert("Post introuvable.");
    window.location.href = "posts.html";
    return;
  }

  // --- Sélecteurs pour le post ---
  const titleEl = document.getElementById("post-title");
  const metaEl = document.getElementById("post-meta");
  const imgEl = document.getElementById("post-image");
  const contentEl = document.getElementById("post-content");
  const likesCountEl = document.getElementById("likes-count");
  const likeBtn = document.getElementById("like-btn");

  // --- Sélecteurs pour l'édition ---
  const editControls = document.getElementById("edit-controls");
  const editBtn = document.getElementById("edit-btn");
  const deleteBtn = document.getElementById("delete-btn");
  const editForm = document.getElementById("edit-form");
  const editTitle = document.getElementById("edit-title");
  const editContent = document.getElementById("edit-content");
  const editCategory = document.getElementById("edit-category");
  const editImage = document.getElementById("edit-image");
  const saveEdit = document.getElementById("save-edit");
  const cancelEdit = document.getElementById("cancel-edit");

  // --- Vérification des éléments obligatoires ---
  if (
    !titleEl || !metaEl || !contentEl || !likesCountEl || !likeBtn ||
    !editControls || !editBtn || !deleteBtn || !editForm ||
    !editTitle || !editContent || !editCategory || !saveEdit || !cancelEdit
  ) {
    console.error("Un ou plusieurs éléments du DOM sont manquants pour le post.");
    return;
  }

  let post = null;
  let userRow = null;

  // --- Chargement de l'utilisateur connecté ---
  async function loadUser() {
    const { data } = await window.supabaseClient.auth.getUser();
    if (!data.user) return null;

    const { data: row } = await window.supabaseClient
      .from("users")
      .select("*")
      .eq("auth_id", data.user.id)
      .single();

    return row;
  }

  // --- Chargement du post ---
  async function loadPost() {
    if (!window.db || !window.db.getPostById) {
      alert("Impossible de charger le post.");
      window.location.href = "posts.html";
      return;
    }

    try {
      post = await window.db.getPostById(postId);
      if (!post) {
        alert("Post introuvable.");
        window.location.href = "posts.html";
        return;
      }

      // Mise à jour du DOM
      titleEl.textContent = post.title || "";
      contentEl.textContent = post.content || "";
      metaEl.textContent = `${post.author || "Utilisateur"} • ${post.category || ""} • ${new Date(post.created_at || post.date).toLocaleString("fr-FR")}`;

      if (post.image_url) {
        imgEl.src = post.image_url;
        imgEl.style.display = "block";
      } else {
        imgEl.style.display = "none";
      }

      // Chargement des likes
      if (window.db.getLikesCount) {
        const likes = await window.db.getLikesCount(postId);
        likesCountEl.textContent = `${likes || 0} likes`;
      }

      // Affichage des contrôles d'édition si l'utilisateur est l'auteur
      if (userRow && userRow.id === post.user_id) {
        editControls.style.display = "block";
      } else {
        editControls.style.display = "none";
      }

      // Mise à jour du bouton Like
      if (window.db.hasLiked) {
        const hasLiked = await window.db.hasLiked(postId);
        likeBtn.textContent = hasLiked ? "💔 Unlike" : "❤️ Like";
      }
    } catch (error) {
      console.error("Erreur lors du chargement du post :", error);
      alert("Impossible de charger le post.");
    }
  }

  // --- Gestion du bouton Like ---
  if (likeBtn) {
    likeBtn.addEventListener("click", async () => {
      if (!window.db || !window.db.toggleLike) {
        alert("Impossible de gérer les likes.");
        return;
      }

      try {
        const result = await window.db.toggleLike(postId);
        likesCountEl.textContent = `${result.total || 0} likes`;
        likeBtn.textContent = result.liked ? "💔 Unlike" : "❤️ Like";
      } catch (error) {
        console.error("Erreur lors du like :", error);
        alert("Impossible de mettre à jour le like.");
      }
    });
  }

  // --- Gestion de l'édition ---
  if (editBtn && editForm) {
    editBtn.addEventListener("click", () => {
      if (!post) return;
      editTitle.value = post.title || "";
      editContent.value = post.content || "";
      editCategory.value = post.category || "";
      editForm.style.display = "block";
    });
  }

  if (cancelEdit && editForm) {
    cancelEdit.addEventListener("click", () => {
      editForm.style.display = "none";
    });
  }

  if (saveEdit && editForm) {
    saveEdit.addEventListener("click", async () => {
      if (!post || !window.db || !window.db.updatePost) return;

      try {
        let imageUrl = post.image_url;
        if (editImage && editImage.files[0]) {
          imageUrl = await window.db.uploadPostImage(editImage.files[0]);
        }

        const updatedPost = await window.db.updatePost(postId, {
          title: editTitle.value,
          content: editContent.value,
          category: editCategory.value,
          image_url: imageUrl,
        });

        if (updatedPost) {
          post = updatedPost;
          editForm.style.display = "none";
          await loadPost();
          alert("Post mis à jour avec succès !");
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour du post :", error);
        alert("Impossible de mettre à jour le post.");
      }
    });
  }

  // --- Gestion de la suppression ---
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Supprimer ce post ? Cette action est irréversible.")) return;
      if (!window.db || !window.db.deletePost) return;

      try {
        await window.db.deletePost(postId);
        alert("Post supprimé avec succès.");
        window.location.href = "posts.html";
      } catch (error) {
        console.error("Erreur lors de la suppression du post :", error);
        alert("Impossible de supprimer le post.");
      }
    });
  }

  // --- Initialisation ---
  userRow = await loadUser();
  await loadPost();
});