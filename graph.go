package main

import (
    "fmt"
    "errors"
    "encoding/json"
    "io/ioutil"
)

type Node struct {
    Name  string
    ID    int
    Class string
}

type Link struct {
    Source int
    Target int
}

type Graph struct {
    Directed   bool
    Graph      [][]string
    Nodes      []Node
    Links      []Link
    Multigraph bool
}

var graph Graph

func find_node_in_graph (id int) (*Node, error) {
    for _, node := range graph.Nodes {
        if (node.ID == id) {
            return &node, nil
        }
    }
    return nil, errors.New("No node in graph with ID")
}


var columns = [][]Node{}

func get_node_column_number(id int) (int, error) {
    for i, column := range columns {
        for _, node := range column {
            if (node.ID == id) {
                return i, nil
            }
        }
    }
    return 0, errors.New("No node with ID")
}

func get_node_row_number(id int) (int, error) {
    for _, column := range columns {
        for i, node := range column {
            if (node.ID == id) {
                return i, nil
            }
        }
    }
    return 0, errors.New("No node with ID")
}

func remove_node_from_columns(id int) (error) {
    for i, column := range columns {
        for j, node := range column {
            if (node.ID == id) {
                fmt.Printf("I have moved %v\n", node.Name)
                columns[i] = append(column[:j], column[j+1:]...)
                return nil 
            }
        }
    }
    return errors.New("No node with ID")
}

func parse_graph_json(file_path string) {
    if (len(file_path) == 0) {
        return
    }

    file, file_err := ioutil.ReadFile(file_path)
    if file_err != nil {
        fmt.Printf("File error: %v\n", file_err)
        return
    }

    dec_err := json.Unmarshal(file, &graph)
    if dec_err != nil {
        fmt.Printf("Json error: %v\n", dec_err)
        return
    }

    fmt.Printf("Nodes: %v\n", graph.Nodes)
    fmt.Printf("Links: %v\n", graph.Links)

    for _, node := range graph.Nodes { 
        fmt.Printf("Node: %v\n", node.Name)
    }
    
    columns = append(columns, graph.Nodes)

    for _, link := range graph.Links {
        node_ref, err := find_node_in_graph(link.Target)
        if (err != nil) {
            fmt.Printf("Error: %v\n", err)
            return 
        }

        parent_col_num, err:= get_node_column_number(link.Source)
        if (err != nil) {
            fmt.Printf("Error: %v\n", err)
            return 
        }

        if ((parent_col_num + 1) >= len(columns)) {
            columns = append(columns, []Node{})
        }

        new_col := parent_col_num + 1

        err = remove_node_from_columns(node_ref.ID)
        if (err != nil) {
            fmt.Printf("Error: %v\n", err)
            return 
        }
        columns[new_col] = append (columns[new_col], *node_ref)

    }

    for i, column := range columns {
        fmt.Printf("Column %d: %v\n", i, column)
    }
    
}