# Press Start to Graph

A graph theory mini project: how games are secretly graphs, with six playable demos where every graph property is computed live:
Chess, a Subway-style endless runner, a One-stroke puzzle, Flood-It, Tic-tac-toe against a minimax AI, and a Maze builder.

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
│   ├── onestroke.js      One-stroke puzzle: Euler trail/circuit test, Hierholzer solver,
│   │                     puzzle designer
│   ├── flood.js          Flood-It: same-colour components (BFS), region-adjacency graph,
│   │                     eccentricity lower bound, greedy hint
│   ├── tictactoe.js      Tic-tac-toe AI: full game tree, minimax, "why this move?" tree view
│   ├── maze.js           Maze builder: random spanning tree (DFS backtracker or Kruskal),
│   │                     BFS distances and shortest escape, playable with arrow keys
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
| One-stroke puzzle | corners of the drawing | lines of the drawing |
| Flood-It | 100 grid cells (or same-colour regions) | cells (or regions) that touch |
| Tic-tac-toe | board positions | one move from a position to the next |
| Maze builder | 126 rooms | open passages (a spanning tree of the grid) |
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
