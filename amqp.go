package main

import (
	"fmt"
	"log"
	"encoding/json"

	"github.com/streadway/amqp"
)

type Message struct {
	ID	int       `json:"id"`
	Status string `json:"status"`
}

func failOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
		panic(fmt.Sprintf("%s: %s", msg, err))
	}
}

func listenForMessages(h *hub) {
	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open a channel")
	defer ch.Close()

	q, err := ch.QueueDeclare(
		"hello", // name
		false,   // durable
		false,   // delete when usused
		false,   // exclusive
		false,   // no-wait
		nil,     // arguments
	)
	failOnError(err, "Failed to declare a queue")

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	failOnError(err, "Failed to register a consumer")

	forever := make(chan bool)

	go func() {
		for d := range msgs {
			pend_message := Message{ 2, "succeeded"}
			log.Printf("struct:", pend_message)
			enc_message, enc_err := json.Marshal(pend_message)
			log.Printf("Encoded:", enc_message)
			if (enc_err != nil) {
				log.Fatal(enc_err)
			}

			h.broadcast <- enc_message
			log.Printf("Received a message: %s", d.Body)

			var dec_message Message
			dec_err := json.Unmarshal(enc_message, &dec_message)
			if (dec_err != nil) {
				log.Fatal(dec_err)
			}
			log.Printf("decoded:", dec_message)
		}
	}()

	log.Printf(" [*] Waiting for messages. To exit press CTRL+C")
	<-forever // TODO - Use wait to keep go func alive
}