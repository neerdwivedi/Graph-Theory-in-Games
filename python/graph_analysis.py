"""
Press Start to Graph: Python version of the six mini-project games.

Builds the chess move graphs, the Subway runner track graph, the one-stroke
puzzles, the Flood-It region graph, the tic-tac-toe game tree and a random
spanning-tree maze with NetworkX, then prints the same graph-theory results
the website computes live.

Run:  pip install networkx
      python graph_analysis.py
"""
import networkx as nx

# ---------------------------------------------------------------- chess ----
KNIGHT = [(1, 2), (2, 1), (-1, 2), (-2, 1), (1, -2), (2, -1), (-1, -2), (-2, -1)]
KING = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]
ROOK_DIRS, BISHOP_DIRS = KING[:4], KING[4:]


def chess_graph(piece="knight", n=8):
    """Vertices = squares (r, c). Edge = the piece can move between them."""
    G = nx.Graph()
    G.add_nodes_from((r, c) for r in range(n) for c in range(n))
    inside = lambda r, c: 0 <= r < n and 0 <= c < n
    for r in range(n):
        for c in range(n):
            if piece in ("knight", "king"):
                for dr, dc in (KNIGHT if piece == "knight" else KING):
                    if inside(r + dr, c + dc):
                        G.add_edge((r, c), (r + dr, c + dc))
            else:
                dirs = {"rook": ROOK_DIRS, "bishop": BISHOP_DIRS, "queen": KING}[piece]
                for dr, dc in dirs:
                    k = 1
                    while inside(r + k * dr, c + k * dc):
                        G.add_edge((r, c), (r + k * dr, c + k * dc))
                        k += 1
    return G


def knights_tour(G, start=(7, 1)):
    """Warnsdorff's rule: always jump to the square with the fewest onward moves."""
    path, seen = [start], {start}
    while len(path) < G.number_of_nodes():
        options = [v for v in G[path[-1]] if v not in seen]
        if not options:
            return None
        nxt = min(options, key=lambda v: sum(w not in seen for w in G[v]))
        path.append(nxt)
        seen.add(nxt)
    return path


# --------------------------------------------------------------- subway ----
def track_graph(length=20, trains=frozenset()):
    """Vertices = free (lane, step) cells. Edge = one step forward, same or adjacent lane."""
    G = nx.DiGraph()
    for s in range(length):
        for lane in range(3):
            if (lane, s) not in trains:
                G.add_node((lane, s))
    for s in range(length - 1):
        for lane in range(3):
            for d in (-1, 0, 1):
                a, b = (lane, s), (lane + d, s + 1)
                if 0 <= lane + d < 3 and a in G and b in G:
                    G.add_edge(a, b, switch=int(d != 0))
    return G


def count_runs(G, start, length):
    """Dynamic programming on the DAG: runs(v) = sum of runs(u) over edges u -> v."""
    runs = {v: 0 for v in G}
    runs[start] = 1
    for v in nx.topological_sort(G):
        for w in G.successors(v):
            runs[w] += runs[v]
    return sum(runs[v] for v in G if v[1] == length - 1)


# ----------------------------------------------------------- one-stroke ----
def house_graph():
    """'Draw the house without lifting your pen': 5 corners, 8 lines."""
    return nx.Graph([(0, 1), (1, 3), (3, 2), (2, 0), (2, 4), (4, 3), (0, 3), (1, 2)])


def one_stroke(G):
    """Euler's theorem: connected and 0 or 2 odd-degree vertices."""
    odd = [v for v in G if G.degree(v) % 2]
    if not nx.is_connected(G) or len(odd) not in (0, 2):
        return None
    return list(nx.eulerian_path(G))  # Hierholzer's algorithm


# -------------------------------------------------------------- flood-it ---
def flood_regions(board):
    """board: list of rows of colours. Returns the same-colour components and the region graph."""
    n = len(board)
    grid = nx.grid_2d_graph(n, n)
    same = grid.edge_subgraph((a, b) for a, b in grid.edges if board[a[0]][a[1]] == board[b[0]][b[1]]).copy()
    same.add_nodes_from(grid)
    regions = list(nx.connected_components(same))
    where = {cell: k for k, reg in enumerate(regions) for cell in reg}
    R = nx.Graph()
    R.add_nodes_from(range(len(regions)))
    R.add_edges_from((where[a], where[b]) for a, b in grid.edges if where[a] != where[b])
    return regions, R, where


# ----------------------------------------------------------- tic-tac-toe ---
LINES = [(0, 1, 2), (3, 4, 5), (6, 7, 8), (0, 3, 6), (1, 4, 7), (2, 5, 8), (0, 4, 8), (2, 4, 6)]


def winner(b):
    for x, y, z in LINES:
        if b[x] != "." and b[x] == b[y] == b[z]:
            return b[x]
    return "draw" if "." not in b else None


def game_tree_size():
    """Count every node of the full game tree, and the distinct positions."""
    nodes, seen = 0, set()

    def go(b, turn):
        nonlocal nodes
        nodes += 1
        seen.add(b)
        if winner(b):
            return
        for i, c in enumerate(b):
            if c == ".":
                go(b[:i] + turn + b[i + 1:], "O" if turn == "X" else "X")

    go("." * 9, "X")
    return nodes, len(seen)


def minimax(b, turn, memo={}):
    """Value for X with perfect play: +1 X wins, 0 draw, -1 O wins."""
    if (b, turn) in memo:
        return memo[(b, turn)]
    w = winner(b)
    if w:
        return {"X": 1, "O": -1, "draw": 0}[w]
    vals = [minimax(b[:i] + turn + b[i + 1:], "O" if turn == "X" else "X") for i, c in enumerate(b) if c == "."]
    memo[(b, turn)] = max(vals) if turn == "X" else min(vals)
    return memo[(b, turn)]


# ------------------------------------------------------------------ maze ---
def make_maze(w=14, h=9, seed=5):
    """A perfect maze is a random spanning tree of the grid graph."""
    return nx.random_spanning_tree(nx.grid_2d_graph(w, h), seed=seed)


# ----------------------------------------------------------------- report --
def describe(name, G):
    U = G.to_undirected() if G.is_directed() else G
    V, E = U.number_of_nodes(), U.number_of_edges()
    degs = sorted(d for _, d in U.degree())
    odd = sum(d % 2 for d in degs)
    bip = nx.is_bipartite(U)
    bound = 2 * V - 4 if bip else 3 * V - 6
    print(f"\n== {name} ==")
    print(f"order |V| = {V}, size |E| = {E}, degrees {degs[0]}..{degs[-1]}")
    print(f"connected: {nx.is_connected(U)}  ({nx.number_connected_components(U)} components)")
    print(f"bipartite: {bip}")
    print(f"cut-vertices: {len(list(nx.articulation_points(U)))}, bridges: {len(list(nx.bridges(U)))}")
    print(f"odd-degree vertices: {odd} -> Eulerian circuit: {odd == 0 and nx.is_connected(U)}")
    print(f"planarity bound: E = {E} {'>' if E > bound else '<='} {bound}"
          f" -> {'non-planar (proved)' if E > bound else 'inconclusive'};"
          f" networkx check_planarity: {nx.check_planarity(U)[0]}")


if __name__ == "__main__":
    for piece in ("knight", "king", "rook", "bishop", "queen"):
        describe(f"{piece} graph 8x8", chess_graph(piece))

    tour = knights_tour(chess_graph("knight"))
    print(f"\nKnight's tour (Hamiltonian path) found: {tour is not None}, length {len(tour) if tour else 0}")

    L = 20
    open_track = track_graph(L)
    describe("Subway runner: open track", open_track)
    print(f"survivable runs from the middle lane: {count_runs(open_track, (1, 0), L):,}")

    choke = {(0, 5), (2, 5), (0, 12), (2, 12), (1, 3), (1, 9), (1, 16), (0, 8), (2, 15)}
    G = track_graph(L, choke)
    describe("Subway runner: choke-point level", G)
    print(f"survivable runs: {count_runs(G, (1, 0), L):,}")

    house = house_graph()
    describe("One-stroke: house", house)
    print("one-stroke drawing:", one_stroke(house))
    print("crossed square (K4) drawable:", one_stroke(nx.complete_graph(4)) is not None)

    import random
    rnd = random.Random(11)
    board = [[rnd.randrange(5) for _ in range(10)] for _ in range(10)]
    regions, R, where = flood_regions(board)
    me = where[(0, 0)]
    ecc = nx.eccentricity(R, me)
    print(f"\n== Flood-It 10x10 ==\nsame-colour components: {len(regions)}, region graph |E| = {R.number_of_edges()}")
    print(f"eccentricity of the top-left region: {ecc} -> at least {ecc} moves needed")

    nodes, positions = game_tree_size()
    print(f"\n== Tic-tac-toe ==\ngame-tree nodes: {nodes:,}, distinct positions: {positions:,}")
    print("value with perfect play:", {1: "X wins", 0: "draw", -1: "O wins"}[minimax("." * 9, "X")])

    maze = make_maze()
    describe("Maze 14x9 (random spanning tree)", maze)
    print(f"tree: {nx.is_tree(maze)}, E = V - 1: {maze.number_of_edges() == maze.number_of_nodes() - 1}")
    print(f"dead ends (leaves): {sum(1 for v in maze if maze.degree(v) == 1)}")
    print(f"BFS escape length: {nx.shortest_path_length(maze, (0, 0), (13, 8))} steps")
