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

1. 2017 DeepStack: Expert-Level Artificial Intelligence in No-Limit Poker by the CPRG (DeepStack)
2. 2018 Superhuman AI for heads-up no-limit poker by CMU (Libratus)
3. 2019 Superhuman AI for multiplayer poker by CMU and Facebook (Pluribus)
4. 2020 Unlocking the Potential of Deep Counterfactual Networks by Minimal AI (Supremus)
5. 2020 Combining Deep Reinforcement Learning and Search for Imperfect-Information Games by Facebook (ReBeL)

## DeepStack
http://www.depthfirstlearning.com/2018/DeepStack 

In early 2017, a new paper called DeepStack [82] was released and showed a
completely new framework for solving poker games. Although they claimed that it
was the first NLHE agent to defeat human players, the selected players are mostly
unknown and at most played 3,000 hands against DeepStack (for a total of 44,000
hands, although variance reduction measures were taken), making this less impressive
than the Libratus victory.
The agent effectively solves for actions as the situations arise, rather than solving the
entire tree offline. It is made up of three components: A local strategy computation for
the current public state, depth-limited lookahead using a learned value function, and a
restricted set of lookahead actions. The strategy is computed during play and is static
and stochastic.
106
To re-solve at any public state, DeepStack keeps track of its own range a vector of
opponent counterfactual values. It does use recursion like CFR, but does not store a
complete strategy prior to play. Therefore it can eschew the standard abstraction
techniques and instead uses a neural network to “guess” where each play will end up,
which was trained using thousands of random poker hands. It effectively uses a fast
approximation estimate, rather than computing all possibilities beyond a certain depth,
which the paper refers to as what a poker player would call a “gut feeling”. They
showed that this agent is significantly less exploitable than the abstraction-based
techniques.
On the preflop and flop, it solves until the end of the round and then consults a deep
neural net for an estimated value of playing the turn and river. On the turn and river, it
solves from the current decision until the end of the game and resolves after every
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

## Libratus
https://www.youtube.com/watch?v=xrWulRY_t1o
https://upswingpoker.com/brains-vs-ai-challenge-libratus-analysis/
https://www.twitch.tv/libratus_vs_jasonles
https://www.pokernews.com/news/2017/01/how-to-watch-the-brains-vs-ai-poker-rematch-26767.htm
https://www.theverge.com/2017/1/11/14243170/ai-poker-tournament-live-stream-time-cmu-computer-vs-humans
https://www.technologyreview.com/s/603342/poker-is-the-latest-game-to-fold-against-artificial-intelligence/

## Pluribus
https://www.wired.com/story/new-poker-bot-beat-multiple-pros/amp 
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