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
2. Software that could run expected value simulations with decision trees. You could provide rule-based strategies at each node in a decision tree and the software would compute which hands were profitable, like calculating which hands could be shoved all-in from the small blind against the big blind if the big blind were calling with a fixed set of hands. This is sort of like the first step in finding an equilibrium, which would entail each player's strategy getting modified after each subsequent round until an equilibrium was found. But if for example it was known that a specific player or population of players tended to play a certain strategy, there could be a lot of value in finding optimal exploitative counter strategies to them. 
3. Solving toy poker games and applying lessons from these games into full games of poker. A lot of important lessons about balance and how to split up a hand range into different actions like betting for value and betting as a bluff were derived from looking at solutions to simple toy games and extrapolating them into full poker environments. 
4. Using "solver" software that can actually solve for the GTO play given a specfic situation. Commercial solver software is arguably the most important development in poker over the last decade. The software lets you specify a game tree, generally with highly abstracted bet options (e.g. ~5 total bet options instead of being able to bet any integer or even any amount down to the cent) and then provides a full solution for that situation, which shows exactly how to play each hand in your range of hands. 

For this entire time, statistical software that players can use to analyze their own hands and the population of players that they have played against has also been essentially mandatory for serious players (although some sites now don't allow saving hand histories and some sites use anonymous names so individual opponents cannot be analyzed). This software is super valuable for "leak finding" by running reports and evaluating one's own play, both on specific important hands and on trends like "folding too much to bets on the turn card". The software also has a "heads up display" or HUD that shows up on screen while playing with important statistics about opponents like how often they voluntarily play hands, how often they raise preflop, how often they 3-bet preflop, and many more. 

Approximations exist even for larger games and as AI continues to improve and computing power increases and as humans study more, AI and humans will both get gradually closer to optimal, but for now, we rely on abstractions and approximations for larger games. 

### Measuring Closeness to GTO
There are two main ways to measure how good a strategy is, not including playing against humans or other computer agents (which can measure agent quality, but not closeness to GTO): 

1) We can look at a given strategy against the "best response" strategy, which is the strategy that maximally exploits the given strategy (i.e. how well can someone do against you if they know your exact strategy). This shows the maximum that your strategy would lose in expectation against such an opponent. Note that a game is in Nash equilibrium if and only if all players are playing best responses to what the other players are doing. 

2) We can look at a given strategy against an actual game theory optimal strategy and then evaluate based on how well it performs against the true GTO agent. 

## Why the GTO Strategy? 
GTO makes sense as a formalized way to solve a game because it can't be beaten! But what if you are playing against a very bad player and a non-GTO strategy would be much stronger? In some sense the GTO strategy is not optimal in this situation, but we distinguish between a GTO strategy and an exploitative optimal strategy. By definition, solving a game makes sense to use the game theory optimal strategy because the exploitative optimal strategy is far less robust and while it may be more profitable against certain players, could be far less profitable against other players. So while a best response is the actual optimal strategy for a certain situation, it can't be generalized in the way that GTO can be. 

## Solving Methods
Generally algorithms and commercial programs are built around Counterfactual Regret Minimization (CFR), which is described in Section 4.1. In short, it works by playing the game against itself repeatedly and eventually combing to an equilibrium strategy, similarly to how two humans might play each other repeatedly and start off with some default strategy in mind, but then may reach some sort of equilibrium as they re-optimize based on the opponent strategy. 

<!-- ## Indifference -->

## Solving Programs
Solver programs like [PioSOLVER](https://www.piosolver.com/) or [Monker Solver](https://monkerware.com/solver.html) let users set up a betting tree with user-defined betting abstractions and then solve for optimal solutions within this abstracted game. 

The betting abstraction could be something like allowing only the minimum bet, 0.25 pot bet, 0.75 pot bet, and 1.25 pot bet. The self-play algorithm then simulates the game from the tree and finds an equilibrium strategy (i.e., strategies such that neither player can exploit the other). Solvers are very dependent on good user input because abstractions that make the game too large will take too long to solve and abstractions that make the game too small or that are not representative of true optimal strategy could result in poor results. For example, if the abstraction allows for tiny bet sizes and doesn't allow for large raises, then tiny bet sizes will seem appealing because they would not entail much risk to the bettor. 

These programs are valuable for learning important lessons/strategies in poker. It's completely unrealistic to learn a full game theory optimal strategy, but one can study a lot of different situations and come away with important principles/trends that correspond to certain board types and situations. 

### "GTO" Strategies for Sale 
There are many "GTO" strategies that are sold online, often in the form of preflop charts that tell you what to do given a position at the table and stack size. Running these GTO calculations on a standard computer with many players at the table can be very resource intensive and time consuming, so people who have access to high-powered computers have run these situations through solvers and compiled the results in order to sell them. The thing about these results is that solvers are very sensitive to their inputs and multiplayer GTO results are less well defined and playing strictly GTO is not always the best in real game situations. Also in tournaments there are additional considerations regarding the prize pool that can't show up in a standard strategy chart. 

Therefore using these charts may be useful as a baseline, but you should use caution when using these charts because they can give a false sense of invincibility that could (a) be actually wrong and (b) could be not optimal for the actual situation at the table. 

# Useful Poker Math
Standard poker games are played with a 52 card deck with four cards of each value and 13 cards of each suit. 

## Computing Equities
Equity is the odds of you winning the pot. If there were no additional cards to come, then the player with the better hand would have 100% equity and the player with the worse hand would have 0% equity since those odds would be fixed. Assuming that we have two players and one has a stronger hand, the player with the weaker hand needs a certain number of "outs", or cards to improve their hand. 

For example, if the board is A562 and one player has AK and one player has 87, the player with 87 has an open ended straight draw and needs either a 9 (for the 56789 straight) or 4 (for the 45678 straight) to win. Since there are four each of card 9 and card 4, the player has eight total outs to win. 

We've seen 4 + 2 + 2 = 8 total cards so far (four community cards on the board and two hole cards for each player), which means there are 52-8 = 44 cars left in the deck. The player with the straight draw has 8 outs of the 44 cards so 8/44 = 18% chance of winning. 

The equity is computed as chance of winning * size of pot, so if the pot was $X, the straight draw player would have 0.18*x equity and the other player would have (1-0.18)*x = 0.82*x equity. So with a $100 pot, the players would have $18 and $82 equity. 

In this case the player could be certain that completing the straight would result in a win, but sometimes this isn't the case so you have to be cautious! For example, a player with a 3 on the A562 board could hit a 4 for a straight, but would then still be losing to a player with 87! Equities can be clearly computed when all cards are known, but in a real game situation, each player has to approximate which cards (outs) are helpful. In the straight example above this is pretty straightforward, but for example if the board was 456Q and you held A7, you could be confident that a 3, 8, or A would give you the best hand, but in each case you could still be losing! Someone could have 87 and beat you if the 3 comes, someone could have 79 and beat you if the 8 comes, and someone could have a huge number of things that would beat a single pair of Aces. 

## Computing the Expected Value of an Allin
A valuable exercise in understanding poker math is to compute the expected value of going allin in a one versus one setting. Let's once again take a look at the situation of small blind vs. big blind. We'll use \\$1 and \\$2 blinds for simplicity. So the small blind posts $1 and the big blind posts $2 and now the small blind can either go allin or fold. Let's assume that both players start the hand with \\$40, again for simplicity. Note that if one player started with more than the other, only the smaller stack matters (e.g. if the big blind had more money, they would only have to call \\$40 to match the bet, so any additional money over the minimum player's stack size is disregarded). 

There are 3 scenarios that can occur here: 
1. The small blind folds
2. The small blind goes allin and the big blind folds
3. The small blind goes allin and the big blind calls

Let's think about the expected value from the perspective of the small blind allin player. 

Case 1: Small blind folds and the EV is 0. This is because we compute the EV from the point of the allin, so even though the small blind posted a \\$1 blind, this is a "sunk" cost and is not used in computations. 

Case 2: Small blind allin and gains the entire \\$3 pot, so the EV is +\\$3. 

Case 3: When the small blind is allin and wins the pot, the win is all of the $80 chips. When the small blind is allin and loses the pot, the loss is the additional $39 bet for the allin. Combining these, the EV = (win %)*(80) + (lose %)*39. Note that the win is the amount you get back from the pot when you go allin and win and loss is the amount that goes in with the allin action. 

Putting this all together, we have EV = (opponent fold %)*3 + (1- opponent fold %)*((win %)*(80) + (lose %)*39)

Written more generally, we have EV = (opponent fold %)*(pot size before allin) * (1 - opponent fold %)*((win %)*(total pot size after allin) + (lose %)*(allin bet size put at risk))

## Pot Odds
Pot odds means the ratio between the size of the pot and the size of a bet. Continuing with the above example, if the small blind goes allin then the big blind sees a pot of $42 (the small blind's $40 + his $2 big blind) and has to call $38 more, so their odds are 42:38. This can be converted to a percentage by taking 38/(38+42) = 38/80 = 47.5%. Note that this is the size of the call divided by the size of the pot if we were to make the call. We can interpret this as the odds needed to win -- the big blind needs to have at least 47.5% equity to make a profitable call. (Note that if this was a regular (non all-in) bet then there would be additional action on the hand, which we will discuss in the below Implied Odds section.)

Pot odds are super important when deciding whether or not to make a call in poker and it's important to be able to calculate an approximation on the fly in your head when playing. 

We use pot odds in conjunction with equity as a factor in deciding whether or not to make a call. In general, if you compute that your equity is higher than your pot odds, then you are making a profitable call. There are important standard pot odds that are useful to memorize -- if an opponent bets half the pot, then pot odds are 25%. If an opponent bets 3/4 of the pot, then pot odds are 43%. A bet of full pot gives pot odds of 50% and a bet of 2x the pot gives pot odds of 67%. This intuitively makes sense -- when facing lower bets as a percentage of the pot, we need lower odds to make the call because we have less at risk relative to what we can gain. This is something to think about when betting as well to manipulate the pot odds that your opponent is getting -- for example betting larger can protect a made hand against a posssible drawing hand. 

Pot odds are especially useful in the context of catching a bluff since when we have a very strong or very weak hand, we would probably be considering more options than just calling and folding. 

## Implied Odds
Pot odds simplify things by considering only the immediate odds of the poker situation. Implied odds takes into account the chips that you could win in addition to the current pot. The typical example for this is that if someone bets the pot on the flop and you have a flush draw, you're getting 50% pot odds and just a flush draw will not have 50% odds -- more like 35%. However, when you do make that flush, you can expect on average to win additional money. Beware of reverse implied odds, which refers to losing more than the immediate pot, like if you are drawing to a very small flush, hitting that could be big trouble if an opponent has a higher flush. 

When you have good implied odds, it can make sense to call without the correct pot odds. If you don't think you'll make more money in later betting rounds, then you have low implied odds and it probably doesn't make sense to call a bet unless you have the correct pot odds. 

We can compute the additional money needed to win on later streets assuming that we can estimate our equity in the hand. This is the same computation as before for pot odds, but with the denominator adding a variable that represents what we would need to win on later streets. 

So if the pot is $100 and the opponent bet $50, the standard pot odds would be 50/(150+50) = 0.25. Assuming that it's possible to win $x more on later streets, we could compute 50/(150+50+x) = equity. Assuming that we have 0.2 equity, that means that we'd have 50/(150+50+x) = 0.2, so 50 = 40 + 0.2x and 50 = x. So if our equity was 0.2, we'd have to win an extra $50 in later streets to make calling now breakeven. 

## Minimum Defense Frequency
Minimum defense frequency is related to pot odds and shows the percentage of hands you must continue with -- if you continue with less than this then your opponent can always bluff and be profitable! 

To calculate minimum defense frequency (MDF), we have (pot size)/(pot size + bet size). Recall that pot odds is (bet size)/(pot size + bet size + call size). Suppose that we are in a pot of $100 on the river in Texas Hold'em and the opponent bets $50. This means that our MDF is 100/(100+50) = 0.67. The pot odds are 50/(100+50+50) = 0.25. In words, the MDF means that we should be continuing with at least 67% of hands and the pot odds means that we should have at least 25% equity to call.  

So if you fold more often than the MDF then your opponent can exploit you by over-bluffing. However, going by MDF means attempting to be unexploitable, but if your opponent is a new player and never bluffing, then that kind of specific knowledge (read) may be more useful. In general, MDF is useful to keep in mind and to try to optimize hand ranges to get a feel for which hands in your range you should be calling with and is useful as a theoretical concept, but may not be good to use in specific scenarios like exploiting an opponent who bluffs too much or too little or when it's very unlikely that an opponent can actually be bluffing and your hand isn't good enough to beat anything but bluffs. 

Pot odds, on the other hand, especially on the river (or final bet like an allin) are strictly applicable to the situation and if you determine that your equity is higher than the pot odds then you should call! 

## Hand Combinations
Hand combinations are the math behind how likely hands are in poker. As we know, there are 52 cards in a deck with 13 cards of each suit and 4 cards of each type (rank). We can compute 52c2 as 52!/(50!*2!) = 52*51/2 = 1326 combinations of 2-card starting hands. 

Each non-paired hand has 4*4 = 16 combinations of which 12 are offsuit (each card a different suit) and four are suited (both cards the same suit). The four suited combinations comes from the four suits in the deck, so one suited combination of each suit. 

Finally, there are 4c2 = 4!/(2!*2!) = 4*3/2 = 6 combinations of paired cards. We get this because pairs cannot be of the same suit, so this is all of the combinations to 

<!-- ## ICM -->