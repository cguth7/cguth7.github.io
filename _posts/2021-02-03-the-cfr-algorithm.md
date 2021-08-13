---
title: "AIPT Section 4.1: CFR -- The CFR Algorithm"
date: 2021-02-03
sidebar:
  nav: "nav"
toc: true
toc_sticky: true
toc_label: "TOC"
author_profile: false
---

<!-- 
TODO: 
1) Review my thesis
2) Iteration automation/visualization, maybe with Winston (what about interpretabilitu)
3) Coding simple both with (a) basic input, (b) response to opponent, (c) CFR, (d) advanced CFR
4) Minimization explanation
5) https://pypi.org/project/PokerRL/, https://xscode.com/tansey/pycfr, https://github.com/tansey/pycfr, https://rlcard.org/index.html, https://github.com/datamllab/rlcard, https://towardsdatascience.com/rlcard-building-your-own-poker-ai-in-3-steps-398aa864a0db, https://github.com/paul-chelarescu/counterfactual-regret-minimization, https://github.com/DabeLong/Two-Card-Poker-CFR-AI/blob/master/cfr.py, https://github.com/int8?tab=repositories 
-->

# CFR - The CFR Algorithm 
The Counterfactual Regret Minimization (CFR) algorithm was first published in a 2007 paper from the University of Alberta by Martin Zinkevich et al. called "[Regret Minimization in Games with Incomplete Information](https://poker.cs.ualberta.ca/publications/NIPS07-cfr.pdf)". 

## TLDR Explanation
CFR is a self-play algorithm that learns by playing against itself repeatedly. It starts play with a uniform random strategy (each action at each decision point is equally likely).  

![Kuhn Poker Tree](../assets/section4/cfr/infoset.jpg "Kuhn Poker Tree")

At each information set in the game tree, the algorithm keeps a counter of regret values for each possible action. The regret means how much better the agent would have done if it had always played that action rather than the actual strategy that could be a mixture of actions. Positive regret means we should have taken that action more and negative regret means we would have done better by not taking that action. 

For example, if the agent was playing a game in which it had 5 action options at a certain game state and Action 1 had a value of 3 while the game state average over all 5 actions was 1, then the regret would be 3-1 = 2. This means that Action 1 was better than average and we should favor taking that action more. 

*Regret updates are weighted by the other agent probability of taking you to a decision point

The CFR algorithm updates the strategy after each iteration to play in proportion to the regrets, meaning that if an action did well in the past, the agent would be more likely to play it in the future. 

The final Nash equilibrium strategy is the average strategy over each iteration. This strategy can do no worse than tie in expectation and is considered optimal since it's unbeatable in expectation. This is what we mean when we say "solve" a poker game. 

## Detailed Intuitive Explanation
Michael Johanson, one of the authors on the original paper, gave his intuitive explanation of CFR in a [post on Quora](https://www.quora.com/What-is-an-intuitive-explanation-of-counterfactual-regret-minimization). 


## The Algorithm
Due to the constraints of solving imperfect information games with MCTS and the memory limits and zero-sum/perfect recall requirements of solving games with linear programs, CFR was developed as a novel solution. CFR also benefits from being computationally cheap, doesn’t require parameter tuning, and pruning can be used. It is an iterative Nash equilibrium approximation method that works through the process of repeated self-play between two regret minimizing algorithms.

CFR is an extension of regret minimization into sequential games, where players play a sequence of actions to reach a terminal game state. Instead of storing and minimizing regret for the exponential number of strategies, CFR stores and minimizes a regret for each information set and subsequent action, which can be used to form an upper bound on the regret for any deterministic strategy. This means that we must also consider the probabilities of reaching each information set given the players’ strategies, as well as passing forward game state information and probabilities of
player actions, and passing backward utility information through the game information states. The algorithm is required only to store a strategy and regret value for each node and each action at each node, such that the space requirement is on the order O(|I|), where |I| is the number of information sets in the game.

CFR is an offline self-play algorithm, as it learns to play by repeatedly playing against itself. It begins with a strategy that is completely uniformly random and adjusts the strategy each iteration using regret matching such that the strategy at each node is proportional to the regrets for each action. The regrets are, as explained previously, measures of how the current strategy would have performed compared to a fixed strategy of always taking one particular action. Positive regret means that we would have done better by taking that action more often and negative regret means that we would have done better by not taking that action at all. The average strategy is then shown to approach a Nash equilibrium in the long run.

In the vanilla CFR algorithm, each iteration involves passing through every node in the extensive form of the game. Each pass evaluates strategies for both players by using regret matching, based on the prior cumulative regrets at each player’s information sets. Before looking at the CFR equations, we will provide some definitions.

We will refresh some definitions that were given in previous sections here when they
are relevant to the forthcoming equations.

Let A denote the set of all game actions. We refer to a strategy profile that excludes
player i’s strategy as sigma_(-i). A history h is a sequence of actions, including chance
outcomes, starting from the root of the game. Let pi^(sigma)(h) be the reach probability of
game history h with strategy profile sigma and pi^sigma(h,z) be the reach probability that
begins at h and ends at z. 

Let Z denote the set of all terminal game histories and then we have h ⊏ z for z ∈ Z is
a nonterminal game history. Let u_i(z) denote the utility to player i of terminal history
z.

We can now define the counterfactual value at nonterminal history h as follows:
v_i(sigma, h) = sum (z in Z),h ⊏ z of pi^sigma_(-i)*pi^sigma(h,z)*u_i(z)

This is the expected utility to player i of reaching nonterminal history h and taking
action a under the counterfactual assumption that player i takes actions to do so, but
otherwise player i and all other players follow the strategy profile sigma.

The counterfactual value takes a player’s strategy and history and returns a value that
is the product of the reach probability of the opponent to arrive to that history and the
expected value of the player for all possible terminal histories from that point. This is
counterfactual because we ignore the probabilities that factually came into player i’s
play to reach position h, which means that he is not biasing his future strategy with his
current strategy. This weights the regrets by how often nature (factors outside the
player’s control, including chance and opponents) reach this information state.

An information set is a group of histories that a player cannot distinguish between.
Let I denote an information set and let A(I) denote the set of legal actions for
information set I. Let sigma_(I-->a) denote a profile equivalent to sigma, except that action a is
always chosen at information set I. The counterfactual regret of not taking action a at
history h is defined as:

r(h,a) = v_i(sigma_(i-->a),h) - v_i(sigma, h)

This is the difference between the value when always selecting action a at the history
node and the value of the history node itself (which will be defined in more detail shortly). 

Let pi^sigma(I) be the probability of reaching information set I through all possible game
histories in I. Therefore we have that pi^sigma(I) = sum h∈I pi^sigma(h). The counterfactual reach
probability of information state I, p^sigma_(-i)(I), is the probability of reaching I with strategy
profile sigma except that, we treat current player I actions to reach the state as having probability 1. 

The counterfactual regret of not taking action a at information set I is:
r(I,a) = sum h∈I r(h,a)

This calculation simply includes all histories in the information set.

Let t and T denote time steps, where t is with respect to each fixed information set and
is incremented with each visit to an information set. A strategy sigma^t_i for player i maps
each player i information set I_i and legal player i action a∈A(I_i) to the probability
that the player will choose a in I_i at time t. All player strategies together at time t form
a strategy profile sigma^t, to be detailed shortly.

If we define r^t_i(I,a) as the regret when players use sigma_t of not taking action a at
information set I belonging to player i, then we can define the cumulative
counterfactual regret as follows, which is the summation over all time steps:

R^T_i(I,a) = sum t=1 to T r^t_i(I,a)

In recent years, researchers have redefined the counterfactual value in terms of
information sets. This formulation shows the counterfactual value for a particular
information set and action, given a player and his strategy:

We see that this is similar to (2.13), but has some differences. Because we are now
calculating the value for an information set, we must sum over all of the relevant
histories. The inner summation adds all possible leaf nodes that can be reached from
the current history (same as (2.13)) and the outer summation adds all histories that are
part of the current information set.
From left to right, the three terms on the right hand side represent the main player’s
utility at the leaf node �, the opponent and chance combined reach probability for the
leaf node �, and the reach probability of the main player to go from the current history
to the leaf node �, while always taking action �. The differences between this
formulation and that of (2.13) will be reconciled with the next equation. 
44
The counterfactual regret of player � for action � at information set � can be written as
follows:

This formulation combines (2.16), (2.15), and (2.14), where (2.16) had introduced the
cumulative summation, (2.15) added all histories in the information set, and (2.20)
defined the counterfactual regret difference equation. The first part of the difference
in (2.18) computes this value for the given a value, while the second part computes
the expected value of all other a value options at the information set (this was not
written as explicitly in (2.14)).
The inner summation of this part of (2.24) is over all non-a strategies and the outer
summation is over all times. The first term in the summations computes the
counterfactual value for each non-a strategy and the second term multiplies the
counterfactual value by the player’s probability of playing that particular strategy at
the given information set.
We can show the regret-matching algorithm by first defining the nonnegative
counterfactual regret as �!
!. 

Now we can use the
cumulative regrets to obtain the strategy decision for the next iteration using regret
matching: 
This regret matching formula calculates the action probabilities for each action at each
information set in proportion to the positive cumulative regrets. First we check to see
if the cumulative regrets at the previous time step are positive. If not, the strategy is
set to be uniformly random, determined by the number of available actions. If it is,
then the strategy is the ratio of the cumulative regret of the defined action over the
sum of the cumulative regrets of all other actions. 
45
The CFR algorithm works by taking these action probabilities and then producing the
next state in the game and computing the utilities of each action recursively. Regrets
are computed from the returned values and the value of playing to the current node is
then computed and returned. Regrets are updated at the end of each iteration. 

CFR is an iterative algorithm that approximates a Nash equilibrium through repeated self-play between two regret-minimizing agents. 

Regret is the difference between the outcome of a specific action at a specific game state compared to the average value of that game state. 

A regret-minimizing algorithm guarantees that its regret grows sub-linearly over time and eventually reaches the same utility as the best deterministic strategy. 

By storing regrets for each information set and its actions instead of 

Counterfactual value of player i taking action a at information set I: 
$$ v_i^\sigma{}(I,a) = \sum{\sum{u_i(z)\pi_{-i}^\sigma{}(z)pi_i^{\sigma{}:I->a}(h,z)} $$

In words, this is the expected utility to player i of reaching information set I and taking action a, under the counterfactual assumption that player i takes actions to do so, but otherwise player i and all other players follow the strategy profile $$ \sigma{} $$

Vanilla
.Pass forward probabilities and game states then pass back utility values
Counterfactual regret (computed for each action at each info set):
Counterfactual value:
full tree traversal for each iteration 
Minimize regret at each information set over time → overall regret also minimized (Zinkevich, 2007)
Memory Cost: 2 doubles per Action-at-Decision-Point (16 bytes)
Can solve up to 10^12
Learn strategy offline and maintain fixed strategy


Why average strategy?
Initial exploitability drops very quickly → Removes dominated and iteratively dominated actions
Strategy starts to cycle around space of “reasonable” strategies with small adjustments 
RPS example: Opponent playing too much Rock, we should move towards 100% paper (moving towards best response to their strategy, i.e., the goal of regret minimization)
Current strategy can be mixed (starts off random uniform), but gets updated to maximize exploiting opponents and tends to cycle between pure-ish strategies
RPS example: We move to 100% paper, opponent moves to 100% scissors, we move to 100% rock, etc.
Average strategy therefore would be around ⅓ each, but current strategy could be very different
While the current strategy is bouncing around strategy space without stopping at equilibrium, the average strategy cycles in closer and closer, converging towards an equilibrium point.
Although some research teams have used the final strategy with good results

### Definitions
Let A denote the set of all game actions. We refer to a strategy profile that excludes
player i’s strategy as $$\sigma_{-i}$$. A history $$h$$ is a sequence of actions, including chance outcomes, starting from the root of the game. Let $$\pi^\sigma(h)$$ be the reach probability of game history $h$ with strategy profile $$\sigma$$ and $$\pi^\sigma(h,z)$$ be the reach probability that begins at $$h$$ and ends at $$z$$. 

Let Z denote the set of all terminal game histories and then we have $$h \sqsubset z$$ for $$z \in Z$$ is a nonterminal game history. Let $$u_i(z)$$ denote the utility to player $$i$$ of terminal history $$z$$. 

We can now define the counterfactual value at nonterminal history $$h$$ as follows: 

$$ v_i(\sigma, h) \equiv \sum{u_i(z)\pi_{-i}^\sigma{}(z)pi_i^{\sigma{}:I->a}(h,z) $$

### Vanilla CFR


### Monte Carlo CFR (MCCFR)
Use sampling to trade off between fast/narrow/noisy updates vs slow/broad/precise updates
Outcome sampling single path through tree like RL
Slower than e.g. chance (sample cards, explore whole)

#### External Sampling
Sample chance and the opponent's strategy

#### Chance Sampling 
Sample chance

## Similarities with Reinforcement Learning
In reinforcement learning, agents learn what actions to take in an environment based on the rewards they've seen in the past. 
advantage function in RL, converges in adversarial games with average strategy (if only 1 player like inRK then strategyh would converge to optimal response to the environment)
independent multiarm bandit at each decision poit, learning at the same time
RL terminology, Q-learning

## Going through an Iteration
show how values change over many iterations

## CFR in Code

### Vanilla CFR in Code

### External Sampling CFR in Code
