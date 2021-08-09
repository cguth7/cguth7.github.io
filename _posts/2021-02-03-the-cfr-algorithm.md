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
