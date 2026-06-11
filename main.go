package main

import (
	"log"
	"net/http"
)

func main() {
	http.Handle("/", http.FileServer(http.Dir(".")))
	log.Println("Cookime démarré sur:localhost:5500")
	log.Fatal(http.ListenAndServe(":5500", nil))
}
