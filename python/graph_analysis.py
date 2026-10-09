"""
Press Start to Graph: Python version of the two mini-project games.

Builds the chess move graphs and the Subway runner track graph with NetworkX,
then prints the same graph-theory results the website computes live.

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
