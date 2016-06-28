package main

import (
    "github.com/gorilla/websocket"
    "net/http"
	"log"
	"time"
)

func homeHandler(c http.ResponseWriter, req *http.Request) {
    homeTempl.Execute(c, req.Host)
}

type hub struct {
    connections map[*connection]bool

    broadcast  chan []byte
    register   chan *connection
    unregister chan *connection
}

func newHub() *hub {
    return &hub{
        broadcast:   make(chan []byte),
        register:    make(chan *connection),
        unregister:  make(chan *connection),
        connections: make(map[*connection]bool),
    }
}

func (h *hub) run() {
    for {
        select {
        case c := <-h.register:
            h.connections[c] = true
        case c := <-h.unregister:
            if _, ok := h.connections[c]; ok {
                delete(h.connections, c)
                close(c.send)
            }
        case m := <-h.broadcast:
            for c := range h.connections {
                select {
                case c.send <- m:
                default:
                    delete(h.connections, c)
                    close(c.send)
                }
            }
        }
    }
}

type connection struct {
    send chan []byte

	ws *websocket.Conn
    h  *hub
}

func (c *connection) reader() {
    for {
        _, message, err := c.ws.ReadMessage()
        if err != nil {
            break
        }
        c.h.broadcast <- message
    }
    c.ws.Close()
}

func (c *connection) writer() {
    for message := range c.send {
        err := c.ws.WriteMessage(websocket.TextMessage, message)
        if err != nil {
            break
        }
    }
    c.ws.Close()
}

var upgrader = &websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool { return true },
    ReadBufferSize: 1024, WriteBufferSize: 1024,
}

type wsHandler struct {
    h *hub
}

func (h *hub) send_test() {
	for {
		// TODO: Only send test string if clients are connected.
		h.broadcast <- []byte("Test from go")
		log.Printf("Sent a message to web page")
		time.Sleep(time.Second * 5)
	}
}

func (wsh wsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    ws, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    c := &connection{send: make(chan []byte, 256), ws: ws, h: wsh.h}
    c.h.register <- c
    defer func() { c.h.unregister <- c }()
    go c.writer()
    c.reader()
}