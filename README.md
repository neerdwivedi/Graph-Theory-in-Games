# Press Start to Graph

A graph theory mini project: how games are secretly graphs, with two playable demos (Chess and a Subway-style endless runner) where every graph property is computed live.

## Project structure

```
press-start-to-graph/
├── index.html            Page layout: home page, animation, example cards, mini project
├── css/
│   └── style.css         Colours, fonts and layout
├── js/
│   ├── graph.js          Shared graph algorithms: BFS (components, bipartite test),
│   │                     Tarjan (cut-vertices, bridges), Eulerian test,
│   │                     planarity edge bound, Warnsdorff Hamiltonian path, degree chart
│   ├── chess.js          Chess move graphs for knight, king, rook, bishop, queen;
│   │                     knight's tour, perfect matching, adjacency matrix
│   ├── subway.js         3-lane runner track as a directed graph; counting survivable runs (DP),
│   │                     must-pass points, fewest-lane-switch route, level editor
│   ├── animation.js      Home page animation: game level -> waypoints -> edges -> Dijkstra -> chase
│   └── app.js            Switching between Home and Mini project, startup
└── python/
    └── graph_analysis.py Same graphs built in NetworkX, prints all results (for the report)
```

## Graph models

| Game | Vertices | Edges |
|---|---|---|
| Chess | 64 squares | the piece can move between the two squares |
| Subway runner | free (lane, step) cells | one step forward, staying in lane or switching one lane |
| Home animation | waypoints on walkable floor | clear line between two waypoints, weighted by distance |

## Run locally

Open `index.html` in any browser. No build step is needed.

Python analysis:

```bash
pip install networkx
python python/graph_analysis.py
```

## Deploy on Vercel

Push this folder to GitHub, import the repo at vercel.com/new, choose Framework Preset "Other", and deploy.
