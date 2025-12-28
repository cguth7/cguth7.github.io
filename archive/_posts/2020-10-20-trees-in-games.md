---
title: "AIPT Section 2.2: Game Theory -- Trees in Games"
date: 2021-02-03
sidebar:
  nav: "nav"
toc: true
toc_sticky: true
toc_label: "TOC"
author_profile: false
---

# Game Theory -- Trees in Games
Many games can be solved using the minimax algorithm for exploring a tree and determining the best move from each position. Unfortunately, poker is not one of those games. 

## Basic Tree
Take a look at the game tree below. The circular nodes represent player positions and the lines represent possible actions. The "root" of the tree is the initial state at the top. We have P1 acting first, P2 acting second, and the payoffs at the leaf nodes in the standard P1, P2 format. 

In a poker game, there might be a chance node at the top that deals cards, followed by player decision nodes, and then terminal nodes at the bottom according to the amounts won in the hand. 

<!--chance at top, card states, actions, terminal node with utility -->

![Minimax tree](../assets/section2/trees/minimax.png)

The standard way to solve a game tree like this is using **backward induction**, whereby we start with the leaves (i.e. the payoff nodes at the bottom) of the tree and see which decisions the last player, Player 2 in this case, will make at her decision nodes. 

Player 2's goal is to minimize the maximum payoff of Player 1, which in the zero-sum setting is equivalent to minimizing her own maximum loss or maximizing her own minimum payoff. This is equivalent to a Nash equilibrium in the zero-sum setting. 

She picks the right node on the left side (payoff -1 instead of -5) and the left node on the right side (payoff 3 instead of -6). 

These values are then propagated up the tree so from Player 1's perspective, the value of going left is 1 and of going right is -3. The other leaf nodes are not considered because Player 2 will never choose those. Player 1 then decides to play left to maximize his payoff. 

![Minimax tree solved](../assets/section2/trees/minimax2.png)

We can see all possible payouts, where the rows are P1 actions and the columns are P2 actions after P1 actions (e.g. Left/Left means P1 chose Left and then P2 also chose Left).

| P1/P2  | Left/Left | Left/Right | Right/Left | Right/Right |
|---|---|---|---|---|
| Left  | 5,-5  | 5,-5  | 1,-1  | 1,-1 |
| Right  | -3,3  | -3,3 | 6,-6  | 6,-6 |

Note that Player 1 choosing right *could* result in a higher payout (6) if Player 2 also chose right, but a rational Player 2 would not do that, and so the algorithm requires maximizing one's minimum payoff, which means Player 1 must choose left (earning a guaranteed value of 1). 

By working backwards from the end of a game, we can evaluate each possible sequence of moves and propagate the values up the game tree.

**Subgame perfect equilibrium** means that each subgame, which is a decision state in the above game tree, is a Nash equilibrium. The strategy of P1 choosing Left and P2 choosing Right after Left and Left after Right is a subgame perfect equilibrium. 

Two main problems arise with minimax and backward induction. 

### Problem 1: The Game is Too Damn Large

In theory, we could use the minimax algorithm to solve games like chess. The problem is that the game and the space of possible actions is HUGE. It's not feasible to evaluate all possibilities. The first level of the tree would need to have every possible action and then the next level would have every possible action from each of those actions, and so on. Even checkers is very large, though smaller games like tic tac toe can be solved with minimax. More sophisticated methods and approximation techniques are used in practice for large games. One simple method is to only go down the tree to a depth of "X" and then approximate the value of the states there by using some sort of heuristic. 

### Problem 2: Perfect Information vs. Imperfect Information

What about poker? Real poker games like Texas Hold'em are very large and run into the same problem we have with games like chess, but in addition, poker is an **imperfect information game** and games like chess and tic tac toe are **perfect information games**. The distinction is that in poker there is hidden information -- each player's private cards. In perfect information games, all players see all of the information. 

With perfect information, each player knows exactly what node/state he is in in the game tree. With imperfect information, there is uncertainty about the state of the game because the other player's cards are unknown.

## Poker Tree

Below we show the game tree for 1-card poker. In brief, it's a 1v1 game where each player starts with $2 and antes \\$1, leaving a single \\$1 bet remaining. We'll go into more details about the game in the next section. 

The top node is a chance node that "deals" the cards. To make it more readable, only 2 chance outcomes are shown, Player 1 dealt Q with Player 2 dealt J and Player 1 dealt Q with Player 2 dealt K. 

![1-card poker game tree](../assets/section2/trees/infoset2.png)
*1-card poker game tree from University of Alberta 2015 paper HULHE is Solved*

Player 1's initial action is to either bet or pass. If Player 1 bets, Player 2 can call or fold. If Player 1 passes, Player 2 can bet or pass. If Player 1 passed and Player 2 bet, then Player 1 can call or fold. 

Note the nodes that are circled and connected by a line. This means that they are in the same **information set**. An information set consists of equivalent game states based on information known to that player. For example, in the top information set, Player 1 has a Q in both of the shown states, so his actions will be the same in both even though Player 2 could have either a K or J. The information known to Player 1 is "Card Q, starting action". At the later information set, the information known is "Card Q, I pass, opponent bets". All decisions must be made based only on information known to each player! However, these are actually different true game states.

Looking at the information set at the bottom after Player 1 passes and Player 2 bets, Player 1 has the same information in both cases, but calling when Player 2 has a J means winning 2 and calling when Player 2 has a K means losing 2. The payoffs are completely different! We can refer to these as different "worlds". Player 2 would also have equivalent states if the additional chance branches were shown where Player 2 also had the J or K cards. 

Because of this problem we can't simply propagate values up the tree as we can do in perfect information games. Later in the tutorial, we will discuss CFR (counterfactual regret minimization), which is a way to solve games like poker that can't be solved using minimax. 

## Tic Tac Toe Tree

<!-- **Tree goes here** -->

On the tic tac toe tree, from the initial state, there are up to 9 levels of moves. Each subsequent level has fewer possible actions since more spaces on the game board are taken as we go down the tree. The tree ends at points either where the game is over because one player wins or when all the spaces are filled and no one has won, resulting in a tie. 

In tic tac toe, the sequence of actions prior to a certain game state are not important. 

## Tic Tac Toe Python Implementations
While we're mainly focused in this tutorial on poker and imperfect information games, we take a short detour to look more in-depth at minimax and Monte Carlo Tree Search (MCTS) through the lens of tic tac toe. 

### Tic Tac Toe in Python
Below we show a basic Python class called Tictactoe. The board is initialized with all 0's and each player is represented by a 1 or -1. Those numbers go into board spaces when the associated player makes a move. The class has 5 functions: 

1. make_move: Enters the player's move onto the board if the space is available and advances the play to the next player
2. new_state_with_move: Same as make_move, but returns a copy of the board with the new move instead of the original board
3. available_moves: Lists the moves that are currently available on the board
4. check_result: Checks every possible winning sequence and returns either the winning player's ID if there is a winner, a 0 if the game has ended in a tie, or None if the game is not over yet
5. repr: Used for printing the board. Empty slots are represented by their number from 0 to 8, player 1 is represented with 'x', player 2 is represented with 'o', and a line break is added as needed after the first 3 and middle 3 positions.

We also have two simple agent classes: 
1. HumanAgent: Enters a move from 0-8 and the move is placed if it's available, otherwise we ask for the move again
2. RandomAgent: Randomly selects a move from the available moves

Finally, we need another function to actually run the game. 

```python 
class Tictactoe:
	def __init__(self, board = [0] * 9, acting_player = 1):
		self.board = board
		self.acting_player = acting_player

	def make_move(self, move):
		if move in self.available_moves():
			self.board[move] = self.acting_player
			self.acting_player = 0 - self.acting_player #Players are 1 or -1

	def new_state_with_move(self, move): #Return new ttt state with move, but don't change this state
		if move in self.available_moves():
			board_copy = copy.deepcopy(self.board)
			board_copy[move] = self.acting_player
			return Tictactoe(board_copy, 0 - self.acting_player)
			
	def available_moves(self):
		return [i for i in range(9) if self.board[i] == 0]
	
	def check_result(self):
		for (a,b,c) in [(0,1,2),(3,4,5),(6,7,8),(0,3,6),(1,4,7),(2,5,8),(0,4,8),(2,4,6)]:
			if self.board[a] == self.board[b] == self.board[c] != 0:
				return self.board[a]
		if self.available_moves() == []: return 0 #Tie
		return None #Game not over
		
	def __repr__(self):
		s= ""
		for i in range(9): 
			if self.board[i] == 0:
				s+=str(i)
			elif self.board[i] == 1:
				s+='x'
			elif self.board[i] == -1:
				s+='o'
			if i == 2 or i == 5: s += "\n"
		return s
```
```python
class HumanAgent:
	def select_move(self, game_state):
		print('Enter your move (0-8): ')
		move = int(float(input()))
		#print('move', move)
		#print('game state available moves', game_state.available_moves())
		if move in game_state.available_moves():
			return move
		else:
			print('Invalid move, try again')
			self.select_move(game_state)
```

```python
class RandomAgent:
	def select_move(self, game_state):
		return random.choice(game_state.available_moves())
```

```python
if __name__ == "__main__":
	ttt = Tictactoe() 
  #ttt = Tictactoe([0,0,-1,0,0,0,1,-1,1]) #Optionally can start from a pre-set game position
	h = HumanAgent()
  r = RandomAgent()
  moves = 0
	while ttt.available_moves():
		print(ttt)
		print('move', moves)
		print('acting player', ttt.acting_player)
		if moves % 2 == 0:
			move = player1.select_move(ttt)
		else:
			move = player2.select_move(ttt)
		ttt.make_move(move)
		if ttt.check_result() == 0:
			print('Draw game')
			break
		elif ttt.check_result() == 1:
			print('Player 1 wins')
		elif ttt.check_result() == -1:
			print('Player 2 wins')
		moves+=1
```

### Minimax Applied to Tic Tac Toe
We can apply the minimax algorithm to tic tac toe. Here we use a simplified version of minimax called negamax, because in a zero-sum game like tic tac toe, the value of a position to one player is the negative value to the other player. 

We store already evaluated states in a memo dictionary containing each move and its value. When a state has not been seen before, we check the game state, which will either return the winning player, 0 for tie, or None for "game not yet over". 

If the game is over, then there is no move from this position and the value is simply the result of the game. 

If the game is not over, we iterate through the available moves and recursively find a value for each possible move. As each move is evaluated, we store the best move and the value for that move and return the overall best after evaluating each move. 

```python
class NegamaxAgent:
	def __init__(self):
		self.memo = {} #move, value

	def negamax(self, game_state):
		if game_state not in self.memo: #already visited this state?
			result = game_state.check_result()
			if result is not None: #leaf node or end of search
				best_move = None
				best_val = result * game_state.acting_player #return 0 for tie or 1 for maximizing win or -1 for minimizing win
			else:
				best_val = float('-inf')
				for i in game_state.available_moves():
					clone_state = copy.deepcopy(game_state)
					clone_state.make_move(i) #makes move and switches to next player
					_, val = self.negamax(clone_state)
					val *= -1 
					if val > best_val:
						best_move = i
						best_val = val	
			self.memo[game_state] = (best_move, best_val)
		return self.memo[game_state]
```

## Monte Carlo Tree Search (MCTS)
MCTS is a more advanced algorithm that finds the optimal move through simulation. This algorithm is used as part of some recent advances in AI poker agents as well as in agents in perfect information games like Go and chess. Monte Carlo methods in general use random sampling for problems that are difficult to solve using other approaches. 

### MCTS Background
MCTS allows us to determine the best optimal move from a game state without having to expand the entire tree like we had to do in the minimax algorithm. Also the MCTS algorithm does not require any domain knowledge, making it very versatile and powerful. However, domain knowledge can be used to improve performance by applying known patterns to the simulation policy rather than using default moves. 

MCTS is primarily effective in games of perfect information and provides no guarantees for imperfect information games. In imperfect information games, MCTS must use determinization, which is the analysis of the game as if the true world states were known. However, this presents a number of large problems such as strategy fusion. Suppose that the true setting could be either "World 1" or "World 2" (the equivalent in Kuhn Poker is that we have card Q and our opponent has either card J or K). In computing the strategy, there could be a case such as where the maximizing player can guarantee a utility of 1 by, for example, always going right (valid in both World 1 and World 2), but if the player chose to go left, then they would have yet another decision to go right or left after Play 2 acted. If the true setting was "World 1", then going right from this node would result in a utility of 1 and left would be -1. If the true setting was "World 2", then going right would result in a utility of -1 and left would be 1. We can see then that with perfect information (if we knew the actual World 1 or World 2 situation), then the player could always guarantee the payout of 1 regardless of the initial action, but with imperfect information, the player risks a utility of -1 by taking the non-guaranteed payout route. 

This is a problem that prevents the usual minimax formulation from working properly.

Still, there are methods to apply MCTS to imperfect information games like poker. Due to the asymmetry of information in imperfect information games, a separate search tree is used for each player. Information State UCT (IS-UCT) is a multi-player version of Partially Observable UCT, which searches trees over histories of information states instead of histories of observations and actions of Partally Observable Markov Decision Processes (POMDP). IS-UCT has not been shown to converge in poker games, but an alternative called Smooth IS-UCT was shown to converge in Kuhn poker and showed robust results in Limit Hold'em, although regular IS-UCT also did. 

Although MCTS does not have theoretical convergence guarantees for multiplayer games, it is well defined for such games, unlike CFR methods (although CFR methods have found strong results). In poker, MCTS has been found to work quickly, but it generally finds a suboptimal (although decent) strategy. 

In most recent applications, the MCTS algorithm is used as part of poker algorithms to estimate state values, but not on its own to solve the game. 

### MCTS Applied to Tic Tac Toe
Let's consider that we want to find the best tic tac toe move from some state of the game that we can pre-specify. Let's go through the algorithm step by step. 

The MCTSAgent class and its select_move function contain the core of the algorithm. The function begins by setting the root of the game tree as an MCTSNode class. A node is a decision point in the game tree, so the root node is the beginning of the tree. If we wanted to find out the best move from the beginning of the game, this would represent an empty tic tac toe board. 

Each node is initialized with a game state, a parent node, a move, a set of child nodes, a counter for wins by each player, a counter for rollouts that have gone through this node, and a list of available moves from this node. 

For some fixed number of rounds, we go through the following steps: 

1. Selection: Start from the root (current game state) and select child nodes until a leaf node (node that has a potential child from which no simulation has yet been initiated) is reached. Child nodes are selected by modeling each selection problem as a multi armed bandit using the Upper Confidence Bound (UCB) applied to trees to balance between the exploitation of moves with high average wins and exploration of moves with few simulations. 

2. Expansion: If we can add a child node, then we select a random move from the current game state and create a new node to represent the game with this new move, which becomes a child of the prior node. This is done through the add_random_child function in the MCTSNode class.

3. Simulation: Next we run a random playout from the newly expanded node until the game ends

4. Backpropagation: From the end of the game, we update each node that was passed through by updating the win counts for each player (one player gets +1 and one gets -1 or both get 0 in the case of a tie) and adding 1 to the number of rollouts that have passed through each of the nodes. 

After running MCTS, we look at each child node from the root and evaluate its win percentage over all of the simulations. We then print a list of the moves in order of their winning percentage, along with how many simulations were run for each move. 

```python
class MCTSNode:
	def __init__(self, game_state, parent = None, move = None):
		self.parent = parent
		self.move = move
		self.game_state = game_state
		self.children = []
		self.win_counts = {1: 0, -1: 0}
		self.num_rollouts = 0
		self.unvisited_moves = game_state.available_moves()

	def add_random_child(self):
		move_index = random.randint(0, len(self.unvisited_moves)-1) #inclusive
		new_move = self.unvisited_moves.pop(move_index)
		new_node = MCTSNode(self.game_state.new_state_with_move(new_move), self, new_move)
		self.children.append(new_node)
		return new_node

	def can_add_child(self):
		return len(self.unvisited_moves) > 0

	def is_terminal(self):
		return self.game_state.check_result() is not None

	def update(self, result):
		if result == 1:
			self.win_counts[1] += 1
			self.win_counts[-1] -= 1
		elif result == -1:
			self.win_counts[-1] += 1
			self.win_counts[1] -= 1
		self.num_rollouts += 1

	def winning_frac(self, player):
		return float(self.win_counts[player]) / float(self.num_rollouts)


class MCTSAgent:
	def __init__(self, num_rounds = 10000, temperature = 2):
		self.num_rounds = num_rounds
		self.temperature = temperature

	def uct_select_child(self, node):
		best_score = -float('inf')
		best_child = None
		total_rollouts = sum(child.num_rollouts for child in node.children)
		log_rollouts = math.log(total_rollouts)

		for child in node.children:
			win_pct = child.winning_frac(node.game_state.acting_player)
			exploration_factor = math.sqrt(log_rollouts / child.num_rollouts)
			uct_score = win_pct + self.temperature * exploration_factor
			if uct_score > best_score:
				best_score = uct_score
				best_child = child
		return best_child

	def select_move(self, game_state):
		root = MCTSNode(game_state)

		for i in range(self.num_rounds):
			node = root

			#selection -- UCT select child until we get to a node that can be expanded
			while (not node.can_add_child()) and (not node.is_terminal()):
				node = self.uct_select_child(node)

			#expansion -- expand from leaf unless leaf is end of game
			if node.can_add_child():
				node = node.add_random_child()

			#simulation -- complete a random playout from the newly expanded node
			gs_temp = copy.deepcopy(node.game_state)
			while gs_temp.check_result() is None:
				gs_temp.make_move(random.choice(gs_temp.available_moves()))

			#backpropagation -- update all nodes from the selection to leaf stage
			while node is not None:
				node.update(gs_temp.check_result())
				node = node.parent

		scored_moves = [(child.winning_frac(game_state.acting_player), child.move, child.num_rollouts) for child in root.children]
		scored_moves.sort(key = lambda x: x[0], reverse=True)
		for s, m, n in scored_moves[:10]:
			print('%s - %.3f (%d)' % (m, s, n))

		best_pct = -1.0
		best_move = None
		for child in root.children:
			child_pct = child.winning_frac(game_state.acting_player)
			if child_pct > best_pct:
				best_pct = child_pct
				best_move = child.move
		print('Select move %s with avg val %.3f' % (best_move, best_pct))
		return best_move
```

MCTS in general works very effectively to simulate play in game trees and was famously combined with neural networks in AlphaGo by DeepMind to create a Go agent that defeated top human players. 