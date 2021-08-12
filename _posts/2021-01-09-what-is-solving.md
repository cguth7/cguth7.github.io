---
title: "AIPT Section 3.1: Solving Poker -- What is Solving?"
date: 2021-02-03
sidebar:
  nav: "nav"
toc: true
toc_label: "TOC"
author_profile: false
---

# Solving Poker - What is Solving? 
What does it mean to solve a poker game? How can we "solve" a game that seemingly relies so much on psychology, reading opponents, and deception? 

## Definitions
When we talk about a solution to a poker game, we mean playing the game theory optimal (GTO) Nash equilibrium strategy. As discussed in the Game Theory Foundations section, Nash equilibrium is defined as when there is a strategy profile such that no player can unilaterally alter his current strategy to increase his expected utility. The Nash strategies in two-player zero-sum games limit a player's exploitability at the expense of not exploiting weaker opponents, as each player is minimizing his worst-case expected payoff. This means that in expectation, no strategy can do better against a GTO strategy. 

This means balancing one's playing and and thinking about the range of hands that you play in each situation and how you act with each of those hands. The result is play that in theory is minimizing the worst case outcome and in practice (i.e. in real life as a human who can't play a true GTO strategy) is minimizing chances of opponents exploiting or taking advantage of leaks and weaknesses. Humans can think about this as how to play if they had to announce their strategy in advance and give it to the opponent. This seems crazy, but emphasizes the balance of such a strategy where actions attempt to make the opponent indifferent, so even if they know your strategy (they of course don't know your actual cards), they can't take exploit you. 

In small toy games, these strategies are relatively easy to find. In 1v1 Limit Texas Hold'em a very close approximation of this strategy [was computed in 2015 at the University of Alberta](https://science.sciencemag.org/content/347/6218/145). In commonly played games like 1v1 No Limit Texas Hold'em and multiplayer No Limit Texas Hold'em, no complete game theory optimal strategies exist...yet. In multiplayer games, the concept is less clear because of the interactions involved with other players. 

Poker studying has evolved over the last decade or so from: 
1. Using simple odds evaluation software that would literally just show the odds of two or more specific hands given a board (or no board for the preflop odds). I remember being especially surprised the first time I saw how close some odds were for hands that seemed so much better than other hands, like AK vs. AJ or AK vs. 98! 
2. Software that could run expected value simulations with decision trees. You could provide rule-based strategies at each node in a decision tree and the software would compute which hands were profitable, like calculating which hands could be shoved all-in from the small blind against the big blind if the big blind were calling with a fixed set of hands. This is less valuable than 
2. Applying lessons from toy poker games into full poker games. 
3. Using "solver" software that can actually solve for the GTO play given a specfic situation and 

Using Holdem Manager

Approximations exist even for larger games and as AI continues to improve and computing power increases and as humans study more, AI and humans will both get gradually closer to optimal, but for now, we rely on abstractions and approximations for larger games. 


### Measuring Closeness to GTO
There are two main ways to measure how good a strategy is: 

1) We can look at a given strategy against the "best response" strategy, which is the strategy that maximally exploits the given strategy (i.e. how well can someone do against you if they know your exact strategy and hands)

2) We can look at a given strategy against an actual game theory optimal strategy

## Why the GTO Strategy? 
GTO makes sense as a formalized way to solve a game because it can't be beaten! But what if you are playing against a very bad player and a non-GTO strategy would be much stronger? In some sense the GTO strategy is not optimal in this situation, but we distinguish between a GTO strategy and an exploitative optimal strategy. By definition, solving a game makes sense to use the game theory optimal strategy because the exploitative optimal strategy is far less robust and while it may be more profitable against certain players, could be far less profitable against other players. 

## Solving Methods

<!-- ## Indifference -->

## Solving Programs
Solver programs like [PioSOLVER](https://www.piosolver.com/) or [Monker Solver](https://monkerware.com/solver.html) let users set up a betting tree with user-defined betting abstractions and then solve for optimal solutions within this abstracted game. 

The betting abstraction could be something like allowing only the minimum bet, 0.25 pot bet, 0.75 pot bet, and 1.25 pot bet. The self-play algorithm then simulates the game from the tree and finds an equilibrium strategy (i.e., strategies such that neither player can exploit the other). Solvers are very dependent on good user input because abstractions that make the game too large will take too long to solve and abstractions that make the game too small or that are not representative of true optimal strategy could result in poor results. For example, if the abstraction allows for tiny bet sizes and doesn't allow for large raises, then tiny bet sizes will seem appealing because they would not entail much risk to the bettor. 

These programs are valuable for learning important lessons/strategies in poker. It's completely unrealistic to learn a full game theory optimal strategy, but one can study a lot of different situations and come away with important principles/trends that correspond to certain board types and situations. 

### "GTO" Strategies for Sale 
There are many "GTO" strategies that are sold online, often in the form of preflop charts that tell you what to do given a position at the table and stack size. Running these GTO calculations on a standard computer with many players at the table can be very resource intensive and time consuming, so people who have access to high-powered computers have run these situations through solvers and compiled the results. The thing about these results is that solvers are very sensitive to their inputs and multiplayer GTO results are less well defined and playing strictly GTO is not always the best in real game situations. Therefore using these charts may be useful as a baseline, but you should use caution

### EV of going allin
https://poker.stackexchange.com/q/78/88
MDF etc
hand combinations