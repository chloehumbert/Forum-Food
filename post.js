document.addEventListener("DOMContentLoaded", async () => {

  // --- Récupération de l'ID du post ---
  const postId = parseInt(new URLSearchParams(window.location.search).get("id"));
  if (!postId) {
    alert("Post introuvable.");
    window.location.href = "posts.html";
    return;
  }

  // --- Sélecteurs ---
  const titleEl = document.getElementById("post-title");
  const metaEl = document.getElementById("post-meta");
  const imgEl = document.getElementById("post-image");
  const contentEl = document.getElementById("post-content");

  const likeBtn = document.getElementById("like-btn");
  const likesCountEl = document.getElementById("likes-count");

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

  const commentsList = document.getElementById("comments-list");
  const commentForm = document.getElementById("comment-form");
  const commentText = document.getElementById("comment-text");

  let post = null;
  let userRow = null;

  // --- Récupération de l'utilisateur connecté ---
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

  userRow = await loadUser();

  // --- Charger le post ---
  async function loadPost() {
    post = await window.db.getPostById(postId);

    titleEl.textContent = post.title;
    contentEl.textContent = post.content;

    metaEl.textContent =
      `${post.author} • ${post.category} • ${new Date(post.created_at).toLocaleString()}`;

    if (post.image_url) {
      imgEl.src = post.image_url;
      imgEl.style.display = "block";
    }

    const likes = await window.db.getLikesCount(postId);
    likesCountEl.textContent = `${likes} likes`;

    if (userRow && userRow.id === post.user_id) {
      editControls.style.display = "block";
    }
  }

  // --- Charger les commentaires ---
  async function loadComments() {
    const comments = await window.db.getComments(postId);
    commentsList.innerHTML = "";

    comments.forEach(c => {
      const div = document.createElement("div");
      div.classList.add("forum-post");

      div.innerHTML = `
        <div class="post-body">
          <strong>${c.author}</strong>
          <div class="post-date">${new Date(c.date).toLocaleString()}</div>
          <p>${c.content}</p>
        </div>
      `;

      commentsList.appendChild(div);
    });
  }

  // --- Like ---
  likeBtn.addEventListener("click", async () => {
    const result = await window.db.toggleLike(postId);
    likesCountEl.textContent = `${result.total} likes`;
    likeBtn.textContent = result.liked ? "💔 Unlike" : "❤️ Like";
  });

  // --- Commentaire ---
  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    await window.db.createComment(postId, commentText.value);
    commentText.value = "";
    loadComments();
  });

  // --- Modifier ---
  editBtn.addEventListener("click", () => {
    editForm.style.display = "block";

    editTitle.value = post.title;
    editContent.value = post.content;
    editCategory.value = post.category;
  });

  cancelEdit.addEventListener("click", () => {
    editForm.style.display = "none";
  });

  saveEdit.addEventListener("click", async () => {
    let imageUrl = post.image_url;

    if (editImage.files[0]) {
      imageUrl = await window.db.uploadPostImage(editImage.files[0]);
    }

    post = await window.db.updatePost(postId, {
      title: editTitle.value,
      content: editContent.value,
      category: editCategory.value,
      imageUrl
    });

    editForm.style.display = "none";
    loadPost();
  });

  // --- Supprimer ---
  deleteBtn.addEventListener("click", async () => {
    if (!confirm("Supprimer ce post ?")) return;

    await window.db.deletePost(postId);
    window.location.href = "posts.html";
  });

  // --- Initialisation ---
  await loadPost();
  await loadComments();
});
