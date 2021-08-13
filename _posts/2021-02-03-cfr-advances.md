---
title: "AIPT Section 4.4: CFR -- CFR Advances"
date: 2021-02-03
sidebar:
  nav: "nav"
toc: true
toc_sticky: true
toc_label: "TOC"
author_profile: false
---
# CFR - CFR Advances
Now almost 15 years after the CFR algorithm was originally published by the University of Alberta in 2007, there have been a number of significant advances. Perhaps the most important was the use of Monte Carlo sampling that was discussed in the main CFR section, which allows the algorithm to work significantly faster. In Section 1.2 History of Solving Poker, we touched on some advanced like strategy purification (always playing the best strategy instead of distributing strategy over a distribution), decomposition (analyzing different subgames independently), endgame solving (using a finer abstraction to solve the endgame part specifically), and warm starting CFR with a strategy that saves many iterations rather than starting with a uniform random strategy. 

Here we want to focus specifically on a few of the most important advancements. 

## CFR+
Oskari Tamemelin, an independent researcher, first published a paper about CFR+ in July, 2014, which was then popularized by the University of Alberta when they used it to completely solve Heads Up limit Hold'em Poker, one of the most majors breakthroughs in the field of poker research, which was published in Science in January, 2015. 

This was the first time that a full, unabstracted game, that is regularly played in casinos was completely solved. While prior improvements to the vanilla CFR algorithm focused on sampling, CFR+
in fact does not rely on any sampling. CFR+ was found to be a good candidate for
using compression since all values are updated at each iteration. This was used to sort
boards and private cards in order and to use prior values to predict the next values and
then store errors on the predicted values rather than their values directly. 

<!-- equation -->

The main enhancement with CFR+ is that regret matching is replaced with newly
created regret matching plus (+). In short, any time an action's regret_sum goes negative, we reset it to 0. The regret matching concept remains the same and the difference is that the R regret
matching values are replaced by the new Q regret matching plus (+) values, which are
defined above in terms of R. The main difference is that each term calculated in the
regret matching is always non-negative, so future positive regrets are immediately
added to these values, rather than cancelling out accumulated negative regret. This
means that actions are chosen again after “proving themselves useful” again instead of
potentially becoming very negative and never having a chance to come back.

We can imagine an unlucky situation in poker that results in a large loss and CFR+ is essentially saying that we should act as if we haven't seen this situation before and reset its regret sum to 0 to give it more chances to be useful. Regular CFR would put this move in a deep hole that could take a very, very long time to climb out of. 

The Alberta researchers also found, empirically, that the final step in regular CFR
versions of computing the average strategy as the strategy that is a Nash equilibrium
is not necessary (the current, non-average, strategy also approaches zero), and we can
simply use the final strategy at the last iteration as the computed solution. They
also showed that the Nash approximation e is at most twice the final strategy’s
exploitability

Tammelin and the CPRG at Alberta also proved that CFR+ and CFR have the same
regret bounds. If using a linear-increasing weighted average strategy, then
asymptotic guarantees on equilibrium are held and convergence is faster in CFR+ (the 
initial paper version did not use average strategies, but a weighted average strategy
was used in a later paper to show proof of convergence), although not in CFR.

They showed that CFR+ using either current (i.e., final) or average strategy results
converges faster than CFR and using average strategy converges faster in Rhode
Island Hold’em (a simple poker game with one private card and two communal cards
and three betting rounds).

Why did they base CFR+ on Vanilla CFR and not the faster converging sampling
versions? They found that CFR+ did not work well with sampling because regret
matching plus did not work well when sampling noise was present.


## [Deep Counterfactual Regret Minimization](https://arxiv.org/abs/1811.00164)
Deep CFR was published in 2019 by Noam Brown et al. from Facebook AI Research. This was a super important paper that makes use of deep neural networks as an alternative to the abstraction, solving, translation paradigm that was previously standard. The previous method involves abstracting a game to make it smaller and tractable for the tabular (standard) CFR algorithm. Then the solution is translated (mapped) back into the full game, but this translation process can result in problems and exploitations. A solution to an abstracted game that only has five bet options may do poorly back in the real game when there are hundreds of possible bets. Certain abstractions can also miss important strategic elements of a game. For example, if the only bet options are check, half pot, and pot, then important poker tools like very small bets and overbets (bets larger than the pot) will be completely ignored. 

Deep CFR aims to move on from abstractions by approximating CFR in full poker games, which is the first non-tabular version of CFR to do so. 




Single Deep CFR 
https://arxiv.org/pdf/1901.07621.pdf



AIVAT Variance Reduction
https://arxiv.org/pdf/1612.06915.pdf 