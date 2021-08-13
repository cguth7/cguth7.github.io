---
title: "AIPT Section 4.2: CFR -- Game Abstractions"
date: 2021-02-03
sidebar:
  nav: "nav"
toc: true
toc_sticky: true
toc_label: "TOC"
author_profile: false
---

# CFR - Game Abstractions

## Game Size
The size of a game is a simple heuristic that can be used to describe its complexity
and to compare it to other games. One way to measure a game size is to count the
number of game states, the number of possible sequences of actions by the players or
by chance, as viewed by a third party that observes all of the players’ actions. In
poker, this is all of the ways that the players’ private and public cards can be dealt and
all of the possible betting sequences.

Infoset-actions is the standard game size measurement in poker, which is the number
of legal actions summed over each information set, also known as the total number of
behavioral strategies. An spectator’s (who cannot see private cards) view of the
number of infoset-actions is considered the two-sided perspective. The one-sided
perspective is the number of infoset-actions from the perspective of one player. This
can be further reduced to the one-sided canonical perspective, which is the same as
the one-sided, but also includes losslessly merging isomorphic card combinations that
are strategically identical.

CFR converges linearly with the number of canonical information sets. The algorithm
requires two double-precision floating point variables per infoset-action, one to
accumulate regret, and the other to accumulate the average strategy.
Michael Johanson of the University of Alberta showed that the sizes of games can generally be compared by means of
evaluating the number of game states, or the number of possible sequences of actions
by the players or by chances. In poker, this includes all the ways that the public and
private cards can be dealt and all possible betting sequences. 

### Limit Hold'em Size
In limit hold’em, the task of computing the number of infoset-actions is relatively
easy because there is only one betting option allowed for each betting round, which
can only occur a maximum of four times, and the betting actions and information sets
within each round are independent of the betting history and stack sizes (assuming
large enough stack sizes to be able to complete all bets). From a 1-player perspective
(assuming the 2nd player’s cards are unknown), the number of ways to deal the cards
is calculated as:

52c2 for the 1st round and then 52c2 * 50c3 for the 2nd round, and so on

These calculations would be reduced if we considered lossless abstraction of card
combinations.

We can calculate the number of information sets by looking at each round and
multiplying the card combinations in that round by the possible betting sequences
based on a chart of betting sequences. 

### No Limit Hold'em Size
No-limit poker is more of a computational challenge because each betting round
depends on prior rounds, since each player’s stack size varies as the hand progresses.
Each game depends on two variables: the stack size to start the game and the value of
the big blind. 

Per the game rules, players have the following two betting restrictions:
Minimum bet: max(big blind, current bet size)
Maximum bet: Stack size

The legal actions possible depend on three factors: amount of money remaining,
size of bet facing, and if it’s possible to check (if it’s the first action in a round). 

Each
of these factors strictly increases or decreases in a round.
The method used to compute the number of infoset-actions in no limit hold’em poker
is to incrementally compute the number of action histories that reach each of these
configurations by using dynamic programming. The base case is the start of the
game and the inductive step is n action sequences reach a given configuration, then
for each legal action at that configuration, we can add another n ways to reach
subsequent configurations. We look at each round in increasing order, visit all  configurations where checking is allowed, and then where a call ends the round. We
update each configuration in order from largest stacks remaining to smallest and
within each subset from smallest bets faced to largest. 

This requires only a single
traversal since all actions taken from a configuration only update the number of ways
to reach configurations later in the ordering. Counters are used for each round that
track the number of action sequences that lead to a decision by a player and the total
number of infoset-actions. The algorithm traverses configurations over all rounds,
then multiplies by the branching factors due to chance events.

The implementation involves one variable for each configuration of stack size and bet
faced, which can be done with a 2-dimensional array, which can be reused each round
with the addition of a vector indexed by stack size to track possible ways to reach the
next round.

Michael Johanson’s paper performs these calculations for the standard No Limit Texas
Hold’em game used in the ACPC, which uses \\$20,000 (200-blind) stacks with \\$50-
\\$100 blinds. Although 200 blinds is fairly normal in poker (although most online
games start with 100 blinds), the large stack size in absolute dollar terms means that a
much larger number of actions are possible than, for example, 200 blinds in a \\$1-\\$2
blind setting. The initial raise in the latter setting is any amount from \\$4 to \\$400,
whereas in the former it is \\$200 to \\$20,000. 

### Comparing Limit and No Limit Hold'em
Whereas limit hold’em has a 1-sided canonical game size of 1.4x10^13 infosetactions, no limit $1-2 with $1000 starting stacks (500 blinds) is 3.12x10^71, $1-2
with $400 (200 blind) starting stacks is 6.0x10^46, and $50-100 with $20,000 (200
blind) starting stacks is 2.8x10^160. Not including transpositions, chess has 10^47
game states, checkers has 10^20 game states, and Go has 10^170 states.

Although one vs. one limit hold’em has now been solved over a long computation
period with a very specialized parallel machine setup, no limit is substantially larger
and requires abstraction to make the game small enough to be solved. Johanson
recommends analyzing the suboptimality in unabstracted games by finding a game
with these 3 properties: 

1. Unabstracted best response computations are tractable and convenient, so
worst case performance of strategies with abstracted betting can be evaluated.
One can then evaluate abstraction and translation techniques in isolation from
other factors.

2. Unabstracted equilibrium computations are tractable and convenient. So we
can compute an optimal strategy for the game and measure its performance
against agents that use betting abstraction.

3. Strategic elements similar to those of NLHE (in terms of rounds, deck size, 5-
card poker hands, and large stack sizes)

Properties (1) and (2) allow for us to compare agents in the full game and in terms of
(1) best response and (2) against the full game equilibrium. For condition (3), in order
to provide the flexibility of solving this game on standard personal computers, we are
limited in the size of the game that we can possibly use. 

### Royal No Limit Hold'em 
Johanson suggests a potential testbed game as 2-\\$20 \\$1-\\$2 No Limit Royal Hold’em,
a game which uses 2 betting rounds, \\$20 stack sizes, and \\$1-\\$2 blinds. The game size
is 1.55x10! and CFR requires 7GB of RAM for the computation.

While the size of full poker games that are commonly played in casinos require more
memory than is feasible for today’s modern computers, Royal No Limit Hold’em is
accessible to all, which could make a game of this sort a more even playing field in a
competition.

We analyzed betting abstractions in Royal Hold'em to determine whether basic abstractions like FCPA (fold, call,
pot, allin) are exploitable and can be improved by more sophisticated abstractions. We
also wanted to test whether the weaker the abstraction, the more exploitable it will be and the
higher the losses against the unabstracted agent. 

With more advanced CFR versions that use deep learning rather than only tabular data like the original CFR, it's likely that a much larger testbed game could be explored. 

## Game Abstraction Techniques
Abstraction is the main method for solving incomplete information games that are too
large to be solved in their original form. It is extremely prevalent in solving poker
games. The Abstraction-Solving-Translation model includes the following steps:

First, the game is abstracted to create a smaller game that is strategically similar to the
original game. Then the approximate equilibrium is computed in the abstract game,
and finally the abstract game is mapped back to the original game. The resultant
strategy is a Nash equilibrium approximation in the original game, but will still be
exploitable to some degree in that game. 

We need abstraction when game sizes are too large to be solved with current
technology, or when the original game may be too difficult or large to write in full
details, or when the game may not be composed of discrete actions/states in its
original form.

We define abstract games as follows:
- Abstraction	for	player i is a pair a_i = a^I _i, a^A _i
- a^I _i is a partitioning of H_i, defining a set of abstraction information sets that must be coarser than I_i
- a^A _i is a function on histories where a^A _i(h) is in A(h) and a^A _i(h) = a^A _i(h') for all histories h and h' in the same abstract information set. We will call this the abstract action set. 
- The null abstraction for player i is zeta_i = I_i, A
- An abstraction a is a set of abstraction a_i, one for each player
- For any abstraction a, the abstract game |-^a is the extensive game obtained from |- by replacing I_i with a^I _i and A(h) with a^A _i(h) when P(h) = i, for all i

Strategies for abstract games are defined in the same way as strategies in the main
game, but restricted strategies must be given zero probability.

### Types of Abstractions
The three main ways to create a smaller game from a larger one in poker are to merge
information sets together (card abstraction), to restrict the actions a player can take
from a history (action abstraction), and to lose the perfect recall assumption, which  can make the game smaller by changing the player’s memory to, usually, only more
recent histories. These techniques are often combined.

A further possibility is to simplify the game itself. This can be done in poker by
limiting the maximum number of bets per round, eliminating betting rounds, and
eliminating cards. For example, the variant of Texas Hold’em that we analyze in this
paper is called Royal Texas Hold’em and uses only 20 cards instead of the standard
52 in the deck.

Abstractions can be either lossless or lossy. A lossless abstraction respects the original
strategic complexity of the game, while reducing the number of game states. 

#### Lossless Abstraction and Isomorphisms
With poker, the first step is usually to use lossless abstraction to take advantage of the
strategic equivalence of poker hands with regards to their suits. All suits are of the
same value, so only how many cards of the same suit a player has is relevant, not the
actual type of suit. For example, a player with a starting hand of Jack of spades and
Queen of hearts has the same exact quality hand in the case of having Jack of
diamonds and Queen of clubs. There are 16 combinations of a Queen and Jack. The
12 that are different suits can be reduced to only one abstracted strategy and the 4 of
the same suit are also equivalent to one abstracted strategy. Such abstractions
generally reduce the size of poker games by one-to-two orders of magnitude. Lossless abstraction enabled the solution of Rhode Island Hold’em, an AI challenge
problem with 3.1 billion nodes in the game tree, but generally, lossy abstraction is
also needed.

This lossless abstraction must be redefined at each betting round, because while the
type of suits are not relevant on a per-round basis, future rounds can redefine the
value of a hand according to its suits. Continuing the above example, after a flop of
6h7h8h, the QhJs hand is much superior to the QcJd hand due to now having four
hearts (one heart away from a flush).

In a Texas Hold’em game, just from the first round alone, we move from 52c2*50c2 = 1,624,350 to 28,561 combinations by ussing lossless abstraction. 

Kevin Waugh showed a fast and optimal technique to index poker hands that
accounts for suit isomorphisms. Isomorphisms are cases where poker hands
cannot be strategically distinguished. Using such techniques, we can build lossless
abstraction. For example, in Royal Hold’em, where there are 20 cards (four suits and
cards Ten, Jack, Queen, King, and Ace), we have the following two-card starting
hands:

- Order and suitedness matter: 20 ∗ 20 = 400 combinations
- Order does not matter, suitedness matters: 20c2 = 190 combinations
- Order and suitedness do not matter: 25 combinations (10 unpaired
combinations both suited and unsuited and 5 pairs)

We can permute the suits and order of the cards within any round however we would
like without losing any strategic significance, so Royal Hold’em effectively begins
with only 25 information sets for the player acting first in the preflop round. It is
important that we can construct an indexing function that is efficient to compute, has
no holes, and has an inverse mapping.

In practice, we store the regrets and strategies for each index, whereby multiple
equivalent hands can use the same index. The indexing procedure works by indexing
using the multiset-colex index, whereby we first index rank sets (sets of cards of the
same suit), then rank groups (sequences of rank sets), and finally combine them into a
hand index. 

#### Lossy Abstraction
All other abstractions are lossy and result in some loss of strategic significance. We
experiment with action abstraction in our work with Royal No Limit Hold’em and
with card abstraction in our Kuhn Poker experiment.

Action abstraction is when players are given fewer actions available than in the
original game, that is, a restriction on the players’ strategy space. This is especially
useful for games with large numbers of possible actions available, such as NLHE. In
no limit poker, the most standard action abstraction is allowing only {fold, call, pot
bet, allin bet}. This restricts the first action in a no limit hold’em game with $20
starting stacks and a $2 big blind to either {fold, call $2, raise to $4, raise to $20}
instead of {fold, call, raise to any amount between and including $4-$20}, which
results in four total actions possible instead of 19.

Card, or information, abstraction occurs by grouping categories of hands into
equivalence classes called buckets. The standard method, expected hand strength,
works by grouping by the probability of winning at showdown against a random hand
by enumerating all possible combinations of community cards and finding the portion
of the time the hand wins. For example, one could create five buckets to divide the
probabilities into equities from {0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1}. This could
lead to some buckets being very small and others very large. Hands also must
transition between buckets during play. Buckets could be created automatically such
as in the manner just described or manually, which requires expert input, but would be
quite difficult to create policies for.

Three common ways of bucketing are:
**Expectation-based:** Developed by Gilpin and Sandholm in 2007. Buckets are created
based on the potential to improve given future cards. A problem is that buckets can be
unevenly distributed and that there are often strategic differences in playing draw
hands compared to made hands, which would not be differentiated here. The standard
technique is to make each bucket on each round to have the same percentage of cards
based on a hand strength measure, which could be based on the expectation of hand
strength E[HS] or E[HS^2] (gives more value to hands with higher potential to
improve in the future) or some similar metric, which are measured against winning at
showdown against a random hand. 

A few possible bucketing techniques:
- Nested bucketing: Start with E[HS^2] and then split the first buckets into
E[HS] to better distinguish between high potential and high hand strength
- Percentile bucketing: Automated bucketing technique such that each bucket
holds approximately the same amount of hands
- History bucketing: Manual bucketing technique with child buckets
individually determined for each parent bucket in the previous round since
some have a higher probability to transition to particular buckets in the next
round, so for example if there are many high strength hands, more high hand
strength buckets will be needed in the next round, which improves abstraction
quality.

**Potential-aware:** Automated abstraction technique that was created in 2007 by Gilpin
and Sandholm that uses multi-dimensional histograms, where the maximum number
of buckets in each round is determined based on the size of the final linear program to
solve. The final round hands are bucketed into sets using k-means clustering, and then
frequency histograms on the prior-to-final round are used to see how often they turn into the previously created final round clusters. So if there are five clusters on the
final round, then there would be a distribution of five transition probabilities on the
prior round, which are then grouped together using some similarity function such as
Euclidean distance for each value in the histogram. This continues backwards until
the first round.

Potential aware abstraction has been found to be superior for finer abstractions, while
expectation based is better for coarser abstractions. This may be because the potential
aware approach is trying to learn a more complex model, so therefore requires a larger
dimension to capture this richness. Potential aware abstraction is lossless at the limit,
so a fine enough abstraction can be used to find a Nash equilibrium.

**Phase-based:** This method solves earlier parts of the game separately from later parts
of the game, which allows for finer abstraction in each segment than would be
possible in the game as a whole, but from the perspective of the entire game, this
method can give away information and blending the phases together can be
problematic. The second phase could also be solved in real time. Player beliefs are
updated using Bayes’ rules based on the cards and actions observed in the first phase,
before entering the second phase. Specific phases could also be created based on
isolated parts of the game to create finer abstractions just for that part, which has
showed improved performance in practice, although opens the player up to being
exploited further himself.

**Imperfect recall abstractions** are when the player “forgets” previous observations and
uses information based only on specific parts of the history, or even on no history at
all. This assumption is therefore not very applicable to real life, although in real life
the true memory does not remember all of the historical observations and actions like
in perfect recall abstractions. Imperfect recall therefore places more emphasis on
recent information, which can be done by using fewer buckets on earlier rounds or by
forgetting all prior rounds except for the current. This makes it possible to reduce the
granularity at the current betting round, perhaps by adding more buckets into the
current round and allows for the use of domain knowledge to make use of the specific
pieces of information that are deemed most useful at any strategic position. This
method removes theoretical guarantees in CFR, but has been shown to bring
significant advantages in no limit hold’em games, perhaps because having high 
granularity at late betting rounds can be crucial, especially when the all-in bet can put
so many chips at risk.

Strategies computed in fine-grained abstractions can be worse when evaluated in the
original game than those computed in a strictly coarser abstraction. This can happen
because we assume that our opponent plays within the restricted strategy set that the
abstraction model gives him, but he may use a strategy that falls outside of our
abstract model. In general, experience suggests that finer-grained abstractions play
better against other programs and have lower exploitability.

There are three main methods to compare abstraction solutions to poker games: one on one (against either another agent or a human), versus equilibrium, and versus best
response. Respectively, the possible problems possible are intransitivities, infeasible
computation, and not being well correlated with best performance. Abstractions can
also be measured based on their ability to estimate the true value of the game. 

#### Action Translation
A reverse mapping, also known as action translation, is used to map actions in the
original game, where all actions are possible, to an action in the abstracted model.
This is necessary because opponents can take actions in the full game that have been
removed from the abstracted model. Clever bet sizing can render the most basic
mappings highly exploitable. An intelligent model is needed to handle these
situations. The basic model works by mapping an observed action a of the opponent
to an action a' that exists in the abstracted model, and then responding to the action as
if the opponent had played a'.

Prior to Ganzfriend and Sandholm's solution, most mappings were exploitable and based
on heuristics, not theory.

Assume the following model:
The opponent bets x, an element of [A, B], where A is the largest betting size in the
abstraction that is ≤ x and B is the smallest betting size in the abstraction that is ≥ x,
assuming 0 ≤ A < B.

The question is where to match (and therefore respond to) the bet x as if it were A or
B. f_{A,B}(x) is the probability that we map x to A and the goal is to minimize  exploitability. The following basic desiderata properties are given for all action
mappings in poker:

1. If an opponent bets an action in our abstraction, then x should be matched to
that bet size with probability 1, eg f(A) = 1 and f(B) = 0.
2. The probability mapping to A should decrease as x moves closer to B
3. Scale invariance: scaling A, B, and x by some multiplicative factor k > 0 does
not affect the action mapping
4. Action robustness such that f changes smoothly in x, avoiding any sudden
changes that could result in exploitability
5. Boundary robustness such that f changes smoothly with A and B

Sandholm proposes the following mapping to meet the above properties and with
theoretical justification based on a small toy game called the clairvoyance game,
found in the book The Mathematics of Poker. The game works as follows:

- Player P2 is given no private cards
- Player P1 is given a single card drawn from a distribution of half winning and half losing hands
- Both players start with n chips
- Both players ante $0.50, so the starting pot is $1
- P1 acts first and can bet any amount x ∈ [0, n]
- P2 responds by calling or folding (no raising is allowed and a bet of 0 simply
results in a showdown)

The solution of this game was found to be:
- P1 bets n with probability 1 with a winning hand
- P1 bets n with probability n/(1+n) with a losing hand (otherwise checks, with
probability 1/(1+n))
- P2 calls a bet of size x ∈ [0, n] with probability 1/(1+x)


This motivates the proposed action translation mapping of:
f_{A,B}(x) * 1/(1+A) + (1-f_{A,B}(x))*1/(1+B) = 1/(1+x)

Which can be solved to find the mapping:
f_{A,B}(x) = (B-x)(1+A)/((B-A)(1+x))

This mapping is the only one consistent with player 2 calling a bet size of size x with
probability 1/(1+x) for all x ∈ [A, B].

This mapping exhibited less exploitability than prior mappings in almost all cases,
based on test games such as Leduc Hold’em and Kuhn Poker. In Kuhn Poker, an
interesting phenomenon was discovered – that fitting an action betting abstraction to a
known equilibrium strategy could actually result in the agent being more exploitable.
The optimal bet size was found to vary significantly as different stack sizes and
mappings were used.

This means that the optimal action abstraction to use could vary depending on the
action translation mapping used. It may be important to use action abstractions that
are a combination of optimal offensive actions used by the agent itself and defensive
actions that are used by opponents and are necessary to reduce exploitability. It may
be even better to use game specific information in determining abstraction or to use
different mappings at different information sets.