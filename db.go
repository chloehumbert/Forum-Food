package main
 
import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)
 
// ═══════════════════════════════════════════════════════
//  CONFIGURATION SUPABASE
//  → Remplissez les 3 variables ci-dessous ou définissez-
//    les comme variables d'environnement.
// ═══════════════════════════════════════════════════════
 
var (
	// Votre URL de projet Supabase
	// Ex : https://xyzabc.supabase.co
	supabaseURL = getEnv("SUPABASE_URL", "https://VOTRE_PROJET.supabase.co")
 
	// Votre clé publique Supabase (anon key)
	// Disponible dans : Project Settings → API → anon public
	supabaseAnonKey = getEnv("SUPABASE_ANON_KEY", "VOTRE_ANON_KEY")
 
	// Clé secrète pour signer les sessions (changez-la !)
	sessionSecret = getEnv("SESSION_SECRET", "change-moi-en-production")
)
 
// ═══════════════════════════════════════════════════════
//  STRUCTURES
// ═══════════════════════════════════════════════════════
 
// Requête envoyée à l'API Supabase Auth
type supabaseLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
 
// Réponse de l'API Supabase Auth (champs principaux)
type supabaseAuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	User         struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	} `json:"user"`
	// En cas d'erreur Supabase retourne ces champs
	ErrorCode    string `json:"error_code"`
	ErrorMessage string `json:"message"`
}
 
// ═══════════════════════════════════════════════════════
//  MAIN — serveur HTTP
// ═══════════════════════════════════════════════════════
 
func main() {
	mux := http.NewServeMux()
 
	// Servir les fichiers statiques (HTML, CSS, JS)
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))))
 
	// Routes
	mux.HandleFunc("/", handleIndex)
	mux.HandleFunc("/login", handleLogin)
	mux.HandleFunc("/logout", handleLogout)
	mux.HandleFunc("/dashboard", authMiddleware(handleDashboard))
 
	port := getEnv("PORT", "8080")
	log.Printf("🌸 Serveur démarré sur http://localhost:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
 
// ═══════════════════════════════════════════════════════
//  HANDLERS
// ═══════════════════════════════════════════════════════
 
// GET / → redirige vers login ou dashboard selon la session
func handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	if isAuthenticated(r) {
		http.Redirect(w, r, "/dashboard", http.StatusSeeOther)
		return
	}
	http.Redirect(w, r, "/login", http.StatusSeeOther)
}
 
// GET  /login → affiche le formulaire
// POST /login → traite la connexion via Supabase
func handleLogin(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
 
	case http.MethodGet:
		// Sert simplement le fichier login.html
		http.ServeFile(w, r, "./login.html")
 
	case http.MethodPost:
		if err := r.ParseForm(); err != nil {
			http.Redirect(w, r, "/login?error=1", http.StatusSeeOther)
			return
		}
 
		email    := strings.TrimSpace(r.FormValue("email"))
		password := r.FormValue("password")
 
		if email == "" || password == "" {
			http.Redirect(w, r, "/login?error=1", http.StatusSeeOther)
			return
		}
 
		// ── Appel à l'API Supabase Auth ──────────────────────
		authResp, err := supabaseSignIn(email, password)
		if err != nil || authResp.AccessToken == "" {
			log.Printf("Échec connexion pour %s : %v | %s", email, err, authResp.ErrorMessage)
			http.Redirect(w, r, "/login?error=1", http.StatusSeeOther)
			return
		}
 
		// ── Stocker le JWT dans un cookie HttpOnly sécurisé ──
		setSessionCookie(w, authResp.AccessToken, authResp.ExpiresIn)
 
		log.Printf("✓ Connexion réussie : %s (id=%s)", authResp.User.Email, authResp.User.ID)
		http.Redirect(w, r, "/dashboard", http.StatusSeeOther)
 
	default:
		http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
	}
}
 
// GET /logout → supprime la session
func handleLogout(w http.ResponseWriter, r *http.Request) {
	clearSessionCookie(w)
	http.Redirect(w, r, "/login", http.StatusSeeOther)
}
 
// GET /dashboard → page protégée (exemple)
func handleDashboard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	tpl := template.Must(template.New("dash").Parse(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Cookime — Dashboard</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <header>
    <div class="header-inner">
      <div class="site-logo">
        <span class="jp-title">Cookime</span>
        <span class="fr-subtitle">Tableau de bord membre</span>
      </div>
    </div>
  </header>
  <div style="max-width:600px;margin:60px auto;padding:0 24px;text-align:center">
    <h1 style="font-family:'Shippori Mincho',serif;font-size:2rem;color:#4A2E1A;margin-bottom:16px">
      ようこそ！ Bienvenue 🌸
    </h1>
    <p style="color:#8B5E3C;font-size:1rem;margin-bottom:32px">
      Vous êtes bien connecté à Cookime.
    </p>
    <a href="/logout" style="background:#D94F3D;color:white;padding:12px 28px;border-radius:8px;font-weight:700;font-size:.9rem;">
      Se déconnecter
    </a>
  </div>
</body>
</html>
`))
	tpl.Execute(w, nil)
}
 
// ═══════════════════════════════════════════════════════
//  SUPABASE — appel Auth REST
// ═══════════════════════════════════════════════════════
 
// supabaseSignIn appelle l'endpoint Supabase Auth /token?grant_type=password
// et retourne le JWT ou une erreur.
func supabaseSignIn(email, password string) (supabaseAuthResponse, error) {
	var result supabaseAuthResponse
 
	// Endpoint REST Auth de Supabase
	url := fmt.Sprintf("%s/auth/v1/token?grant_type=password", supabaseURL)
 
	payload, err := json.Marshal(supabaseLoginRequest{Email: email, Password: password})
	if err != nil {
		return result, err
	}
 
	req, err := http.NewRequest(http.MethodPost, url, strings.NewReader(string(payload)))
	if err != nil {
		return result, err
	}
 
	// En-têtes requis par Supabase
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", supabaseAnonKey)
	req.Header.Set("Authorization", "Bearer "+supabaseAnonKey)
 
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return result, fmt.Errorf("erreur réseau Supabase : %w", err)
	}
	defer resp.Body.Close()
 
	body, _ := io.ReadAll(resp.Body)
 
	if err := json.Unmarshal(body, &result); err != nil {
		return result, fmt.Errorf("réponse Supabase invalide : %w", err)
	}
 
	if resp.StatusCode != http.StatusOK {
		return result, fmt.Errorf("supabase status %d : %s", resp.StatusCode, result.ErrorMessage)
	}
 
	return result, nil
}
 
// ═══════════════════════════════════════════════════════
//  SESSION — cookie HttpOnly
// ═══════════════════════════════════════════════════════
 
const cookieName = "jp_forum_session"
 
func setSessionCookie(w http.ResponseWriter, token string, expiresIn int) {
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,             // Inaccessible au JS : protège contre XSS
		Secure:   false,            // ← Mettre true en production (HTTPS)
		SameSite: http.SameSiteLaxMode,
		MaxAge:   expiresIn,
	})
}
 
func clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:   cookieName,
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})
}
 
func isAuthenticated(r *http.Request) bool {
	cookie, err := r.Cookie(cookieName)
	return err == nil && cookie.Value != ""
}
 
// ═══════════════════════════════════════════════════════
//  MIDDLEWARE D'AUTHENTIFICATION
// ═══════════════════════════════════════════════════════
 
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !isAuthenticated(r) {
			http.Redirect(w, r, "/login", http.StatusSeeOther)
			return
		}
		next(w, r)
	}
}
 
// ═══════════════════════════════════════════════════════
//  UTILITAIRE
// ═══════════════════════════════════════════════════════
 
func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}