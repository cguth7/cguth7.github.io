---
title: "AIPT Section 3.3: Solving Poker -- Using Solvers"
date: 2021-02-03
sidebar:
  nav: "nav"
toc: true
toc_sticky: true
toc_label: "TOC"
author_profile: false
---
# Solving Poker -- Using Solvers

## Solving Programs
Solver programs like [PioSOLVER](https://www.piosolver.com/) or [Monker Solver](https://monkerware.com/solver.html) let users set up a betting tree with user-defined betting abstractions and then solve for optimal solutions within this abstracted game. In this sense, the solver is not solving the game in the sense of a full strategy, but rather for this specific situation and inputs, including bet sizes, starting stacks, and hand ranges. 

The betting abstraction could be something like allowing only the minimum bet, 0.25 pot bet, 0.75 pot bet, and 1.25 pot bet. The self-play algorithm then simulates the game from the tree and finds an equilibrium strategy (i.e., strategies such that neither player can exploit the other). Solvers are very dependent on good user input because abstractions that make the game too large will take too long to solve and abstractions that make the game too small or that are not representative of true optimal strategy could result in poor results. For example, if the abstraction allows for tiny bet sizes and doesn't allow for large raises, then tiny bet sizes will seem appealing because they would not entail much risk to the bettor. 

These programs are valuable for learning important lessons/strategies in poker. It's completely unrealistic to learn a full game theory optimal strategy, but one can study a lot of different situations and come away with important principles/trends that correspond to certain board types and situations. 

### "GTO" Strategies for Sale 
There are many "GTO" strategies that are sold online, often in the form of preflop charts that tell you what to do given a position at the table and stack size. Running these GTO calculations on a standard computer with many players at the table can be very resource intensive and time consuming, so people who have access to high-powered computers have run these situations through solvers and compiled the results in order to sell them. The thing about these results is that solvers are very sensitive to their inputs and multiplayer GTO results are less well defined and playing strictly GTO is not always the best in real game situations. Also in tournaments there are additional considerations regarding the prize pool that can't show up in a standard strategy chart. 

Therefore using these charts may be useful as a baseline, but you should use caution when using these charts because they can give a false sense of invincibility that could (a) be actually wrong and (b) could be not optimal for the actual situation at the table. 

## Using Solvers
Given certain inputs to a solver as described above, the solver outputs the strategy for a range of hands and the various bet options available. The solver effectively assumes that both players know each other's strategy and finds the optimal EV maximizing strategy. 

Solvers can be used to try to generalize a specific situation that comes up frequently and that seems tricky or they can be used to find the optimal play in a specific hand that you've seen or played. 

Solver outputs often have very complex strategies that might look like, for example, betting half the pot 30% of the time, betting pot 65% of the time, and checking 5% of the time in some particular situation. In practice, this would be very hard to implement, so it makes sense to try to simplify the strategies by for example betting half the pot a third of the time and pot two thirds of the time and ignoring the check. 

Of course just because a play is game theory optimal according to a solver doesn't mean it's the best play in game, but having this foundation is very useful. Solvers also allow you to lock opponent nodes to fix their hand range, which is useful to compare to the GTO solution to see how the exploitative strategy differs. 

A valuable way to use solvers is if you have access to the approximate strategy of a population of players from your database. When you encounter a certain situation, you can lock their play to match that range of hands and then see what the maximally exploitative play is according to the solver output. 

For example, you could analyze a situation where the flop has three cards to a flush, look up all of these situations in your database, and see what percentage of hands people are folding on average. This is an oversimplification because three flush boards can very considerably (789 might get fewer folds than T52 since it's more connected) and also it's of course considering a population tendency and not an individual player exploitation. But this can work as an approximation and you can study this situation in terms of GTO tendencies to see how frequently players should call or fold this flop and then also how the population plays by node locking this percentage of hands. If they are folding too much, then you can see how many more hands you should be betting in this spot. 

Another example is if you call a raise preflop from the blinds against a button player, you can look at your database for how often the button player bets the flop on a certain type of board. If the average player in your database is betting here more than the GTO strategy, then you can learn how to modify your own strategy away from GTO to exploit these players, probably by calling or check raising more. 

As I've warned in earlier sections, the risk in exploiting opponents is that you are no longer playing the GTO strategy and put yourself at risk, but by capitalizing on these kinds of slight deviations from GTO play, you might be able to see a significant boost in win rate.

<!-- imbalanced strategy to get to point -->