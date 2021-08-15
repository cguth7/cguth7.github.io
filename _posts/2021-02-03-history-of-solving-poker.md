---
title: "AIPT Section 1.2: Background -- History of Solving Poker"
date: 2021-02-03
sidebar:
  nav: "nav"
toc: true
toc_label: "TOC"
toc_sticky: true
author_profile: false
---

# Background -- History of Solving Poker 
There has been a rich literature of research and algorithms involving games and game theory, with poker specific research starting to grow in the late 1990s and early 2000s, especially after the creation of the Computer Poker Research Group (CPRG) at the University of Alberta in 1995. Real life decision making settings almost always involve imperfect information and uncertainty, so algorithmic advances in poker are exciting with regards to the possible applications in the real world.

Research accelerated, partially thanks to the founding of the Annual Computer Poker Competition (ACPC) in 2006, which has led to people from around the world competing to build the best poker agents, which has in turn led to significant research in algorithm development, abstraction, and game solving techniques. In recent years, we have also seen multiple “man vs. machine” contests to test the latest poker agents against some of the best poker players in the world. 

After some major results from around 2015-2018, some researchers have moved on to even more complex imperfect information games like Hanabi. 

## Early Poker Research and Theories
The earliest signs of poker research began over 70 years ago. In the Theory of Games and Economic Behavior from 1944, John von Neumann and Oskar Morgenstern used mathematical models to analyze simplified games of poker and showed that bluffing is an essential component of a sound poker strategy, but the games analyzed were very basic.

Harold W. Kuhn solved 1-card poker with 3 cards, also known as Kuhn poker, by hand, analytically, in 1950.

The first major effort to build a poker program occurred in the 1970s by Nicholas Findler. He designed a 5-card draw poker program as a method to study computer models of human cognitive processes in poker. The program was able to learn, but was not considered a strong player, despite 5-card draw being less complex than Texas Hold’em, in part because all cards in 5-card draw are private.

In 1984, Mike Caro, now perhaps most famous for his “Book of Poker Tells”, a book that examines poker player behaviors that can give away, or tell, information about their hands, created a one-on-one NLHE program called Orac [37]. It was faced off against strong human opponents, but the matches were not statistically significant and were not well documented.

Darse Billings, in his master’s thesis from 1995, adeptly noted that despite poker generally being considered very dependent on “human elements” like psychology and bluffing, perfect poker is based on probabilities and strategic principles, so Billings suggested focusing on the mathematics of poker and game theory before considering the human or rule-type systems.

Given this insight, how have “feel” players who rarely consider advanced mathematical principles thrived in poker for decades? Doyle Brunson’s famous book, Super/System: A Course in Power Poker from 1978 mainly prescribes a style of aggression, notably in cases where most players would be more passive. Billings notes that this advice was based off of experience and not mathematical soundness, but is valid from a mathematical perspective, because opponents are far more likely to make mistakes when faced with a bet or raise than when facing a check or call.

The implication here is that despite many players not considering sophisticated mathematical and game theoretical principles, they can develop to use plays that make sense mathematically learned over time from trial and error and recognizing patterns that work. However, nowawdays, many of the world’s best players do indeed use sophisticated statistical software to analyze their hands and their opponent’s hands, as well as simulation software to run mathematical simulations on common hand situations.

## History of Poker Agents
The main types of poker agents have been **knowledge based** (using rules or formulas),
**simulation based**, and **game theoretical**.

Research in recent years has mainly focused on Texas Hold’em using game theoretical strategies and has been split into (a) analyzing isolated subsets about  specific aspects of the game and (b) creating agents capable of autonomous play.

An excellent (though now outdated) paper explaining the state of computer poker, called “Computer poker: A review” [4] was published in 2010 by Jonathan Rubin and Ian Watson of the University of Auckland. Parts of this section follow their review closely for the time period leading up to 2010.

### Knowledge Based Agents
Domain knowledge systems can be rule-based, which means that they use if-then logic, incorporating variables such as number of opponents, hand strength, position, and bets to call. Or they can be formula-based, which requires a numeric representation of hand strength  and pot odds. The system then ranks the agent’s hand over all possible hands (ignoring the opponent’s hand likelihoods) and can be modified to also include hand potential (i.e., not only the current hand value, but the probabilistic hand value by the end of the hand).

Such exploitive agents focus on isolating weaknesses in the agent’s opponents. They must have an opponent model that is generally set up as (fold, call, raise) probability triples and generally set up histograms of hands into buckets based on actions.

David Sklansky and Mason Malmuth’s well regarded 1994 book Hold’em Poker for Advanced Players recommended a basic rule-based system for Limit Texas Hold’em, with variations according to betting position and game conditions. Indeed,most players probably operate under a sort of unexact rule-based plan.

In David Sklansky’s 1999 text, The Theory of Poker, Sklansky states his Fundamental Theorem of Poker: “Every time you play a hand differently from the way you would have played it if you could see all your opponents’ cards, they gain; and every time you play your hand the same way you would have played it if you would call all their cards, they lose. Conversely, every time opponents play their hands differently from the way they would have if they could see all your cards, you gain; and every time they play their hands the same way they would have played if they could see all your cards, you lose.”

The individual hand vs. individual hand concept was then expanded by Phil Galfond in a 2007 article in Bluff Magazine that pioneered the idea of thinking of opponents’ hands in terms of a range of possible hands, not a particular hand.

Quantitative Poker, a web blog, expanded on this and added the levels of range vs. range (level 2), strategy vs. strategy (level 3), and finally, strategy vs. inferred strategy
distribution, which allows for the idea that opponent strategies will be employing a
strategy from a range of strategies.

In 2001, Furnkranz identified opponent modeling as a neglected area of research within game playing domains and mentions its importance in a game like poker. The risk with opponent modeling techniques that seek to exploit opponents (exploitive strategies) is that the agent then subjects itself to exploitation, especially if the model of the opponent is invalid or incorrect. Such a model is required for exploitive agents, which can be either static, based on predefined opponent characteristics, or adaptable, based additionally on opponent’s actions during the match. While opponent modeling has shown some promise in poker research, the most successful solutions now tend to use a more game theoretic approach, which limit their exploitability at the expense of maximizing value against weaker opponents.

Rule-based systems generally show up preflop, where fixed rules make more sense given the limited possibilities of hand combinations. The University of Alberta Computer Poker Research Group created one of the first poker agents in 1999, called Poki, which took an effective hand strength as input and outputted a (fold, call, raise) probability triple, using a form of basic opponent modelling.

Various programs were created in the late 1990s and early 2000s including r00lbot, which, based on rules in the Advanced Hold’em Poker book, did 3000 trials simulating hand to showdown against n random opponent holdings, and then made decisions. Poki (and its earlier iteration, Loki) used opponent modelling and a formula-based betting strategy and was successful when tested in Internet Relay Chat (IRC). A later version of Poki took first place in the 2008 6-player Limit Hold’em tournament in the ACPC.

The problem with such systems is that they require expert rules and there are too many situations possible to have rules for all of them, which requires merging situations that are not necessarily similar enough. Also the systems are generally not very scalable, because they cannot maintain enough rules for the game and therefore become exploitable.

### Simulation Based Agents
Simulation agents can use a simulation like Monte Carlo Tree Search (MCTS), combined with a non-player specific opponent model, to predict action and hand rank probabilities for specific opponents.

After the Alberta Computer Poker Research Group's formula based Loki-1 agent, they created Loki-2, which added a simulation function to better determine the expected value of check call and bet/raise decisions. They called this selective-sampling simulation since there is a selective bias when choosing a random sample at a choice node. Opponent hands were based on a weight table, instead of randomly, and in the late 1990s, Alberta recommended this as a general framework for solving games with imperfect information. These changes made the second iteration of this agent earn 0.05 small blinds per hand more on average than the first version.

The next version of this agent was called Poki, which used a formula and simulation based strategy, along with opponent modelling and a revised re-weighting method. The simulation based strategy was not as significantly superior to the formula based one as expected. The simulation based Poki agent was found to be overly tight in heads up (one on one) play and overly aggressive in 10 player games. It entered into cycles of behavior in which in 10 player games, it would predict that opponents call and raise too often, thus increasing the perceived value of the pot, and therefore believing that it had better odds to stay in pots with hands of moderate strength. The reverse happened in heads up games. The CPRG realized that decision making based on the expected holdings of the opponent is not a successful technique.

In 2008, a simulation-based agent called AKI Realbot participated in the Annual Computer Poker Competition (ACPC) and took second place. It used an exploitive strategy to play more against weak players, which it defined as players who had lost money overall in the prior 500 hands. Most of its gains came from exploiting these weak opponents, which is also a phenomenon commonly seen in real life poker.

In 2009, McCurley tested knowledge based and game tree search based agents against real opponents and the results showed the game tree based search agent winning, while the knowledge based agent was not.

Also in 2009, Van den Broeck created an agent using MCTS for a NLHE game, using an offline non-player specific opponent model by learning a regression tree from online poker data, which he used to predict actions and hand rank probabilities for opponents in simulations. He used selection and backpropogation strategies to take into account the information on the standard error over the sampling distribution. The exploitive agent could handle multiple opponents and no limit betting and was found to work well against non-adaptive rule-based players. 

### Game Theoretic Equilibrium Solutions
We have continued to see interesting applications with games and AI succeeding in the real world, including Deep Blue famously beating Kasporov in chess in 1997, Watson defeating Jennings in Jeopardy in 2011, and most recently AlphaGo defeating Lee Se-dol in Go in 2016. These applications, however, differ from the trends in poker solving, since most work in poker is now involving equilibrium strategies that are unexploitable, rather than building AI whose goal is to defeat individual opponents.

In this section, we look at the history of linear programming game theoretic solution techniques, while saving the more recent CFR game theoretic techniques for the next section.

In 1999, Selby looked at the preflop round only and considered only a rollout of cards without betting, and computed payoff values and a linear program with 169 isomorphic sets of preflop hands (i.e. all possible preflop combinations of hands), which he solved with a simplex algorithm to create an equilibrium strategy.

In 2000, Shi and Littman produced a game theoretic player for a game called Rhode Island Hold’em, a simplified Hold’em game with three total betting rounds and only one private card per player. Their agent was able to beat a range of rule-based opponents.

In 2003, the research community began to focus on HULHE as a challenge problem, which is when the CPRG at Alberta first attempted to create an approximate solution for the game using abstraction, rather than sequence form linear programming (SFLP). Billings et al. created PsOpti, which focused on near-equilibrium solutions for full 2- player HULHE, a game with 10^18 game states.

They knew that the sequence form linear programming techniques of Koller were not sufficient to solve such a large game, so abstractions were needed, which reduced the game to about 10^7 game states, by using expectation-based abstraction that used bucketing, and elimination of
betting rounds. Further, they separated preflop and postflop models, which were then tied together by using preflop betting sequences to inform which postflop model to employ to effectively solve for the entire game tree. A combination of PsOpti agents was named Hyperborean and won the first AAAI Computer Poker Competition in 2006, although the PsOpti agent was found later to not be a great equilibrium approximation since it was defeated by a wide margin by later Nash approximation strategies.

The combination of preflop and postflop models was later identified as problematic since this does not guarantee a coherent equilibrium strategy. However, in 2009, Waugh showed that separate subgames can be pieced together as long as they are tied together by a common base strategy.

The Abstraction-Solving-Translation approach requires that a full-scale poker game be modeled by a smaller, solvable game. The abstracted game is then solved to find an approximate Nash equilibrium, which is then translated to choose actions in the full game. This technique is now very common in game theoretic solution techniques in the poker space. In general, SFLP can solve games up to about 10^8 info sets, so most games require more abstraction than possible through lossless (i.e. card isomorphism in poker -- when different sequences of cards are actually the same strategically) abstraction alone.

In 2005, Gilpin and Sandholm, after applying abstractions, used SFLP to solve Rhode
Island Hold’em completely, which has 3.94x10^6 info sets after symmetries are
removed.

In 2006, Gilpin and Sandholm created the GS1 agent to find near-equilibrium solutions to HULHE. They used a new technique called GameShrink to abstract the game tree automatically and then to use real-time equilibrium calculations on the turn and river. They later improved this with a GS2 iteration that improved the abstraction technique with k-means clustering.

The game tree in NLHE can have up to around 10^161 nodes (depending on the stack sizes), significantly larger than in LHE, where it has only about 10^18 nodes. Aggrobot was created in 2006 and is similar to PsOpti, but was made to solve NLHE and adds the use of betting abstractions, which meant that the agent could bet only half pot, full pot, double pot, and all-in. While the abstraction itself is relatively straightforward, the issue of translating opponent bets to match the best estimate within the abstract game was a challenge. Near-equilibrium solutions were found for games up to about 20 big blinds with 1-2 big blind betting.

Miltersen and Sorenson, in 2007, solved for Nash equilibrium solutions for 2 players at the end of a tournament with 8000 chips each and 300-600 blinds where actions were restricted to be allin or fold only. They showed that this simple allin-fold strategy approximated Nash equilibrium for the unrestricted tournament. Because of special considerations with tournaments that require hands to be looked at in the context of the stage of the tournament in addition to the expected value of winning chips on a particular hand, most poker research has avoided these complicating factors by focusing on cash games, in which each hand is independent from the next.

In 2006, Gilpin, Hoda, Pena, and Sandholm developed Scalable EGT (Excessive Gap Technique), which was improved in 2007, by Gilpin, Sandholm, and Sorensen. EGT works to solve optimization problems like linear programming, but allows for suboptimality and therefore faster solving. This was used to solve Rhode Island Hold’em with 3x10^9 histories.

Also in 2007, Counterfactual Regret was developed by Zinkevich et al., which revolutionized poker research and will be explored in detail in this tutorial.

The linear programming (LP) algorithms in 1995 were capable of solving games with around 10^5 nodes in the game tree. This grew in 2003 to 10^6, in 2005 to 10^7, and then in 2006 to 10^10
with the development of EGT. Since 2007, both EGT and CFR have been able to solve games with about 10^12 nodes.

#### Iterative Algorithms
Ficticious play involves two players who continually play against each other and adapt and improve over time. Each player starts with an arbitrary strategy and trains with random situations, while knowing the correct moves since he knows the opponent strategy, and then keeps updating the strategy, which results in approaching a Nash equilibrium as iterations increase.

In 2006, Dudziak produced a near-equilbirium agent called Adam for HULHE using a fictitious play algorithm on an abstracted game tree. In 2010, Fellows developed INOT and Fell Omen 2, which respectively took 2nd/15 and 2nd/9 in the HULHE instant run off competition in 2007 and 2008 in the ACPC.

In 2007, the Range of Skill algorithm was developed at Alberta by Zinkevich. This is an iterative procedure that creates a sequence of agents where each next agent employs a strategy that can beat the strategy of the prior agent by at least some epsilon amount. As the number of agents approach their finite limit, the strategies approach a Nash equilibrium. This works by calling a generalized best response (which computes the best response to a restricted set of allowed strategies, known as the restricted game) and on each iteration, the previous best response is included in the set of allowed strategies of the restricted game and a new best response is found. Equilibrium strategies are returned for restricted games of increasing size. This technique resulted in the creation of a pair of agents called SmallBot and BigBot, which were some of the first near-equilibrium agents to examine a full four round betting model, and resulted in major improvements over previous agent models that required merging separate models together to form a cohesive strategy.

#### Other Algorithms
Case based reasoning is a lazy learning algorithm that stores cases with knowledge of their states and solutions and then when a new case comes up, it finds the most similar by means of k-nearest neighbors. An agent called Sartre trained with hand history logs of top $$\epsilon$$-Nash agents from the prior year ACPC and as a result took 6th place in 2009, 3rd place in the 2010 bankroll limit event, and 2nd place in the 2010 no limit instant runoff event. CASPER, made in 2007, was designed to play Hold’em at a 10 person table. It generated cases from hand histories from Poki, recording hand rank and potential, number of active players, number of players to act, number of bets to call, pot odds, and other metrics, and outputted a betting decision, taken from the most similar case.

Evolutionary algorithms evolve over successive generations and are evaluated by fitness functions. Jason Noble, in 2002, used artificial neural network agents that compete against each other over many generations in LHE games with up to 10 players. He noticed that an issue with using one dimensional fitness functions is that strategies can be intransitive, so he tried to use multi-dimensional optimization and defined Pareto dominance as when A defeats not only B but also all opponents that B defeats. 

Nicoali and Hilderman, in 2009, used a tournament structure during the evolutionary process such that they would set a nine player table, play until only one player remains and assign ranks, and then average ranks over multiple of these plays, then define the best players as parents in the next evolution generation. 

Bayesian agents were attempted, but achieved poor results in the ACPC in 2006 and
2007.

Major challenges with agents in general are the creation of accurate opponent models in real time with limited data, dealing with multiple opponents, and dealing with tournaments that have a variable structure, including changing blinds as the tournament progresses.

### Exploitive Strategies
As we have discussed, a Nash equilibrium strategy is static, robust, and limits its own exploitability by maximizing a minimum outcome against a perfect opponent. A true Nash equilibrium will never lose in the long run and also will not exploit weaknesses in opponents. To exploit weaknesses requires opponent modelling, which means deciding actions based on some opponent characteristic, which opens up the agent itself to exploitability as a consequence.

The CPRG created two agents for HULHE that are adaptive and exploitive that use game tree search. Vexbot, created in 2004, was an imperfect information game tree agents that used context tree data structures within opponent models and they recorded betting sequences to get opponent action frequencies for intermediate nodes, and observed hand rank histograms at showdown leaf nodes, though not all are shown. The agents equate similarities of bet sequences by, for example, total bets divided by raises. These agents nearly maximally exploit always-call and always-raise agents and beat an agent called Sparbot that used a near equilibrium strategy. 

In 2009, McCurley used artificial neural networks with hand history data from online poker sites to predict action frequencies at nodes.

Robust counter-strategies offer a compromise between exploiting an opponent and minimizing
one’s own exploitability. For example, an $$\epsilon$$-safe best response is a strategy from the set of strategies exploitable for no more than $$\epsilon$$, that maximizes utility against a particular opponent. The Restricted Nash Response (RNR) algorithm takes a target opponent’s strategy and a parameter $$p \in [0, 1]$$ which trades off between minimizing exploitability and exploiting the opponent. CFR is then used to solve the game, fixing the player’s strategy at the input strategy for $$p$$ and for $$(1 − p)$$, and allowing the player to choose their own actions. The RNR generates the Pareto optimal set of tradeoffs between exploitation and unexploitability.

Since Restricted Nash Response can only be implemented if given the opponent’s strategy, Data Biased Response (DBR) is an option to create robust counter-strategies, which works by choosing an abstraction for an opponent model, mapping the real game observations of the opponent into the abstract game, and determining frequency counts of the observed actions. Then, like with the RNR algorithm, a modified game is solved in which one player is playing based on the opponent model with probability determined at each information set (not at the root), and the other player converges to a robust counter-strategy. The Hyperborean agent got 2nd in the 2 player limit bankroll competition in 2009 using DBR.

A few key findings from analyzing robust counter-strategies using 5, 8, and 12
buckets where each has a uniform percentile of hands in HULHE:
- Using	asymmetric	abstractions	for	the	opponent	model	and	opponent’s	
response	can	produce	strictly	better	robust	counter-strategies
- With	fewer	observations	to	learn	the	opponent	model,	the	smallest	(5-
bucket)	opponent	abstraction	model	results	in	the	best	exploitability,	
because	there	are	probably	too	few	observations	to	spread	across	a	larger	
number	of	buckets,	though	the	middle	range	(8-bucket)	model	eventually	
gives	better	performance,	while	the	largest	(12-bucket)	model	does	
poorly	throughout,	since	it	attempts	to	separate	the	observations	into	too	
many	buckets.	
- Agent	designers	should	attempt	to	select	opponent	model	abstractions	
that	are	similar	to	opponent’s	true	abstractions	and	can	be	estimated	
accurately	from	limited	observations
- In	both	RNR	and	DBR	cases,	using	larger	opponent	response	abstraction	
produces	nearly	dominant	performance	curves	in	terms	of	exploitability
- Also	in	both	RNR	and	DBR	cases,	just	as	in	the	Nash	equilibrium	cases,	
larger	abstractions	for	our	agent	tend	towards	best	one-on-one	
performance	and	larger	opponent	abstractions	result	in	better	worst-case	
exploitability
- Robust	counter-strategies	with	positive	weight	on	the	opponent	model	
were	shown	that	they	can	be	less	exploitable	than	abstract	game	Nash	
equilibria	(which	is	the	same	as	RNR	or	DBR	with	$$p = 0$$)

Another strategy is using Teams of Agents, in which the agent selects which strategy to use from a group of exploitive strategies, and picks one depending on the opponent, using the UCB1 algorithm for the policy selection procedure. Johanson showed that this results in an agent that is able to achieve a greater profit against a set of opponents, compared to the use of a single $$\epsilon$$-Nash equilibrium strategy against the same opponents.

Finally, there is frequentist best response, which takes an offline model for an opponent by observing training games and assuming that his strategy is fixed, which requires having a default policy for gaps in the observed data, and then plays based on a best response to this strategy.

One major problem with this technique in poker is that most hand data does not include private hole cards unless they are shown at the end of a hand, which means hands that are seen tend to be stronger, since, for example, bluffs would not be seen as frequently. Counter-strategies such as building up a best response model offline against a particular opponent are possible, but may require up to a 1 million hand sample on the opponent. This strategy is also risky because it could lead to significant exploitation against other opponents or an opponent who changes his strategy, as most do. Finally, on-the-fly opponent modelling is difficult because sample sizes tend to be quite low, so only very few information sets would be seen even over thousands of hands.

Ganzfried and Sun explored the idea of opponent exploitation in an early 2017 paper. They note that opponent exploitation is crucial in imperfect information games and has much wider use than Nash equilibrium, which is only valid in two-player zero sum games. They propose a robust opponent modelling system based on a Bayesian model that is valid in general-sum games, where the prior and posterior are full distributions over mixed strategies of the opponent ((which can be problematic when an opponent’s private information is not observed after play). They show that the opponent model can be fixed to play a strategy that responds to the mean of the distribution of the opponent’s strategy. The strategy then involves starting with an equilibrium approach and then adjusting to the opponent as more information about his play is revealed by modelling the opponent after a pre-computed equilibrium strategy and playing an approximate best response to that strategy. Problems involve partial observability of the opponent’s hands and even when hands are observed, very large amounts of hands would be needed to get a good sample, but they have seen excellent results with this method against weak ACPC agents and trivial opponents and note that this could be turned off against opponents perceived to be very strong.

From the same period, Li and Miikkulainen developed a genetic algorithm to evolve adaptive Long-Term Short-Term (LSTM) based neural network poker players. They showed good results against They showed results with it competing against simple opponents (e.g., opponents who never bluff or always call), and showed improvement over standard agents under such circumstances. 

### Counterfactual Regret Minimization (CFR)
CFR grew out of the Annual Computer Poker Competition that began in 2006. Counterfactual regret was introduced in the 2007 paper by Zinkevich et al. called Regret Minimization in Games with Incomplete Information and has continued to this day to be the primary computer poker research focus and the basis of the majority of the best poker agents and algorithms that exist. 

The CPRG developed two successful agents based on CFR: Hyperborean to compete in the ACPC and Polaris to compete in Man vs. Machine poker events. Both agents will be described in detail in the sections about competitions.

In CFR, memory needed is linear in the number of info sets (whereas linear program memory needed is quadratic). An approximate Nash equilibrium is reached by averaging player strategies over all iterations, which improves as the number of iterations increases. Solving games is usually bounded by memory constraints, so CFR has resulted in a similar improvement as compared to the sequence form linear programming as sequence form did with normal form linear programming. CFR is guaranteed to converge with perfect recall and has experimentally worked well even with non-2 player non-zero sum and imperfect recall games. It has been used to solve games with as many as 3.8x10^10 information sets in 2012.


#### Monte Carlo CFR
Marc Lanctot et al. of Alberta expanded the standard vanilla CFR method to include Monte Carlo sampling in 2009. The Monte Carlo methods are important because they converge faster than vanilla CFR, since vanilla CFR iterations require an entire tree traversal. Monte Carlo CFR sampling (MCCFR) requires more iterations, but each iteration tends to be much faster, resulting in a significantly faster convergence.

In Lanctot’s thesis, he goes beyond only poker and explores other interesting imperfect information games such as Latent Tic-Tac-Toe, a form of Tic-Tac-Toe in which players cannot see their opponents moves until after each round, and Princess and Monster, a pursuit-evasion game where two players are in a “dark” grid where they can’t see each other and can only move to points adjacent to their current locations. Scoring is based on catching the princess as fast as possible.

The primary game that Lanctot focuses on is called Bluff, where each player has private dice to roll and look at without showing to opponents. Each round, players alternate bidding on the outcome of all dice in play until one calls “bluff”, claiming that the bid is invalid. If caught, the losing player has to remove a number of dice between the amount he bid and the actual amount in the game. If a player loses all of his dice, he loses the game. He shows that in these games and in poker, vanilla CFR is essentially always less efficient than Monte Carlo CFR methods. External sampling also tends to dominate chance sampling in his experiments.


#### CFR+
In early 2014, the Computer Poker Research Group from the University of Alberta announced that “Heads-up limit hold’em poker is solved”, a huge achievement in the poker research community and poker community at large since this is the first significant imperfect-information game played competitively by humans that has been solved. Their article was published in the January 9, 2015 issue of Science. The team used a new version of CFR called CFR+, which can solve games much larger than with prior CFR algorithms and is also capable of converging faster than CFR in both poker games and matrix games.

The algorithm was originally developed by Oskar Tammelin. This major achievement was noticed in the research community, the poker community, and was featured in many mainstream publications. Despite LHE’s popularity being in decline recently in favor of NLHE games, this was a very exciting announcement. 

The main change in CFR+ from CFR and prior research is that the regrets are calculated differently such that all regrets are constrained to be non-negative, so that actions that have looked bad (i.e. those regrets with value <0) are chosen again immediately after proving useful instead of waiting many iterations to become positive. Also, the final strategy used is the current strategy at that time, not the average strategy (as in vanilla CFR), and no sampling is used. Additionally, advances were made enabling further use of compression to store the average strategy and regrets.

Previously only perfect information games of this size, like checkers, have been solved and despite this game being smaller than checkers, it was much more challenging due to the incomplete information. HULHE has 3.16x10^17 game states, which places it as larger than Connect 4 and smaller than checkers. There are 3.19x10^14 decision points, or information sets, where the state is indistinguishable based on the player’s information in the hand (this is reduced to 1.38x10^13 after removing game symmetries). The main considerations when solving a game of this size come in the form of memory and computation power.

CFR+ was implemented on 200 computation nodes, each with 24 2.1-GHz AMD cores, 32 GB of RAM, and a 1TB local hard disk. The game was divided into 110,565 subgames. The solution came after 1,579 iterations in 69 days, using 900 core years of computation and 10.9 TB of disk space (the game without compression would have required 262 TB of space!), reaching an exploitability of .986 mbb/g, which required full traversal of the game tree to determine. Exploitability is defined as the amount less than the game value that the strategy achieves against the worst-case opponent strategy in expectation and it was determined that a 1 mbb/g was a good threshold for the game being considered essentially solved. This is based on assuming a player playing a worst case strategy for a lifetime and that he would be playing 200 games/hour, 12 hours/day, for 70 years, with a standard deviation of 5 bb/g, and with a 95% confidence interval (1.64 standard deviations). This results in the following threshold computation: $$1.64 * 5 * 200 * 12 * 365 * 70 = .00105$$

Bowling et al. describe their solution as weakly solved, which means that the strategy finds a game theoretic value in reasonable time for initial conditions (whereas ultraweakly is finding a game theoretic value for initial positions and strongly is strategy determined for all positions to find the game theoretic value).

The main findings from the solution are that, as expected, the dealer has a substantial advantage because he acts last, giving him more information to work with while making decisions. He is expected to win +87.7-89.7 mbb/g.

Other interesting characteristics of the strategy are: that it is considered rarely (.06%) good to only call preflop, meaning that it is almost always best to raise or fold. The program also rarely folds preflop as the non dealer who has already put in the big blind. Finally, as dealer, who is acting last in rounds after preflop, the program rarely puts in the capped (4th) bet preflop, perhaps because it will have an advantage from acting last in later rounds. While other Nash equilibria could play differently, they would always achieve the same game value.

Despite the significant growth in capabilities of solving computer poker games, NLHE games are generally still much too large to be solved unabstracted. NLHE usually has about 10^71 states, depending on the rules. The Royal NLHE game has about 10^9 game states, solvable by most standard computers.

#### Compact CFR and Pure CFR
Although most CFR research had been tilted towards sampling optimization after 2009, Oskari Tammelin, a hobbyist poker programmer from Finland, developed the Pure CFR algorithm that uses pure strategy profiles on the vanilla version of CFR.

Pure CFR was described in Richard Gibson’s 2014 thesis. Since all of the utilities of in poker are integers, all computations in Pure CFR can be done with integer arithmetic, which is both faster than floating-point arithmetic and allows for the cumulative regret and cumulative strategy profile as integers, which reduces memory costs by 50%.

Another CFR version was published in early 2016 by Eric Jackson in a paper called
Compact CFR. This version uses follow-the-leader instead of regret matching, which assigns the entire probability mass to the action with highest regret, which is equivalent to fictitious play in a 2-player zero sum situation. Compact CFR is not a no-regret algorithm (i.e. it loses theoretical guarantees), but the average strategy does converge to Nash equilibrium. 

However, by applying follow-the-leader to each information set independently, this is not the same as fictitious play, and the entire strategy is updated on each iteration to be a best-response to the opponent’s average strategy so far.

Since all we need to know in Compact CFR is the action with the highest regret at each information set, the regrets can be represented with offsets from 0, where the highest regret is 0 and others are positive values. These can be represented by bucketed unsigned data types, a form of compression that is only slightly worse than uncompressed regret storage. By also only taking the final strategy rather than the average strategy, every action at every information set can be represented by only one byte, whereas vanilla CFR requires 16 bytes and pure external CFR requires 8 bytes, a significant reduction in memory requirements.

#### Deep CFR

#### Superhuman AI for multiplayer poker
In 2019, Noam Brown and Tuomas Sandholm of Carnegie Mellon University released this paper with an agent called Pluribus that beat strong human players in six-handed poker. The agent was able to outperform the humans in two settings: (1) five agents at the table with one human and (2) 5 humans at the table with one agent. 

Because there isn't a clear game-theoretic solution to a multiplayer game, the goal was to create an agent that could empirically outperform top human players. 

## Evolution in Measuring Agent Quality
The main ways to measure the quality of a poker agent are (1) against other poker agents, (2) against humans, and (3) against a "best response" agent that always plays the best response to see how well the agent does in the worst case. 

### Measuring Best Response
2-player Limit Texas Hold’em Poker has about 10^18 game states, so in 2011, computing a best response was thought to be intractable because a full game tree traversal would take 10 years to compute at 3 billion states per second. Strategies could still be computed by using abstract games, but a true best response was out of reach.

In 2011, Michael Johansen et al. developed an accelerated best response computation that made it possible to measure a Heads Up Limit Hold’em strategy’s approximation quality by efficiently computing its exploitability. This shows that exploitability has dropped drastically from 2006, when it stood at about 330 micro big blinds per hand using a Range of Skill program, to the high 235 in 2008 to 135 in 2010, and continued to drop until achieving CFR+ in 2014, which solves HULHE directly without abstraction, with an exploitability of less than 1 mbb/h.

The paper was important because it was able to evaluate agents that had been used in competitions in terms of their exploitability. They showed that the 2010 competition winner was significantly more exploitable than agents that it defeated slightly.

Another important insight is that while increasing abstraction size in toy domains, improvements are not guaranteed, but in large games like Texas Hold’em, it seems that increasing abstractions continues to provide a consistent, although decreasing improvement.

Finally, an experiment was done to show that the technique of minimizing exploitability in an abstract game in order to use that strategy in the main game can have some interesting overfitting consequences. The exploitability in the main game tended to decrease (a good thing) initially, but then as iterations continued to increase, the exploitability would increase in the main game. That is, the strategy improves in the abstracted game while worsening in the main game.

The paper concludes that finer abstractions do produce better equilibrium approximations, but better worst-case performance does not always result in better performance in a tournament.

In 2013, Johanson et al. created CFR-BR, which computes the best Nash approximation strategy that can be represented in a given abstraction. This additional evaluation method compares the representation power of an abstraction by how well it can approximate an unabstracted Nash equilibrium. Using CFR-BR, Johanson showed that distribution aware (for relatively large games) and imperfect recall abstractions tend to perform better than their expectation-based and perfect recall competitors.

In 2014, Sandholm and Kroer introduced a framework to give bounds on solution quality for any perfect-recall extensive-form game. It uses a newly created method for mapping abstract strategies to the original game and uses new equilibrium refinement for analysis. This resulted in developing the first general lossy extensive-form game  abstraction with bounds. It finds a lossless abstraction when one is available and a lossy abstraction when smaller abstractions are desired, and has now been extended to
imperfect-recall.

In 2017, Lisy and Bowling showed a new method called Local Best Response to compute approximate lower bounds on the best response strategy. These can be used even in large NLHE games like those played in the ACPC. The algorithm computes the approximation by looking one action ahead and assuming that players will check until the end of the game after this action. The tests against recent successful ACPC agents were quite surprising, because even though when they played against themselves, the results were quite close, it is shown that they are extremely exploitable, even more so than if they had simply folded every hand!

## Poker Abstractions
The three main ways to create a smaller game from a larger one are to merge information sets together (card abstraction) to restrict the actions a player can take (action abstraction), to use imperfect recall, or a combination of the three. Other possibilities are reducing the number of betting rounds or bets allowed per round or modifying the game itself, for example to use a smaller deck size or smaller starting
chip size. In 2012, Lanctot developed theoretical bounds on bucketing abstraction that shows that CFR on abstractions leads to bounded regret in the full game. In 2014, this was expanded by Kroer and Sandholm to give bounds on solution quality for any perfect recall extensive form game. The framework can find abstractions, both lossy and lossless, given a specific bound requirement.

In the early 2000s, lossy abstractions were created by hand based on game-specific knowledge, but since then experimental advances in automation have advanced. The
main ideas are:

1) Using integer programming to optimize the abstraction, usually within one level of the game at a time

2) Potential-aware abstraction, where information sets of a player at a given level are based on a probability vector of transition to state buckets at the next level

3) Imperfect recall abstraction, such that a player forgets some details that he knew earlier in the game

Most abstractions now use numbers 2 and 3 above and divide the game disjointly across multiple blades of a supercomputer for equilibrium finding computation. 

Sandholm states that abstractions tend to be most successful when starting with a game theoretical strategy and modifying it based on the opponent.

### Abstraction Translations
Abstraction translations are mappings from an opponent action to an action within the abstracted framework of the game. The goal of these reverse mappings, or translations, is to minimize the player’s exploitability, while also wanting one’s own abstraction to exploit other player abstraction choices.

Early abstractions included:
- Deterministic arithmetic: Map to � or � that is closest to �. This is highly
exploitable, for example, by strong hands that bet slightly closer to � and
therefore can be responded to as if they were much weaker. This was used in
the 2007 ACPC by Tartanian1 and lost to an agent that didn’t even look at its
cards!
- Randomized arithmetic: �!,! � = !!!
!!!
. This is still exploitable when facing
bets close to 1/2 of the pot. This was used by AggroBot in 2006 in the ACPC.
• Deterministic geometric: Map to � if !
! > !
!
and � otherwise. This was used
by Tartanian2 in the 2008 ACPC.
• Randomized geometric 1: �!,! � = !(!!!)
! !!! !!(!!!)
 was used by Sartre and
Hyperborean in the ACPC
• Randomized geometric 2: �!,! � = ! !!! !!!
!!! !!!!" was used by Tartanian4 in
the 2010 competition
In 2013, Ganzfried and Sandholm developed the following translation, as previously
described in the Scientific Review section [54].
�!,! � = � − � 1 + �
� − � 1 + � (3.1)

The new mapping was tested by “rematching” the agents from the 2012 ACPC and keeping the Tartanian5 agent the same, except for revising its mapping. The mapping performed well, but interestingly performed worse than the simple deterministic arithmetic mapping that simply maps the bet to the closest abstraction. However, this leaves agents open to exploitation that perhaps was not acted upon in prior years, but could be in the future.

### Asymmetric Abstractions
The standard approach when abstracting is to use symmetric abstraction, assuming that all agents distinguish states in the same way. Agents in Texas Hold’em have been shown to perform better in head-to-head competitions and to be less exploitable when using finer-grained abstractions, although there are no theoretical guarantees of this. Until Bard et al’s 2014 paper, all research was done by examining only symmetric abstractions.

The choice of using asymmetric abstractions may affect both one on one performance against other agents and exploitability in the unabstracted game. By examining a number of different abstraction combinations in Texas Hold’em, a few main conclusions were drawn:
- Withsymmetric	abstractions, increasing the	abstraction	size results in	improved	utility	against	other	agents and improved	exploitability

- Smaller	abstractions for	ourselves, while	our	opponent	uses larger	
abstractions,	tended	to result	in improved	exploitability,	but	decreased	one on one	mean utility
- Larger	abstractions for ourselves,	while	our	opponent uses	smaller	abstractions,	tends	towards	our	exploitability worsening and	our	one on one utility	improving,	leading	to	the	conclusion to	want to increase abstractions	when	creating	an	agent	for	a	one on one competition

We see that the goals of minimizing exploitability and increasing one on one utility can be at odds with each other, so the agent designer must make abstraction decisions based on his goals and beliefs about other agents. A non poker example given is that if worst case outcomes resulted in people being injured or killed, the only goal may be to increase worst case performance.

### Abstractions are Not Necessarily Monotonically Improving
Although logic would suggest that finer abstractions result in superior agents, this was shown to not be true in general by Waugh et al. in 2009. As the annual poker competitions have advanced, the winning strategies have generally been the teams that have solved the largest abstracted games. Despite there being more strategies available in finer abstractions, solving games involves finding a pair of equilibrium strategies, not finding the best strategies from an available set. However, they did show that if one player is using abstraction while the other is playing in the null abstraction, then the abstracted player’s strategies do monotonically improve as the abstractions get finer. 

An example with Leduc Hold’em is shown, in which a finer card abstraction can result in a more exploitable strategy. They also tested betting abstraction and again found instances in which exploitability increased as the abstraction became finer. One theory presented is that providing additional strategies to a player can encourage the player to exploit the limitations of the opponent’s abstraction, resulting in a strategy that is more exploitable by actions that become available to the opponent in the full game.

### Earth Mover’s Distance Metric in Abstraction
In 2014, Ganzfried and Sandholm developed the leading abstraction algorithm
for imperfect information games, which generates abstractions that have imperfect
recall and are distribution aware, using k-means with the earth mover’s distance metric to cluster similar states together.

Many abstraction algorithms work by coarsening the moves of chance, merging several information sets of the original game into single information sets of the abstracted game. Information sets are grouped together by clustering based on strength, but strength can be defined in many ways. For example, equity (or expected hand strength) is hand strength against a uniform random opponent hand.

However, hands can have very similar expected hand strengths, but very divergent distributions of hand strength. For example, some hands may generally have middling equities around 0.5, while some may more frequently be either strong or weak. Distribution aware abstractions group states together at a given round if their full distributions over future strength are similar, instead of just basing this on the expectation of their strength. Instead of only looking at the future strength of the final round, we want to look at trajectories of strength over all future rounds. This has been proven to be empirically superior to equity abstractions.

The recommended method for computing distances between histograms of hand strength distributions is the earth mover’s distance, which is the minimum cost of turning one pile into the other where cost is assumed to be the amount of dirt moved times the distance by which it moved. Unlike the L2 metric, the earth mover’s distance metric accounts for both the amount and distance moved, not just the amount. 

Imperfect recall abstractions have been shown to lead to significantly stronger performance than perfect recall for an abstraction of a given size, because they allow the player to have a more refined view of the present since he can forget details about the past. Potential aware abstractions consider the distribution of strength in all future rounds, not just the final round.

The new algorithm incorporates imperfect recall and potential aware abstractions
using earth mover’s distance. We can find a case where two very different hands have
similar equity distributions on the river, but are extremely different on the turn. The
potential aware abstraction will observe this difference based on the earth mover’s
distance and place them into different histograms on the turn. This could be especially
useful in games like Pot Limit Omaha, in which hands are made up of four cards
instead of two and can change drastically from round to round.

### Simultaneous Abstraction and Equilibrium Finding
In a 2015 paper, Brown and Sandholm show a method to combine action
abstraction and equilibrium finding together. An agent can start learning with a coarse
abstraction and then can add abstracted actions that seem like they would be useful,
which is determined by trying to minimize average overall regret. They showed that it
converges to improved equilibrium solutions with no computational time loss.

## CFR Extensions
In recent years, nearly all poker research has involved optimizations and extensions
on counterfactual regret minimization. Here we highlight five interesting developments from the past few years.

### Strategy Purification and Thresholding
In 2012, Ganzfried et al proposed that instead of solving abstract games for an equilibrium’s strategy and using this strategy in the full game, we can first modify the abstract equilibrium using procedures called purification and thresholding. The overall idea is that these approaches provide a robustness to the solutions against overfitting one’s strategy to one’s lossy abstraction, and the results do not always come at the expense of worst-case exploitability. 

Purification means that the player will always play his best strategy at each
information set with probability 1 (rather than play an action based on his behavioral
strategy distribution). In the case of ties, both strategies are played with uniform
probability. This is useful because it compensates for the failure of equilibrium
finding algorithms to fully converge in the abstract game.

Thresholding is a more relaxed approach, which simply eliminates certain actions
with probabilities below a threshold value $$\epsilon$$ , and then renormalizes the action probabilities. Logic given is that these strategies may either be due to noise or are
played primarily to protect a player from being exploited, which may be an overstated
issue about realistic opponents. A study was done using the game Leduc Hold’em and
for almost all abstractions, purification was shown to bring a significant improvement
in exploitability. Thresholding was also beneficial, but purification always performed
better in the cases that it improved exploitability.

Identical agents except for using either thresholding or purification were submitted to
the ACPC and the purification agent performed better against all opponents, including
the thresholding agent. In terms of worst case exploitability, the least exploitable was
the one that used a thresholding level of 0.15, perhaps because too much thresholding
results in too little randomness and no thresholding at all results in overfitting to the
abstraction.

### Decomposition
Decomposition, analyzing different subgames independently, has been a well known
principle in perfect information games, but has been problematic in imperfect
information games and when used has abandoned theoretical guarantees. In 2014,
Burch, Johanson, and Bowling proposed a technique that does retain optimality
guarantees on the full game. In perfect information games, subgames can be solved
independently and the strategy fragments created can be combined to form an optimal
strategy for the entire game.

Decomposition can allow large savings in the memory required to solve a game and
also allows for not storing the complete strategy, which may be too large, but rather to
store and recomputed subgame strategies as needed. Burch et al present a method of
using summary information about a subgame strategy to generate a new strategy that is no more exploitable than the original strategy. An algorithm called CFR-D, for
decomposition, is shown to achieve sub-linear space costs at the cost of increased
computation time.

### Endgame Solving
Earlier approaches tended to divide games into sequential phases, but now the focus
has tended towards solving the endgame specifically with a finer-grained abstraction. In 2015, Ganzfried and Sandholm modified the standard CFR abstraction
solution method by keeping the initial portion of the game tree and discarding the
strategies for the final portion, the endgames. Then in real time, they solve the
relevant endgame that has been reached using a linear program, with a greater degree
of accuracy than the initial abstract strategy. Bayes’ rule is used to compute the
distribution of player’ private information leading into the endgames from the
precomputed strategies from the initial part of the game. Another benefit of this
method is that “off-tree” problems are solved – that is, cases in which the opponent’s
action is not allowed in the abstraction will actually be solved exactly in the endgame.

Although endgame solving can lead to highly exploitable strategies in some games,
it’s shown to have significant benefits in large imperfect information games,
especially games where a significant strategic portion of the game is in the endgame.
This technique showed improved performance against the strongest agents from the
2013 ACPC.

In 2017, Brown and Sandholm advanced the previous methods by using nested
endgame solving in place of action translation in response to off-tree opponent
actions. This may have made the difference in defeating world class human
opponents.

### Warm Starting and Regret Pruning
Also in 2015, Brown and Sandholm found that it is possible to warm start in CFR
by using a predetermined strategy and that with a single full traversal of the game
tree, CFR is effectively warm started to as many iterations as it would have taken to
reach a strategy profile of the same quality as the input strategies, and the
convergence bounds are unchanged. By warm starting, CFR can bypass spending time 
analyzing early and expensive iterations that contain all nodes, even never-used ones
that would be pruned.

Brown and Sandholm developed a regret-based pruning (RBP) method in 2015 to
prune actions with negative regret temporarily (for the minimum number of iterations
that it would take for the regret to become positive in CFR). The idea is that strategies
at information sets that we don’t reach don’t impact our opponent’s regret. The
skipped iterations are then “made up” after pruning ends. This process was shown to
speed up CFR and then in 2016, they improved this with a new RBP version that can
even reduce the space requirements of CFR over time by completely discarding
pruned branches. Space for certain pruned branches is never needed, which was
proven by showing that this new version of RBP needs to only asymptotically store
actions that have positive probability in a best response to a Nash equilibrium, which
is a significant space requirement reduction in large imperfect information games like
poker. Finally, they showed that early iterations can be skipped by solving an
abstraction of the game and then warm starting CFR with these results in the full
game. Some suboptimal actions will only need to be traversed O(ln(T)) times over T
iterations.

### Deep Learning
Beginning in 2017 with the University of Alberta's DeepStack, poker algorithms have been relying on deep neural networks as an alternative or complement to game abstractions. Noam Brown et al published "Deep CFR" in 2018 that takes as input the exact cards and betting sequences to a neural network and outputs a fold, call, raise tuple, which effectively leaves the neural network to do the abstracting rather than requiring fixed abstractions built into the algorithm. As computer processing capabilities have improved, using large neural networks becomes an increasingly valuable method for approximately solving poker games. 

## Computer Poker Competitions

### The Annual Computer Poker Competition
In 2006, the University of Alberta and Carnegie Mellon University jointly founded
the Annual Computer Poker Competition (ACPC), which is now held at the Poker
Workshop of the annual Advancement of Artificial Intelligence (AAAI) conference
during the Poker Workshop part of the conference, which began in 2012.
The competition attracts both hobbyists and academics from around the world each
year, although a complaint is that supercomputer access that is possible for academics
may not be feasible for hobbyists. Each match is played in either HUNL or HULHE
consists of 3000 hands where each player starts with 200 big blinds, using blind sizes
of 50 and 100 and a minimum bet of 1 chip. Matches are played in duplicate so that
the same cards are given to each agent, then memories are cleared, and the same
match is played again with cards being dealt to the opposite player. 

There are two primary competition types. The first is instant-run off, where agents
earn or lose 1 point for each match’s win and loss, which favors small wins and
equilibrium solutions. The total bankroll competition type counts the total winnings of
each agent over all of its contests. This favors agents that are more exploitive.
Around 60 research groups and 120 programs have entered the ACPC so far. The
general strategy in recent years has been for teams to develop algorithms that allow
for larger and larger games to be solved, meaning that finer grained abstractions can
be used, which have generally correlated to stronger performance, though such a
result is not theoretically guaranteed, and counterexamples do exist.

MIT now even holds a mini-course called MIT Pokerbots in which students are given
one month to program autonomous pokerbots to compete against other teams in a
tournament. The contest receives heavy sponsorship from trading companies due to
the similarities in dealing with imperfect information and decisions based on
probabilities and statistics.

CFR is now the most common approach used in the ACPC. It was first seen in 2007
with Zinkevich and the University of Alberta CPRG, using imperfect recall
abstraction. CFR was used in 2/11 agents in 2012, 5/12 in 2013, 10/12 in 2014 (there
was no competition in 2015 and the details of the competitors for the 2016
competition have not been released as of early 2017, except for the winners). In 2013,
2014, and 2016, the top three agents in the bankroll and instant run-off competitions
all used some form of CFR.

Alberta’s Hyperborean won every limit hold’em run-off competition from 2006 to
2008 using an imperfect recall abstraction in CFR. In 2009 it was defeated by
GGValuta from the University of Bucharest, which also used CFR with a k-means
clustering algorithm to bucket postflop hands based on hand strength and potential.
Hyperborean again won in 2009 by solving independent portions of the game and
combining them. Hyperborean also won the 2010 no limit run-off event.
Hyperborean, Slumbot by Eric Jackson, and Tartanian from Carnegie Mellon have
consistently had excellent results since this time.

We will now briefly go over some of the winners and their techniques from the most
recent competitions. The 2014 winner was the Tartanian7 team from Carnegie Mellon. The program plays approximately a Nash equilibrium strategy that was
computed on a supercomputer. They developed a new abstraction algorithm that
clusters public flop boards based on how often their previous program grouped private
hands together on the flop with different sets of public cards. Within each of the
public flop clusters, the algorithm then buckets the flop, turn, and river hands that are
possible given one of the public flops in the cluster, using imperfect-recall abstraction. They did not do any abstraction for the preflop round.

They based their equilibrium finding algorithm on external-sampling MCCFR by
sampling one pair of preflop hands per iteration. Postflop, they sample community
cards from their public clusters and MCCFR in parallel, and add weights to the
samples to remove bias. They also used thresholding and purification and made
the interesting observation that it is valuable to bias towards conservative actions to
reduce variance, since higher variance means that the inferior opponent is more likely
to win.

Slumbot, by Eric Jackson, uses Pure External CFR for equilibrium computation. He
breaks the game tree into pieces to be solved separately and uses differing abstraction
levels depending on how often the game states are reached. Those more common ones
are given more granularity in both bucketing and bet sizes possible.

Prelude, by Tim Reiff, uses an equilibrium strategy based on Pure CFR and card
abstraction based on k-means clustering over hand strength distributions.
Hyperborean (for the auto run-off competition), made by the Computer Poker Games
Research Group from the University of Alberta, also uses Pure CFR, imperfect recall,
and k-means card bucketing abstraction. They interestingly use the final strategy of
the algorithm rather than the average strategy, which is the one proven to converge to
equilibrium. They use an asymmetric betting system in which the opponent can have
more options than the agent, including such actions as minimum-betting.

For the total bankroll competition, the program uses three distinct strategies and
chooses one based on an Exp4-like algorithm. Two of the strategies are data-biased
responses to aggregate data of competitors from the years 2011/12 and 2013, and the
other strategy is similar to the auto run-off competition strategy, but also separates
betting sequences into an “important” and “unimportant” part and creates more 
buckets for the important sequences. Importance is based on how often these
sequences are seen in self-play.

In 2016, only the no-limit hold’em total-bankroll and instant run-off competitions
took place. The same three teams took the top three places in both competitions.

Unfold Poker was trained by an experimental distributed implementation of the Pure
CFR algorithm and uses a heuristic to sometimes avoid certain game tree paths.
Certain bet sizes were omitted due to requiring an excessive amount of resources to
train and store and to compensate for imperfect recall, a distance metric that considers
features from all postflop betting streets was used to construct the card abstraction on
the river. Unfold Poker took 2nd place in the instant run-off event and 3rd in the
total bankroll event.

Slumbot took 1st in the instant run-off and 2nd in the total bankroll by using a new
memory-efficient CFR technique called Compact CFR, which was detailed in the
section on CFR above.

Finally, Carnegie Mellon University’s Baby Tartanian 8 won the total bankroll
competition and took 3rd place in the instant run-off event. Baby Tartanian 8’s main
new feature was to add pruning to cut down actions worth considering. They also took
feedback from the 2015 man vs. machine competition in which Tartanian 7 suffered a
loss. Noam Brown, the PhD student who designed Baby Tartanian 8, says he hopes
that it will be capable of beating humans within 2-3 years and he has since put
his agent to the test.

Going forward, the event will feature six player games, which will accelerate research
towards games that are commonly played by humans and present a new set of
complexities, including whether the optimal approach is to aim for opponent
exploitation or to continue on the unexploitable path, despite multiplayer games
invalidating theoretical results that would be valid in zero-sum games.
