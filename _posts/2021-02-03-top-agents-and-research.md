---
title: "AIPT Section 5.1: Top Poker Agents -- Top Agents and Research"
date: 2021-02-03
sidebar:
  nav: "nav"
toc: true
toc_sticky: true
toc_label: "TOC"
author_profile: false
---
# Top Poker Agents - Top Agents and Research
The biggest breakthroughs in AI poker primarily came from research groups at Carnegie Mellon University (CMU) and the University of Alberta's Computer Poker Research Group (CPRG). We previously discussed the "Heads-up Limit Hold'em Poker is Solved" paper by the CPRG that came out in 2015 and solved Limit Hold'em Poker with an agent called Cepheus. This was a big result, but most human players play No Limit Hold'em poker, so we focus this section on the most recent important results in no limit: 

1. 2017 DeepStack: Expert-Level Artificial Intelligence in No-Limit Poker by the CPRG (DeepMind)
2. 2018 Superhuman AI for heads-up no-limit poker by CMU (Libratus)
3. 2019 Superhuman AI for multiplayer poker by CMU and Facebook (Pluribus)
4. 2020 Unlocking the Potential of Deep Counterfactual Networks by Minimal AI (Supremus)
5. 2020 Combining Deep Reinforcement Learning and Search for Imperfect-Information Games by Facebook (ReBeL)

As agents get stronger and stronger, it will be exciting to see what comes next. 

## [DeepStack](https://www.deepstack.ai/)
In 2017, a new paper called DeepStack was released by DeepMind that showed a
completely new framework for approximately solving poker games and possibly the first to make use of neural networks. Although they claimed that it
was the first NLHE agent to defeat human players with competitions that occurred in late 2016. the selected players were mostly
unknown and at most played 3,000 hands against DeepStack (there was a total of 44,000
hands against 33 players from 17 countries), making this less impressive
than the recent Libratus (CMU agent) victory that had occurred in 2017 in a major AI vs. humans competition against top professionals (see Section 5.2). 

Variance reduction measures were taken, which makes the relatively low sample size more statistically significant -- the AIVAT variance reduction algorithm reduced the standard deviation in the experiments by 85% (see below for more details). However, human players do better after getting used to how opponents play and getting used to the game software/setup, so small hand samples seem biased in favor of the AI agent. 

That said, DeepStack won 49 big blinds per 100 hands, which is an absolutely huge winrate, over four standard deviations from zero. However, I would have been more impressed with a strong, but lower winrate, against professional players over bigger samples. (The players who played against DeepStack did actually consider themselves professionals, but there is a vast difference between top players in the world and average professional players -- I would know!) Players were incentivized with prizes of $5,000, $2,500, and $1,250 to the top three best results. 

The agent effectively solves for actions as the situations arise, rather than solving the
entire tree offline as was the standard paradigm with abstracting the game and solving the abstracted game in full and then translating the solution back to the full game. 

It is made up of three components: "A local strategy computation for
the current public state, depth-limited lookahead using a learned value function, and a
restricted set of lookahead actions", which together describe heuristic search, which is implemented cleverly to work effectively in the imperfect information setting.  

DeepStack uses re-solving to locally solve for strategies as they come up in play. With this technique, the agent is able to avoid abstracting the game because it doesn't need to compute a full strategy in advance, as is standard in CFR implementations, which compute a fixed strategy offline. 

To re-solve at any public state, DeepStack keeps track of its own range and a vector of
opponent counterfactual values. It does use recursion like CFR, but does not store a
complete strategy prior to play. Instead of abstraction, it uses a neural network to “guess” where each play will end up,
which was trained using a very large amount of random poker hands. This is an interesting technique, but would seem to make the algorithm less generalizable than if it was able to learn completely from scratch as standard CFR methods do. 

 It effectively uses a fast
approximation estimate, rather than computing all possibilities beyond a certain depth,
which the paper refers to as what a poker player would call a “gut feeling” or intuition. 

The restricted set of lookahead actions are used so that DeepStack can act very fast (normally within about 5 seconds). The actions include fold, call, 2-3 bet actions, and all-in. 

They
showed that this agent is significantly less exploitable than the abstraction-based
techniques, which makes sense given how much abstraction is required to reduce No Limit Hold'em to a tractable size. 



On the preflop and flop, it solves until the end of the round and then consults a deep
neural net for an estimated value of playing the turn and river. On the turn and river, it
solves from the current decision until the end of the game and does re-solving after every
opponent action. By considering a small local subgame to pick actions given only the
public state and summary information from earlier in the hand, powerful local search
techniques have been reintroduced to the imperfect information setting, thus
eliminating abstraction, which was able to be exploited by humans and tended to miss
fine card details, which are particularly important in large pots.
Although humans are generally appreciative of improved algorithms that help in daily
life, like music recommendations, improved medical predictions, and which baseball
player to draft for the team, the progressively stronger poker agents are scary for the
poker community as they can be launched (illicitly) in the real world and even if they
can’t quite yet beat the strongest experts, they are still capable of taking a lot of
money out of the economy from weaker players.

### AIVAT Variance Reduction
DeepStack was measured against opponents using [AIVAT (A New Variance Reduction Technique for Agent Evaluation in Imperfect
Information Games)](https://arxiv.org/pdf/1612.06915.pdf) to substantially reduce the variance in the games by 85%, which can reduce the required number of games by a factor of 10. AIVAT stands for action informed value assessment tool and is proven to be unbiased. 

During the first No Limit Hold'em competition in 2015, the humans beat CMU's AI over 80,000 hands, but there were still uncertainties about whether the match was statistically significant. 

AIVAT effectively uses the known expected value changes of chance (cards that come onto the board) and the strategies of a known agent to reduce the variance. Poker players are familiar with a version of expected value that is called "All-in expected value". In normal games with humans there is no known agent strategy, but we can use a variance reduction measure strictly for all-in situations. When a player is involved in an all-in, the all-in EV calculation measures the value of the all-in according to the player's equity (chance of winning the pot multiplied by the pot size). 

For example, if two players got allin with AA against JJ, AA is approximately an 80% favorite, so if they each put in $100 for the allin, then the pot would be \\$200 and AA would have $160 equity, for an all-in expected value of +\\$60. However, the true outcome will be either +\\$100 or -\\$100. Many poker sites now have the option to "run it twice", to run out an all-in twice to help reduce the variance. 

Another common variance reduction technique is using duplicate games, where each hand is played with the reverse cards. For example, we would play 100 hands where I get dealt a specific set of cards and opponent gets a dealt specific set of cards and then repeat the hands where the cards are swapped. This isn't practical with only humans since we would remember cards and hands, but is practical with agent vs. agent since memories can be reset and is also possible with agents vs. humans whereby one agent can play two humans simultaneously where in one game the human is getting X cards and the agent is getting Y cards and on the other the human is getting Y cards and the agent is getting X cards. 

AIVAT uses correction terms that are "constructed in a fashion that shifts an estimate of the expected value after a choice was made towards an estimate of
the expected value before the choice. These terms have expected value of zero and are combined with an unbiased estimate of player value."

Using an abstracted form of Heads Up No Limit Hold'em with 1 and 2 chip blinds and 200 chip starting stacks for experiments over 1 million hands, AIVAT resulted in about a 68% reduction in standard deviation. This was superior in DeepStack because in this experiment, the abstracted game was quite small (8 million information set states), it does a poor job of distinguishing the value of cards since the abstraction is very coarse. 

## Libratus
Libratus was CMU's agent from 2017 that beat four of the best poker players in the world in a 120,000 hand match. It was created by Noam Brown and Tuomas Sandholm. 

The agent, like DeepStack, has three main components, where the latter two are the real keys to success for Libratus:

1. Game abstraction. This part follows the standard solving paradigm of solving an abstracted game and translating the play back into the full game. Their abstraction is what they call the "blueprint strategy", which gets less sophisticated deeper into the game tree (recall that preflop only has 169 independent game states). In practice, this involved abstracting both bet sizes and hand possibilities, both of which were performed algorithmically. Given the abstraction, the agent ran Monte Carlo CFR, which was sped up by a factor of three by pruning actions that seemed very unlikely to be useful. 

2. Real-time solver. Since the abstractions are not as sharp later in the game, a real-time solver is called, which works in conjunction with the blueprint strategy from the first component. Additionally, actions outside of the main blueprint are solved specifically with that action included (called "nested subgame solving"), eliminating the need for what can be a messy translation process to interpret off-abstraction bets in the full game. 

3. Self-improver. Since the real-time solver is periodically working to solve subgames that were not included in the initial abstraction, this component inserts those into the blueprint to strengthen the blueprint. This is valuable because rather than randomly filling in parts of the tree, specifically parts of the tree that are actually seen in practice are filled in, which makes sense because on average these situations or situations similar to these are going to happen more frequently (which is why for poker players, many hands are so routine because they've seen the similar situation so frequently in the past). 

Libratus was tested against 2016 agent Baby Tartanian8, the winner of the most recent ACPC tournament. Using only the game abstraction, Libratus lost to this agent, but after adding in the real-time solver, Libratus soundly won. It also won soundly against four of the best human players in the world in a 2017 "Brains vs. Artificial Intelligence" three week competition that is detailed in the section on AI vs. Human competitions. 

## Pluribus
https://www.wired.com/story/new-poker-bot-beat-multiple-pros/amp 
https://ai.facebook.com/blog/pluribus-first-ai-to-beat-pros-in-6-player-poker/ 
https://www.wired.com/story/poker-playing-robot-goes-to-pentagon/ 
https://www.wsj.com/articles/computers-can-now-bluff-like-a-poker-champ-better-actually-11562873541
https://www.npr.org/2019/07/11/740661470/bet-on-the-bot-ai-beats-the-professionals-at-6-player-texas-hold-em?utm_campaign=npr&utm_term=nprnews&utm_medium=social&utm_source=twitter.com 
https://ai.facebook.com/blog/pluribus-first-ai-to-beat-pros-in-6-player-poker/
https://arstechnica.com/science/2019/07/facebook-ai-pluribus-defeats-top-poker-professionals-in-6-player-texas-holdem/
https://gizmodo-com.cdn.ampproject.org/v/s/gizmodo.com/superhuman-ai-crushes-poker-pros-at-six-player-texas-1836257695
https://www.cnet.com/news/facebook-ai-forces-poker-pros-to-fold-in-texas-holdem-tourney/
https://qz.com/1664382/a-poker-ai-that-beats-world-class-players-funded-by-facebook/amp/
https://www.lesswrong.com/posts/6qtq6KDvj86DXqfp6/let-s-read-superhuman-ai-for-multiplayer-poker 
https://www.businessinsider.com/pluribus-facebook-wont-release-code-superhuman-ai-poker-bot-2019-7 
https://edition.cnn.com/2019/07/11/tech/facebook-carnegie-mellon-ai-texas-hold-em-poker/index.html
https://www.technologyreview.com/s/613943/facebooks-new-poker-playing-ai-could-wreck-the-online-poker-industryso-its-not-being/
https://www.nytimes.com/2019/07/11/science/poker-robot-ai-artificial-intelligence.html
https://techcrunch.com/2019/07/11/ai-smokes-5-poker-champs-at-a-time-in-no-limit-holdem-with-ruthless-consistency/
https://www.reddit.com/r/MachineLearning/comments/ceece3/ama_we_are_noam_brown_and_tuomas_sandholm/
https://www.bbc.com/news/technology-48959931
https://onezero.medium.com/facebooks-poker-bot-shows-how-a-i-can-adapt-to-liars-d10d5b75fac5 
https://www.washingtonpost.com/science/2019/07/11/ruthless-superhuman-poker-playing-computer-program-makes-elite-players-fold/?utm_term=.bb3b84dc89f4
https://news.ycombinator.com/item?id=20414905
https://www.nature.com/articles/d41586-019-02156-9?utm_source=twt_nnc&utm_medium=social&utm_campaign=naturenews&sf215655190=1
https://docs.google.com/document/d/1ZLm5GX_sbmiqlxFlZMWPidI7ttVe7n32YlLkZcRiExw/edit#heading=h.352hdg40tsq8
https://www.theverge.com/2019/7/11/20690078/ai-poker-pluribus-facebook-cmu-texas-hold-em-six-player-no-limit 
https://fivethirtyeight.com/features/robots-are-beating-humans-at-poker/
https://science.sciencemag.org/content/suppl/2019/07/10/science.aay2400.DC1 
https://science.sciencemag.org/content/early/2019/07/10/science.aay2400 
https://www.sciencenews.org/article/artificial-intelligence-has-now-pretty-much-conquered-poker

## Supremus
https://arxiv.org/pdf/2007.10442.pdf 

## ReBeL
https://arxiv.org/pdf/2007.13544.pdf 
https://www.youtube.com/watch?v=BhUWvQmLzSk 
https://ai.facebook.com/blog/rebel-a-general-game-playing-ai-bot-that-excels-at-poker-and-more/

## What's next? 
I'm excited to see agents that might work more on opponent exploitation rather than optimal play. For example, updating strategies according to opponents or testing small changes to strategies to see if they perform better. 