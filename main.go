package main

import (
	"flag"
	"log"
	"net/http"
	"path/filepath"
	"text/template"

	"github.com/gorilla/mux"
)

var homeTempl *template.Template

func main() { 
	flag.Parse()

	parse_graph_json("./resources/build-graph.json")

	h := newHub()
	r := mux.NewRouter()
	homeTempl = template.Must(template.ParseFiles(filepath.Join("index.html")))

	r.HandleFunc("/statuses/", StatusesHandler)
	r.HandleFunc("/columns/", ColumnsHandler)
	r.HandleFunc("/nodes/", NodesHandler)
	r.HandleFunc("/links/", LinksHandler)
	r.HandleFunc("/", homeHandler)
	r.Handle("/ws", wsHandler{h: h})

	http.Handle("/", r)
	http.Handle("/resources/", http.StripPrefix("/resources/", http.FileServer(http.Dir("resources"))))

	go h.run()
	go listenForMessages(h)

	var addr = flag.String("addr", ":8080", "http service address")

	// This is blocking, we continue to serve the page indefinitly.
	if err := http.ListenAndServe(*addr, nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}

}