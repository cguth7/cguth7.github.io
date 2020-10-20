# Game Theory
Let's look at some important game theory concepts before we get into actually solving for poker strategies. 

What does it mean to "solve" a poker game? In the 2-player setting, this means to find a **Nash Equilibrium strategy** (aka GTO strategy) for the game. If both players are playing this strategy, then neither would want to change to a different strategy since neither could do better with any other strategy (assuming that the opponent's strategy stays fixed). 

Intuition for this in poker can be explained using a simple all-in game where one player must either fold or bet all his chips and the second player must either call or fold if the first player bets all the chips. In this scenario, the second player may begin the game with a strategy of calling a low percentage of hands. After seeing the first player go all-in very frequently, he may increase that percentage. This could lead the first player to reduce his all-in percentage. Once the all-in percentage and the call percentage stabilize such that neither player can unilaterally change his strategy to increase his profit, then the equilibrium strategies have been reached.

We can use the ICMIZER program to compute the game theory optimal strategies in a 1v1 setting where both players start the hand with 10 big blinds. In this case, the small blind goes allin 58% of the time and the big blind calls 37% of the time. If either player changed those percentages, then their EV would go down! 

What if the big blind player doesn't feel comfortable calling with weaker hands like K2s and Q9o? The game theoretic solution would not fully take advantage of this opportunity. The **best response strategy** is the one that maximally exploits the opponent by always performing the highest expected value play against their fixed strategy. In general, an exploitative strategy is one that exploits an opponent's non-equilibrium play. In the above example, an exploitative play could be raising with all hands after seeing the opponent calling with a low percentage of hands. However, this strategy can itself be exploited. 

## Normal Form
Normal Form is writing the strategies and game payouts in matrix form. The Player 1 strategies are in the rows and Player 2 strategies are in the columns. The payouts are written in terms of P1, P2. So for example in the Player 1 Action 1 and Player 2 Action 1 slot, we have (10, 2), which represents P1 = 10 and P2 = 2. I.e. if these actions are taken, Player 1 wins 10 units and Player 2 wins 2 units. 

Note that in a 1v1 poker game, the sum of the payouts would be 0 since whatever one player wins, the other loses, which is called a **zero-sum game** (not including the house commission, aka rake).  

Here is a game example:

| P1/2  | Action 1  | Action 2  | Action 3  |
|---|---|---|---|
| Action 1  | 10, 2  | 8, 1  | 3, -1  |
| Action 2  | 5, 8  | 4, 0  | -1, 1  |
| Action 3  | 7, 3  | 5, -1  | 0, 3  |

Given this table, how can we determine the best actions for each player? P1 is represented by the rows and P2 by the columns. 

A dominated strategy is one that is strictly worse than an alternative strategy. We can see that Player 1's strategy of Action 1 dominates Actions 2 and 3 because all of the values are strictly higher for Action 1. Regardless of Player 2's action, Player 1's Action 1 always has better results than Action 2 or 3. 

![Dominated strategies](./assets/aipokertutorial/gametheory/dominatedstrategies.png)

When P2 chooses Action 1, P1 earns 10 with Action 1, 5 with Action 2, and 7 with Action 3
When P2 chooses Action 2, P1 earns 8 with Action 1, 4 with Action 2, and 5 with Action 3
When P2 chooses Action 3, P1 earns 7 with Action 1, 5 with Action 2, and 0 with Action 3

We also see that Action 1 dominates Action 2 for Player 2. Action 1 gets payouts of 2 or 8 or 3 depending on Player 1's action, while Action 2 gets payouts of 1 or 0 or -1, so Action 1 is always superior. 

Action 1 **weakly** dominates Action 3 for Player 2. This means that Action 1 is greater than **or equal** to playing Action 3. In the case that Player 1 plays Action 3, Player 2's Action 1 and Action 3 both result in a payout of 3 units. 

We can eliminate strictly dominated strategies and then arrive at the reduced Normal Form game. Recall that Player 1 would never play Actions 2 or 3 because Action 1 is always better. Similarly, Player 2 would never play Action 2 because Action 1 is always better. 

| P1/2  | Action 1  | Action 3  |
|---|---|---|
| Action 1  | 10, 2  | 3, -1  |

In this case, Player 2 prefers to play Action 1 since 2 > -1, so we have a Nash Equilibrium with both players playing Action 1 100% of the time (also known as a pure strategy) and the payouts will be 10 to Player 1 and 2 to Player 2. The issue with Player 2's Action 1 having a tie with Action 3 when Player 1 played Action 3 was resolved because we now know that Player 1 will never actually play that action. 

| P1/2  | Action 1  |
|---|---|
| Action 1  | 10, 2  |

To summarize, Player 1 always plays Action 1 because it dominates Actions 2 and 3. When Player 1 is always playing Action 1, it only makes sense for Player 2 to also play Action 1 since it gives a payoff of 2 compared to payoffs of 1 and -1 with Actions 2 and 3, respectively. 

Here's one more example of a game. This time with two people who are going to watch something together. P1 has a preference to watch tennis and P2 prefers Power Rangers. If they don't agree, then they won't watch anything and will have payouts of 0. If they do agree, then the person who gets to watch their preferred show has a higher reward than the other, but both are positive. 

| P1/2  | Tennis  | Power Rangers   |
|---|---|---|
| Tennis  | 3, 2  | 0, 0  |
| Power Rangers  | 0, 0  | 2, 3  |

In this case, neither player can eliminate a strategy. For Player 1, if Player 2 chooses Tennis then he also prefers Tennis, but if Player 2 chooses Power Rangers, then he prefers Power Rangers as well (both of these are Nash Equilbrium). This is intuitive because there is 0 value in watching nothing but at least some value if both agree to watch one thing. 

So what is the optimal strategy here? If each player simply picked their preference, then they'd always watch nothing and get 0! If they both always picked their non-preference, then the same thing would happen! We can calculate the optimal strategies like this: 

Let's call P(P1 Tennis) = p and P(P1 Power Rangers) = 1 - p. These represent the probability that Player 1 should select each of these. 

If Player 2 chooses Tennis, Player 2 earns $$ p*(2) + (1-p)*(0) = 2p $$

If Player 2 chooses Power Rangers, Player 2 earns $$ p*(0) + (1-p)*(3) = 3 - 3p $$

We are trying to find a strategy that involves mixing between both options. A fundamental rule is that if you are going to play multiple strategies than the value of each must be the same. Otherwise you would just pick one and stick with that. 

Therefore we can set these probabilities equal to each other, so $$ 2p = 3 - 3p ==> 5p = 3 ==> p = 3/5$$. Therefore $$1 - p = 2/5$$ and Player 1's strategy is to choose Tennis $$3/5$$ and Power Rangers $$2/5$$. This is a mixed strategy equilibrium because there is a probability distribution over which strategy to play. 

By symmetry, P2's strategy is to choose Tennis 2/5 and Power Rangers 3/5.

This means that each player is choosing his/her chosen program 3/5 of the time, while choosing the other option 2/5 of the time. Let's see how the final outcomes look. 

So we have Tennis,Tennis occurring $$3/5 * 2/5 = 6/25$$
Power Rangers, Power Rangers $$2/5 * 3/5 = 6/25$$
Tennis, Power Rangers $$3/5 * 3/5 = 9/25$$
Power Rangers, Tennis $$2/5 * 2/5 = 4/25$$

| P1/2  | Tennis  | Power Rangers   |
|---|---|---|
| Tennis  | 6/25  | 9/25  |
| Power Rangers  | 4/25  | 6/25  |

The average payouts to each player are $$6/25 * (3) + 6/25 * (2) = 30/25 = 1.2$$. This would have been higher if they had avoided the 0,0 payouts! Unfortunately $$9/25 + 4/25 = 13/25$$ of the time, the payouts were 0 to each player. 

What if Player 1 decided to be sneaky and change his strategy to choosing tennis always instead of 3/5 tennis and 2/5 Power Rangers? Remember that there should be no benefit to deviating from a Nash Equilibrium strategy by definition. If he tries this, then we have the following since P1 is never choosing Power Rangers and so the probabilities are determined strictly by P2's strategy of 2/5 tennis and 3/5 Power Rangers: 

| P1/2  | Tennis  | Power Rangers   |
|---|---|---|
| Tennis  | 2/5  | 3/5  |
| Power Rangers  | 0  | 0  |

The Tennis and Power Rangers 3/5 has no payoffs and the Tennis Tennis has a payoff of of $$2/5 * 3 = 6/5 = 1.2$$ for P1. This is the same as the payout he was already getting. However, P2 might catch on to this and then get revenge by pulling the same trick and changing strategy to always selecting Power Rangers, resulting in the following: 

| P1/2  | Tennis  | Power Rangers   |
|---|---|---|
| Tennis  | 0  | 1  |
| Power Rangers  | 0  | 0  |

Now the probability is fully on P1 picking Tennis and P2 picking Power Rangers, and nobody gets anything! 

### Rock Paper Scissors
We can also think about this concept in Rock-Paper-Scissors. Let's define a win as +1, a tie as 0, and a loss as -1. The game matrix for the game is shown below in Normal Form:

| P1/2  | Rock  | Paper  | Scissors  |
|---|---|---|---|
| Rock  | 0, 0  | -1, 1  | 1, -1  |
| Paper  | 1, -1  | 0, 0  | -1, 1  |
| Scissors  | -1, 1  | 1, -1  | 0, 0  |

As usual, Player 1 is the row player and Player 2 is the column player. The payouts are written in terms of P1, P2. So for example P1 Paper and P2 Rock corresponds to a reward of 1 for P1 and -1 for P2 since Paper beats Rock. 

The equilibrium strategy is to play each action with 1/3 probability each. We can see this intuitively because if any player played anything other than this distribution, then you could exploit them by always playing the strategy that beats the strategy that they most favor. For example if someone played rock 50%, paper 25%, and scissors 25%, they are overplaying rock, so you could always play paper and then would win 50% of the time, tie 25% of the time, and lose 25% of the time for an average gain of $$1*0.5 + 0*0.25 + (-1)*0.25 = 0.25$$ each game. 

We can also work it out mathematically. Let P1 play Rock r%, Paper p%, and Scissors s%. The utility of P2 playing Rock is then $$0*(r) + -1 * (p) + 1 * (s)$$. The utility of P2 playing Paper is $$1 * (r) + 0 * (p) + -1 * (s)$$. The utility of P2 playing Scissors is $$-1 * (r) + 1 * (p) + 0 * (s)$$. 

| P1/P2  | Rock 50%  | Paper 25% | Scissors 25% |
|---|---|---|---|
| Rock 0%  | 0  | 0  | 0  | 
| Paper 100%  | 0.5*1 = 1  | 0.25*0 = 0  | 0.25*(-1) = -0.25  | 
| Scissors 0%  | 0  | 0  | 0  |

We can figure out the best strategy with this system of equations (the second equation is because all probabilities must add up to 1):

$$
\begin{cases} -p + s = r - s = -r + p \\ r + p + s = 1  \end{cases}
$$

$$-p + s = r - s ==> 2s = p + r
r - s = - r + p ==> 2r = s + p$$

$$-p + s = -r + p ==> s + r = 2p$$

$$r + s + p = 1
r + s = 1 - p$$

$$1 - p = 2p 
1 = 3p
p = 1/3$$

$$r + s + p = 1
s + p = 1 - r$$

$$1 - r = 2r 
1 = 3r
1/3 = r$$

$$1/3 + 1/3 + s = 1
s = 1/3$$

The equilibrium strategy is therefore to play each action with 1/3 probability. 

If your opponent plays the equilibrium strategy of Rock 1/3, Paper 1/3, Scissors 1/3, then he will have the following EV. EV = $$1*(1/3) + 0*(1/3) + (-1)*(1/3) = 0 $$. Note that in Rock Paper Scissors, if you play equilibrium then you can never show a profit because you will always breakeven, regardless of what your opponent does. In poker, this is not the case. 

### Regret
When I think of regret related to poker, the first thing that comes to mind is often "Wow you should've played way more hands in 2010 when poker was so easy". Others may regret big folds or bluffs or calls that didn't work out well. 

Here we will look at the mathematical concept of regret. Regret is a measure of how well you could have done compared to some alternative. Phrased differently, what you would have done in some situation instead.  

$$ Regret = u(Alternative Strategy) - u(Current Strategy) $$ where u represents utility

If your current strategy for breakfast is cooking eggs at home, then maybe u(Current Strategy) = 5. If you have an alternative of eating breakfast at a fancy buffet, then maybe u(Alternative Strategy) = 9, so the regret for not eating at the buffet is 9 - 5 = 4. If your alternative is getting a quick meal from McDonald's, then you might value u(Alternative Strategy) = 2, so regret for not eating at McDonald's is 2 - 4 = -2. We prefer alternative actions with high regret. 

We can give another example from Rock Paper Scissors: 

We play rock and opponent plays paper ⇒ u(rock,paper) = -1
Regret(scissors) = u(scissors,paper) - u(rock,paper) = 1-(-1) = 2
Regret(paper) = u(paper,paper) - u(rock,paper) = 0-(-1) = 1
Regret(rock) = u(rock,paper) - u(rock,paper) = -1-(-1) = 0

We play scissors and opponent plays paper ⇒ u(scissors,paper) = 1
Regret(scissors) = u(scissors,paper) - u(scissors,paper) = 1-1 = 0
Regret(paper) = u(paper,paper) - u(scissors,paper) = 0-1 = -1
Regret(rock) = u(rock,paper) - u(scissors,paper) = -1-1 = -2

We play paper and opponent plays paper ⇒ u(paper,paper) = 0
Regret(scissors) = u(scissors,paper) - u(paper,paper) = 1-0 = 1
Regret(paper) = u(paper,paper) - u(paper,paper) = 0-0 = 0
Regret(rock) = u(rock,paper) - u(paper,paper) = -1-0 = -1

Again, we prefer alternative actions with high regret. 

To generalize for the Rock Paper Scissors case:
- The action played always gets a regret of 0 since the "alternative" is really just that same action
- When we play a tying action, the alternative losing action gets a regret of -1 and the alternative winning action gets a regret of +1
- When we play a winning action, the alternative tying action gets a regret of -1 and the alternative losing action gets a regret of -2
- When we play a losing action, the alternative winning action gets a regret of +2 and the alternative tying action gets a regret of +1

### Regret Matching
What is the point of these regret values and what can we do with them? 

Matching choose action most that has higher chance of being best, optimistic in face of uncertainty
Learning self play, see situations interesting, 


Regret matching means playing a strategy in proportion to the accumulated regrets. As we play, we keep track of the regrets for each action and then play in proportion to those values. For example, if the regret values for Rock are 5, Paper 10, Scissors 5, then we have total regrets of 20 and we would play Rock 5/20 = 1/4, Paper 10/20 = 1/2, and Scissors 5/20 = 1/4 as well. 

It makes sense intuitively to prefer actions with higher regrets because they provide higher utility, as shown in the prior section. Why not just play the highest regret action always? Because playing in proportion to the regrets allows us to keep testing all of the actions. It could be that at the beginning, the opponent happened to play Scissors 60% of the time even though their strategy in the long run is to play it much less. We wouldn't want to exclusively play Rock in this case, we'd want to keep our strategy more robust. 


The regret matching algorithm works like this:
1. Initialize regret for each action to 0
2. Set the strategy as: 
$$
\text{strategy\_action}_{i} = \begin{cases} \frac{R_{i}^{+}}{\sum_{k=1}^nR_{k}^{+}}, & \mbox{if at least 1 positive regret} \\ \frac{1}{n}, & \mbox{if all regrets negative} \end{cases}
$$
3. Accumulate regrets after each game and update the strategy

So let's consider Player 1 playing a fixed RPS strategy of Rock 40%, Paper 30%, Scissors 30% and Player 2 playing using regret matching. So the player is playing almost the equilibrium strategy, but a little bit biased on favor of Rock. 

Let's look at a sequence of plays in this scenario.

| P1  | P2  | New Regrets  | New Total Regrets  | Strategy [R,P,S]  | P2 Profits
|---|---|---|---|---|---|
| S  | S  | [1,0,-1]   | [1,0,-1]  | [1,0,0]  | 0  | 
| P  | R  | [0,1,2]  | [1,1,1]  | [1/3, 1/3, 1/3]  | 1  |
| S  | P  | [2,0,1]  | [3,1,2]  | [1/2, 1/6, 1/3]  | 0  |
| P  | R  | [0,1,2]  | [3,2,4]  | [3/10, 1/5, 2/5]  | -1  |
| R  | S  | [1,2,0]  | [4,4,4]  | [1/3,1/3,1/3]  | -2  |
| R  | R  | [0,1,-1]  | [4,5,3]  | [1/3,5/12,1/4]  | -2  |
| P  | P  | [-1,0,1]  | [3,5,4]  | [1/4,5/12,1/3]  | -2  |
| S  | P  | [2,0,1]  | [5,5,5]  | [1/3, 1/3, 1/3]  | -3  |
| R  | R  | [0,1,-1]  | [5,6,4]  | [1/3, 2/5, 4/15]  | -3  |
| R  | P  | [-1,0,-2]  | [4,6,2]  | [1/3,1/2,1/6]  | -2  |

Here are 10,000 sample runs of this scenario. We know that the best strategy is to play 100% Paper to exploit the opponent over-playing Rock. Depending on the run and how the regrets accumulate, the regret matching can figure this out immediately or it can take some time. 

<img src="/assets/rps_fast1.png" width="500">

<img src="/assets/rps_slow1.png" width="500">

Add automation/make clearer, other stuff from RPS

### Bandits
A standard example for analyzing regret is the multi-armed bandit. The setup is a player sitting in front of a multi-armed bandit with some number of arms. (Think of each as a different slot machine arm to pull.) A basic setting initializes each arm with $$ q_*(\text{arm}) = \mathcal{N}(0, 1) $$, so each is initialized with a center point found from the Gaussian distribution. 

Each pull of an arm then gets a reward of $$ R = \mathcal{N}(q_*(\text{arm}), 1) $$. 

To clarify, this means each arm gets an initial value centered around 0 but with some variance, so each will be a bit different. Then from that point, the actual pull of an arm is centered around that new point as seen in this figure with a 10-armed bandit from Intro to Reinforcement Learning by Sutton and Barto:

![Bandit setup](banditsetup.png)

Imagine that the goal is to play this game 2000 times with the goal to achieve the highest rewards. We can only learn about the rewards by pulling the arms -- we don't have any information about the distribution behind the scenes. We maintain an average reward per pull for each arm as a guide for which arm to pull in the future. 

**Greedy** 

The most basic algorithm to score well is to pull each arm once and then forever pull the arm that performed the best in the sampling stage. 

**Epsilon Greedy**

$$\epsilon$$-Greedy works the same way as Greedy, but instead of **always** picking the best arm, we use an $$\epsilon$$ value that defines how often we should randomly pick a different arm. We must be checking to see which arm is the current best arm before each pull according to the average reward per pull, since the random selections could switch the previous best arm to a new arm. 

The idea of usually picking the best arm and sometimes switching to a random one is the concept of exploration vs. exploitation. Think of this in the context of picking a travel destination or picking a restaurant. You are likely to get a very high "reward" by continuing to go to a favorite vacation spot or restaurant, but it's also useful to explore other options. 

**Bandit Regret** 
The goal of the agent playing this game is to get the best reward. This is done by pulling the best arm. We can define a very sensible definition of average regret as 

$$ \text{Regret}_t = \frac{1}{t} \sum_{\tau=1}^t (V^* - Q(a_\tau)) $$ 

where $$ V^* $$ is the fixed reward from the best action, $$ Q(a_\tau)) $$ is the reward from selecting arm $$ a $$ at timestep $$ \tau $$, and $$ t $$ is the total number of timesteps. 

In words, this is the average of how much worse we have done than the best possible action over the number of timesteps. 

So if the best action would give a value of 5 and our rewards on our first 3 pulls were {3, 5, 1}, our regrets would be {5-3, 5-5, 5-1} = {2, 0, 4}, for an average of 2. So an equivalent to trying to maximize rewards is trying to minimize regret. 

**Upper Confidence Bound (UCB)** 

### Regret in Poker 
In the counterfactual regret minimization (CFR) algorithm, a slightly different presentation of regret is used. For each node in the poker game tree, 