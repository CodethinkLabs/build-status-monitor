package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
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

func main() {
	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open a channel")
	defer ch.Close()

	q, err := ch.QueueDeclare(
		"build-status", // name
		false,          // durable
		false,          // delete when unused
		false,          // exclusive
		false,          // no-wait
		nil,            // arguments
	)
	failOnError(err, "Failed to declare a queue")

	var node_id int
	fmt.Print("Enter Node ID: ")
	if _, err = fmt.Scan(&node_id); err == nil {
		pend_message := Message{node_id, "succeeded"}
		enc_message, err := json.Marshal(pend_message)
		failOnError(err, "Failed to serialise message")

		err = ch.Publish(
			"",     // exchange
			q.Name, // routing key
			false,  // mandatory
			false,  // immediate
			amqp.Publishing{
				ContentType: "text/plain",
				Body:        []byte(enc_message),
			})

		log.Printf(" [x] Sent %s", enc_message)
		failOnError(err, "Failed to publish a message")
	} else {
		// Consume remainder of input on failure
		stdin := bufio.NewReader(os.Stdin)
		stdin.ReadString('\n')

		fmt.Printf("Error: %v\n", err)
	}
}