package main

import (
  "flag"
  "log"
  "net/http"
  "path/filepath"
  "text/template"
)

var homeTempl *template.Template

func main() {
    flag.Parse()
    homeTempl = template.Must(template.ParseFiles(filepath.Join("index.html")))
    http.Handle("/resources/", http.StripPrefix("/resources/", http.FileServer(http.Dir("resources"))))

    h := newHub()
    go h.run()
    http.HandleFunc("/", homeHandler)
    http.Handle("/ws", wsHandler{h: h})

    go listenForMessages(h)

    var addr = flag.String("addr", ":8080", "http service address")

    // This is blocking, we continue to serve the page indefinitly.
    if err := http.ListenAndServe(*addr, nil); err != nil {
        log.Fatal("ListenAndServe:", err)
    }

}