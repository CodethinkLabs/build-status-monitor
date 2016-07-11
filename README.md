# Build Status Monitor

## Overview

Build Status Monitor is a build monitoring and visualisation tool that listens for status messages via AMPQ and updates a build graph with the current status of each component. It was inspired by the concourse atc and aims to be a more generic tool for use with other build systems.

## Prerequisites:

1. rabbitmq
2. go (golang.org/doc/install)

## Quick Start

Start rabbitmq by running the following as root:

	rabbitmq-server

To run the server you need to export your go path.  This can be any folder of your choosing where go will install downloaded packages:

	export GOPATH=~/go_workspace/

To install the project dependancies using the go get command:

	go get github.com/gorilla/mux
	go get github.com/gorilla/websocket
	go get github.com/streadway/amqp

To start the server run the following command in the project root folder:

	go run *go

The http server should now be listening on localhost:8080

To run the test app move to the test folder and run:

	go run send_msg.go

You will then be asked to enter the node you wish to update.  After selection the build successful message will be sent and the web ui should update accordingly.





