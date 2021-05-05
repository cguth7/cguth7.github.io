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

## Definitions
When we talk about a solution to a poker game, we mean playing the game theory optimal strategy. In small toy games, these strategies are relatively easy to find. In 1v1 Limit Texas Hold'em a very close approximation of this strategy [was computed in 2015 at the University of Alberta](https://science.sciencemag.org/content/347/6218/145). In commonly played games like 1v1 No Limit Texas Hold'em and multiplayer No Limit Texas Hold'em, no complete game theory optimal strategies exist...yet. 

Approximations exist even for these larger games and as AI continues to improve and computing power increases and as humans study more, AI and humans will both get gradually closer to optimal, but for now 

### Measuring Closeness to GTO
There are two main ways to measure how good a strategy is: 
1) We can look at a given strategy against the "best response" strategy, which is the strategy that maximally exploits the given strategy (i.e. how well can someone do against you if they know your exact strategy)
2) We can look at a given strategy against an actual game theory optimal strategy

## Why the GTO Strategy? 

## Solving Methods

## Indifference

## Solving Programs
Solver programs like [PioSOLVER](https://www.piosolver.com/) or [Monker Solver](https://monkerware.com/solver.html) let users set up a betting tree with user-defined betting abstractions and then solve for optimal solutions within this abstracted game. 

Use to learn important lessons/strategies, but not full (couldn't remember anyway)
can make simplifications like always doing something instead of 90% or trends for certain board types/situations
makes more sense to compile approx strategies for different situations than expect to have some grand GTO strategy 

The betting abstraction could be something like allowing only the minimum bet, 0.25 pot bet, 0.75 pot bet, and 1.25 pot bet. The self-play algorithm then simulates the game from the tree and finds an equilibrium strategy, i.e. strategies such that neither player can exploit the other. Solvers are very dependent on good user input because abstractions that make the game too large will take too long to solve and abstractions that make the game too small or that are not representative of true optimal strategy could result in poor results. 

### Monker Solver Example

### "GTO" Strategies for Sale 

### EV of going allin
https://poker.stackexchange.com/q/78/88
MDF etc
hand combinations