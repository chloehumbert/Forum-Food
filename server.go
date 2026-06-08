package main

import (
	"log"
	"net/http"
	"strings"
)

func runServerExample() {
	mux := http.NewServeMux() // créer un routeur

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Write([]byte("Accueil du forum")) // afficher les posts
	})
	mux.HandleFunc("/posts/", func(w http.ResponseWriter, r *http.Request) {
		id := strings.TrimPrefix(r.URL.Path, "/posts/")
		w.Write([]byte("Post : " + id)) // afficher un post
	})
	mux.HandleFunc("/posts", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
			return
		}
		// créer un post
		http.Redirect(w, r, "/", http.StatusSeeOther)
	})
 // Sert tous les fichiers du dossier static/
    mux.Handle("/", http.FileServer(http.Dir("static")))
	
	log.Println("Démarré sur :3389")
	log.Fatal(http.ListenAndServe(":3389", mux))
}