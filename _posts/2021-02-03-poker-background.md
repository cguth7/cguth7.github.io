---
title: "AIPT Section 1.1: Background -- Poker Background"
date: 2021-02-03
sidebar:
  nav: "nav"
toc: true
toc_label: "TOC"
toc_sticky: true
author_profile: false
---

# Background -- Poker Background
A number of games have been used as artificial intelligence research domains including chess, checkers, Go, and poker, but poker is unique amongst these games because of its key element of imperfect information. In poker, this is the inability to see an opponent’s hole cards. 

Additionally, poker is an exciting domain because it has chance events, it has simple rules yet complex strategy, and it's frequently and competitively played around the world by human players with a variety of skill levels. 

Games can be scaled to different levels of complexity, which allows algorithms to be tested in simplified environments and humans to understand the fundamentals before moving on to more advanced games. It's exciting to see the strategies that poker AI algorithms can generate -- how they use what might seem like very human-like decisions like bluffing and slow playing, and also to look at how algorithm strategy and human strategy differ. 

Unlike perfect information games, imperfect information games tend to have more in common with real world decision making settings. Solving such games can be translated into solving real-world applications with similar properties, and applications can be found, for example, in security, including decisions about which stations to deploy officers to, and in medical decision support.

## Why Play Poker? 
If you like playing games in general and you like math and the psychology of thinking about what other people are thinking, then poker could be a great fit! It doesn’t matter if you’re tall or fast or athletic -- your advantage comes from making good decisions that are based on understanding some math, knowing your opponents, and controlling your emotions. 

To be good at poker, you have to think not only about your own hand, but also about your opponents and about the math of each situation. While there is some luck involved, over time that evens out for everyone and your skill and decisions are what will make you a winning player in the long-run. 

In recent years poker at the highest levels has become increasingly mathematical, with top players spending significant time running game simulations and having an understanding of game theory optimal play, even though it's impractical to play optimally all the time, and in many settings it makes much more sense to go after individual opponents' weaknesses. 

## Wait, isn't poker gambling?
First, we should explain the difference between games like poker and casino games like Blackjack. In casino games, players play against the “house” -- the casino itself. The casino plays games that give it an advantage, so when playing against the casino, you are generally placing bets that will always lose in the long-run, although may result in short-term wins.

Poker is completely different. In poker, you play against other people (and hopefully not bots!). Your only advantage or disadvantage is determined by how good you are compared to the others at the table. In the long-run, the more skilled players will win and the less-skilled ones will lose, although in the short-term, players can get lucky. 

The casinos take a small portion of every pot as their “rake”, or fee, for hosting the game, so in order to win you have to have a skill advantage that also can “beat” the rake. (Note that in this tutorial we ignore rake and assume that any amount won by one player was lost by another.) Depending on the table, you could easily have a huge advantage and have a very high expected win-rate. 

Poker is a skill game with a chance element. That means that it is mostly based on skill and better players have clear advantages over worse players based on their actions, but there is some random luck in the game, like which cards come out of the deck and which situations you find yourself in. 

Think about it like this. If you have a coin that lands heads 70% and tails 30%, it wouldn’t be that surprising to get tails one time (it will happen 30% of the time), but if you flipped the coin 10 times, you’ll see more heads than tails about 85% of the time, a tie about 10% of the time, and more tails than heads about 5% of the time. Imagine that you are better than most people at the table and have a 70% chance of winning each time that you play. This means that only 5% of the time over 10 sessions will you have 6 or more losses, so in the long-run you are a big favorite, but there is a lot of randomness in the short-run. 

This might sound frustrating. If you’re better than your opponents, it would be annoying to lose, even if it only happens 30% of the time. But actually this is fantastic! This means that players can easily overestimate their skill level. They can get lucky and think that is normal or they can have average luck and think they’re actually getting very unlucky. In pure skill games like chess, an amateur will virtually never beat a top player, but in poker they have a chance! This means that you may have to suffer through some unlucky streaks, but your advantage is in your long-run skill. 

Poker can be played for free by using chips to count as “play” money. I prefer the idea of playing for tiny amounts of money (as low as a few cents) since people tend to care a lot more if there is at least *something* at risk, and this makes games a lot more fun when there’s some competitiveness and people care about the outcomes (otherwise why not just play every hand?). 

## Poker History
Poker has been around for a long time, since the early 1800s. The World Series of Poker event in Las Vegas started in 1970 and now takes place every summer. 

Poker grew extensively in the early 2000s thanks to the beginnings of online poker, which lead to an accountant and amateur poker player named Chris Moneymaker investing \\$39 in an online satellite tournament on PokerStars that won him a \\$10,000 seat at the World Series of Poker Main Event in 2003, alongside 838 other entrants.

Moneymaker went on to defeat professional poker player Sam Farha at the final table of the tournament and won \\$2.5 million. A poker boom was sparked. If Moneymaker could do it, “so could I”, was the feeling that pervaded throughout America, and led to massive player pools on the Internet and in subsequent World Series’ of Poker.

After the human poker boom, computers also started getting in on the poker action. Researchers began to study solving Texas Hold’em games since around 2003, and since 2006, there has been an Annual Computer Poker Competition (ACPC) at the AAAI Conference on Artificial Intelligence in which poker agents compete against each other in a variety of poker formats. Recent competitions and research in the realm of poker has focused on the most popular game, Texas Hold’em, which can be played with set bet sizing, “limit”, or as a “no limit” game where, as implied, one can bet any amount up to what one has in front of him on the table. Although the rules of play are relatively simple, Texas Hold’em is a very deep
and complex game. In early 2017, for the first time, a NLHE poker agent defeated and is considered superior to top poker players in the world. These games, however, have huge state spaces, so in this tutorial we will primarily focus on smaller toy games with similar principles, but that are much smaller and with simpler rules. 

Although the majority of computer poker research seems to be for academic purposes, there have been multiple instances of significant rings of poker agents, or bots, playing for real money on the internet, despite the use of them being strictly forbidden. In June of 2015, a group of players from Russia and Kazakhstan won nearly $1.5 million at low stakes poker tables in Omaha Hold’em, a game even more sophisticated than Texas Hold’em. Although poker sites (at least the respectable ones) have security protocols in place to catch such players, in this case and many other cases, alert players are the first ones to notice something suspicious, who then raise the issue with the poker sites.

## Poker Rules
Poker is a card game that, in its standard forms, uses a deck of 52 cards composed of four suits (Clubs, Diamonds, Hearts, and Spades) and 13 ranks (Two through Ten, Jack, Queen, King, and Ace). 

A dealer button rotates around the table indicating who is the “dealer”. This is decided at random for the first hand and rotates clockwise after that. All actions begin to the left of the hand’s current dealer player.

In this tutorial, we will mainly focus on two player games and ignore any fees (also known as rake) such that the games will be zero-sum. Further, to simplify the games, in many settings we will reset each player’s starting chips to the same amount before every hand. The two players play a match of independent games, also called hands, while alternating who is the dealer.

Each hand starts with the dealer player posting the small blind and the non-dealer player posting the big blind. The blinds define the stakes of the game (for example, a \\$1-\\$2 stakes game has blinds of \\$1 and \\$2) and the big blind is generally double the small blind. They are called blinds because they are forced bets that must be posted
“blindly”. The player to the left of the big blind, in this case the dealer player, begins the first betting round by folding, calling, or raising. (In some games antes are used instead of or in addition to blinds, which involves each player posting the same ante amount in the pot before the hand.)

Each game goes through a series of betting rounds that result in either one player folding and the other winning the pot by default or both players going to “showdown” after the final round, in which both show their hands and the best hand wins the pot. The pot accumulates all bets throughout the hand. The goal is to win as many chips from the other player as possible.

Betting options available throughout each round are: fold, check, call, bet, and raise. Fold means not putting in any chips and “quitting” the hand by throwing the cards away and declining to match the opponent’s bet. Check or call means that a player contributes the minimum necessary to stay in the hand based on previous action. If no previous bet was made, this is called a check, which means putting in no further chips, but still staying in the hand (this is also referred to as a pass). If previous bets were made, then one puts in the exact amount of the bet, a call.

Betting or raising is when players put in more chips than needed to stay in the hand and generally represents a strong hand, although the actual hand could be strong or weak, in which case the player would be bluffing. In the case of betting, 0 chips were required to continue, but the player decides to wager chips. Raising is when an opponent player bet and a call was possible, but instead additional chips are added (effectively calling and betting together).

## Texas Hold'em
Texas Hold'em is the most popular poker game and is played regularly in casinos and tournaments around the world. 

Each hand in Texas Hold’em consists of four betting rounds. Betting rounds start with each player receiving two private cards, called the “preflop” betting round, then can continue with the “flop” of three community cards followed by a betting round, the “turn” of one community card followed by a betting round, and a final betting round after the fifth and final community card, called the “river”. Community cards are shared and are dealt face up. On each round, players combine their private cards with the community cards to form the best possible 5-card poker hand, which could include 0, 1, or 2 private cards. 

No limit Texas Hold'em, referred to as the "Cadillac of poker" in the Rounders movie, was considered the Cadillac because in theory no limit can mean that players have very large stacks of chips and therefore could have a lot of money at risk on each hand, leading to very tough poker decisions. Note that no limit means no limit betting based on money at the table only. Most games now have capped buyins so players don't normally have huge amount of money at the table relative to the big blind and also Pot Limit Omaha Hold'em has gained popularity recently and is arguably a more skillful game. 

In no limit betting, the minimum bet size is the smaller of the big blind or a bet faced by the player and the maximum bet size is the amount of chips in front of the player. In the case of a two-player game, the dealer button pays the small blind and acts first preflop and then last postflop.

In limit betting, bets are fixed in advance based on the stakes of the game and the blinds. For example, with 2-4 blinds, the bets preflop and on the flop are 4 and on the turn and river, they are doubled to 8. In limit betting, there is a maximum of four bets and raises per betting round per player, which, in addition to the limited available set of actions, makes limit-based games significantly smaller than their no-limit counterparts. These rules also make game decisions easier, because individual mistakes are relatively very small to what could happen in the no limit variant. 

## Kuhn Poker
Kuhn Poker is the most basic useful poker game that is used in computer poker research. It was solved analytically by hand by Harold Kuhn in 1950. Each player is dealt one card privately and begins with two chips. In the standard form, the deck consists of only three cards – an Ace, a King, and a Queen, but can be modified to contain any number such that the cards are simply labeled 1 through n, with a deck of size n. 

Players each ante 1 chip (although most standard poker games use blinds, this basic game does not) and rotate acting first, and the highest card is the best hand. With only 1 chip remaining for each player, the betting is quite simple. The first to act has the option to bet or check. If he bets, the opponent can either call or fold. If the opponent folds, the bettor wins one chip. If the opponent calls, the player with the higher card (best hand) wins two chips.

If the first to act player checks, then the second player can either check or bet. If he
checks, the player with the best hand wins one chip. If he bets, then the first player
can either fold and player two will win one chip, or he can call, and the player with
the best hand will win two chips. 

## Leduc Poker
Leduc Poker (Leduc is a city in Alberta, Canada and the game was made up by the team at the University of Alberta) is played with a deck of 6 cards -- 2 Jacks, 2 Queens, and 2 Kings. It's played as a 2-player game where each player antes one chip and is dealt one card. The game plays similarly to Limit Texas Hold'em, but in a much smaller format. There are two betting rounds -- one when each player has their private hole card and one (if action proceeds past the first round) after a single shared community card is dealt from the remaining four cards in the deck. 

During the first betting round, all bets/raises are fixed at 2 chips. Depending on the variation, there can be a maximum number of bets/raises in each round (usually either two or four). 

If there is a check-check or bet and call in the first round, then the community card is revealed. Players construct their hand based on their private card and the community card, so the sequence of hands from best to worst are KK, QQ, JJ, KQ, KJ, QJ. After the community card is revealed, each player's hand strength can change considerably, just like in Texas Hold'em. Then comes the final betting round, where each bet/raise is fixed at 4 chips and again there is a maximum number of bets/raises, usually either two or four. The hand ends either when one player folds or when a bet is called and both players reveal their hands for the showdown, with the better hand taking the pot. 

## Royal No Limit Hold’em
Royal NLHE is played very much like standard NLHE. The Royal part refers to using
only the “royal” cards Ten, Jack, Queen, King, and Ace. Therefore the deck is
composed of 20 cards rather than the standard 52. In our variation we will only use
the first three community cards (the flop) rather than all five as in the full version of
No Limit Texas Hold’em. This means there are only two betting rounds, the preflop
round and the flop round.

The standard version of Royal NLHE we will use is called 2-\\$20 \\$1-\\$2 No Limit Royal Hold’em. 2-\\$20 refers to there being 2 betting rounds and each player starting the match with \\$20 chip stacks, which also reset to \\$20 in all subsequent hands. The blinds are fixed at \\$1 small blind and \\$2 big blind for each hand. Since the starting 14 chip stacks are \\$20 and the blinds are \\$1 and \\$2, each player plays each hand with a 10 big blind stack.

This game is strategically similar to standard No Limit Texas Hold’em, but does vary because certain odds are changed significantly such as at minimum having at least one pair after the flop. These simplifications allow for the game to be analyzed by standard computers in unabstracted form. 

# Glossary and Abbreviations
Annual Computer Poker Competition (ACPC): The computer poker competition that
took place yearly at the AAAI Conference on Artificial Intelligence

All-in: When a player bets all of their chips

Ante: A forced bet at the beginning of a hand for all players

Bet: To wager chips

Betting round: A sequence in which every player in the hand can act

Big Blind (BB): The forced bet made by the non-dealer player in the case of a 2-
player game; generally double the size of the Small Blind

Big blinds per hand: The amount of big blinds won per hand on average over a sample
of hands

Call: To match an opponent’s wager

Chance Sampling (CS): Monte Carlo CFR sampling method that samples only chance
nodes

Check: An action available when no opponent has bet, which functions as a pass
6

Computer Poker Research Group (CPRG): The University of Alberta’s poker research
group that has led important research in computer poker including developing CFR,
completely solving HULHE, and developing DeepStack

Counterfactual Regret Minimization (CFR): The iterative algorithm that has been
used since 2007 to find Nash equilibrium solutions to one vs. one poker games by
using regret matching to select strategies at each node and minimizing the regret at
each node in order to minimize overall regret. The algorithm results in a Nash equilibrium strategy taken by averaging strategies throughout the course of the run. 

External Sampling (ES): Monte Carlo CFR sampling method that samples chance
nodes and opponent nodes (all nodes external to the acting player)

Flop: The first three public cards that are shown in Hold’em games, after the preflop
betting round

Fold: To surrender the hand when facing a bet

Heads-Up (HU): One vs. one

Kuhn Poker: Very basic poker game in which each player starts with $2 and each
antes \\$1 and is dealt one card, then there is one betting round in which the remaining
\\$1 can be bet

Limit Hold’em (LHE): Texas Hold’em variation with fixed betting on each round,
based on the stakes of the game

Monte Carlo Counterfactual Regret Minimization (MCCFR): CFR using sampling so
that each iteration is faster and regrets are updated faster, which has resulted in faster
convergence, despite more iterations being needed

No Limit Hold’em (NLHE): Texas Hold’em variation which is now the most popular
poker game, in which each player can bet up the amount of chips in front of him on
each hand

Pot: The total amount of chips wagered by all players combined

Private cards: Cards private to only one player

Public cards: Cards shown to all players

Raise: To match a bet and increase it; a raise represents a strong hand

Royal Hold’em: Texas Hold’em variation that uses a 20-card deck instead of the
standard 52-card deck, using only cards Ten and higher

River: The fifth and final public card in Hold’em games

Showdown: When multiple players who have not folded reach the end of the hand and
must show their cards to see who has the better hand

Small Blind (SB): The forced bet made by the dealer player in the case of a 2-player
game; generally half the size of the Big Blind

Stack: The amount of chips a player has

Texas Hold’em: The most common type of poker played by humans, which consists
of each player getting two private cards, followed by a betting round, and then betting
rounds after each of the Flop (first three public cards), Turn (forth public card), and
River (fifth and final public card)

Turn: The fourth public card in Hold’em games