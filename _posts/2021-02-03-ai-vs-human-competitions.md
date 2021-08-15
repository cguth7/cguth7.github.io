---
title: "AIPT Section 5.1: Top Poker Agents -- AI vs. Human Competitions"
date: 2021-02-03
sidebar:
  nav: "nav"
toc: true
toc_sticky: true
toc_label: "TOC"
author_profile: false
---
# Top Poker Agents - AI vs. Human Competitions
Ever since Gary Kasparov faced off against the Deep Blue IBM supercomputer in 1996, the idea of AI defeating humans has held a special significance. There have been a number of AI vs. human competitions in poker and we will highlight some of the most important ones here. 

1. 2007 CPRG's Polaris Limit Hold'em
2. 2008 CPRG's Polaris 2 Limit Hold'em
3. 2015 CMU's Claudico No Limit Hold'em
4. 2017 CMU's Libratus No Limit Hold'em
5. 2019 Facebook's Pluribus Multiplayer No Limit Hold'em

## 2007 Polaris
The first Man vs. Machine poker match took place in 2007 and there was hope that this would get publicity like the Deep Blue match, but it resulted in human players
beating CPRG's Polaris agent, though statistically the skills of the humans and computer were similar.  The match was limit hold’em with two professionals playing against Polaris in
a duplicate-match, where they played a total of 4,000 hands and won $395, or 39.5 
small bets. Although variance in limit hold'em variants is relatively low, this seems like a low number of hands. This version of Polaris was found to have an exploitability of 275.9 mbb/g.

## 2008 Polaris 2
In the 2008 match against five poker pros in Las Vegas, Polaris came out ahead overall and in two of the four matches, while one was tied and the humans won the other, with
a version of the agent that is now known to be exploitable for 235.3 mbb/g. This version of Polaris was updated to add "an element of learning", whereby it selected a strategy according to how the opponent was playing instead of using one default strategy. This agent also made use of CFR and was an important victory for the AI side.

## 2015 Claudico
After a significant break in the action, Man vs. Machine was again played at the
Rivers Casino in Pittsburgh in April-May 2015 and included major sponsorship from
Microsoft Research. Tuomas Sandholm, a professor at CMU, led the team that
created the bot named Claudico, which means “limp” in Latin, named such because
the bot “limps”, or calls instead of raising preflop, a strategy very uncommon with
expert players. The humans were some of the top in the world -- Doug Polk, Dong Kim, Jason Les, and Bjorn Li. 

Sandholm’s goal is to create the greatest no-limit Texas Hold’em player in the world,
which could potentially be used as the ultimate poker training tool. Along with PhD
student Noam Brown, they created, Tartanian7 (Claudico's predecessor), which won both categories of the
ACPC in 2014, and Baby Tartanian8, which won the total bankroll and took 3rd in the
instant run-off competition in 2016. Sandholm’s previous agents were named
Hyperborean. These agents use the standard abstraction paradigm for solving poker games. 

Sandholm first noted that it has a far more varied approach to bet sizing, one of the
most important and skillful aspects of the game. “I think by using one or two bet sizes
humans can avoid signaling too much about the strength of their hand,“ Sandholm
continued. “But the computer can use a larger number of bet sizes because it knows it
isn’t giving away too much because it balances its bets. Another example is limping, 
by the way. Limping in on the button heads-up no-limit is often considered by
humans as a novice thing to do, but the bot will do that”.

“It plays poker very differently from how humans play poker. Humans learn from
each other how humans play the game, not how it is optimally played. This bot, in
contrast, has never seen a human play poker. Instead, it has reasoned from first
principles how poker should be played and the conclusions are different from what
humans have reached”, said Sandholm. He attributes the power of the agent to his
team’s knowledge of computational game theory and optimization algorithms.

The bot played 20,000 hands each against four top poker professionals and the
humans ended up winning over \\$700,000 in the 80,000 No Limit Hold'em hands, which were played at
\\$50-\\$100 blinds (the players won at about 9.16 big blinds per 100 hands) with each
player starting each hand with \\$20,000 in chips. Players won a share of a \\$100,000
prize pool depending on their individual results. Despite the loss, Sandholm claims
that this was a statistical tie because he could not say with 95% or higher certainty
that the players were statistically better players (although the win was significant
at the 90% level). There was a \\$100,000 prize pool to incentivize high performance. 

Doug Polk, perhaps the most well known of the human players, noted that he felt that
Claudico was very aggressive and he recalled that it one time made a huge bet into a
small pot, that would essentially never happen in a human game. He felt that Claudico
was very strong overall, mostly because of how well balanced it played, meaning that
it would take similar actions with a balance of hands. He also noted that there are
already problems with bots playing in real money online (despite being against the
rules), so this is an ongoing concern as bots continue to improve.

Some of the unconventional plays included limping around 10% of hands, which it seemed to do profitably, and often betting very small like 10% of pot or very large like 40 times the pot. These strategies have gotten more prevalent in human games because they can be super effective and tend to make opponents uncomfortable since they aren't used to playing against them! 

## 2017 Libratus
Libratus from CMU overwhelmingly beats top humans in the world
On January 11, 2017, another Poker AI vs. Human match began, a rematch of the
2015 match, again featuring Professor Tuomas Sandholm’s and Noam Brown’s agent,
now named Libratus (Latin for “balance”), facing off against four top poker players.
The event lasted 20 days with a prize purse of $200,000 and 120,000 hands to be
played (more than in the first match in order to provide more statistical significance).
Hands are again mirrored so that between two human players, their cards are reversed,
to reduce variance, and also the computer plays the mirrored hand from both
perspectives. Each hand resets with 200 big blinds per player and players have access
to a history of each day’s hands to review at the end of each day. Sandholm declared 
that he thinks of poker as the “last frontier within the visible horizon” of solvable
games where computers can defeat humans.

Libratus is based on CFR+ with a sampled form of regret-based pruning to speed up
computation. It was run for “trillions” of iterations for months over 200 nodes on a
Carnegie Mellon University supercomputer called Bridges. Unlike when Go was
solved, Libratus did not analyze any human hands, but rather learned from scratch,
which could be beneficial when playing against humans since they may be less
familiar with its strategy compared to what they are used to seeing. Additionally,
Libratus used an end-game solver in match and took card-removal effects, also known
as blockers, into account (when opponent hands are less likely because of cards that
you are holding -- which was not in the previous version), and finally, the Libratus team updated the betting translations every
night to avoid them being exploited (which happened in the previous version). 

The human team had been successful in the
2015 match by exploiting bet sizing by betting in between known sizes to “confuse”
the bot, and they tried that tactic again in the 2017 competition, but this time even if
they did find an exploit, it would be fixed within a few days. Significantly, while the
previous version, Claudico, used card abstraction, this version does not. This is
thought to be a significant reason for Libratus’s improvements over Claudico, since
merging hands together and missing the subtleties between closely related hands
could be a strong disadvantage against top players.

Libratus ended up winning a massive \\$1,766,250 in tournament chips over the 20
days and 120,000 hands, or 14.7 big blinds per 100 hands, an excellent winrate.
The players, two of whom are the same that played in the first match against
Sandholm’s bot, agreed that it has substantially improved in this iteration. They
especially noted that the overbets (large bets that are larger, sometimes significantly
larger, than the pot) have been surprising and challenging to combat and that the agent's ability to balance and confuse the humans about which bets were value bets and which bets for bluffs was especially impressive and is a skill that is beyond the capabilities of most humans. They also made
the point that it is mentally difficult to play poker for so many hours (about 10 per
day) with only limited breaks possible and limited time to study hands at night.

What other advantages might poker agents have over humans? A major one is
randomization. Computers are much better at humans at playing mixed strategies in
terms of both actions and bet sizes, so most humans stick to only a few bet sizes and
very approximate randomization.

After the match, Sandholm declared that “This is the first time that AI has been able
to beat the best humans at Heads-Up No-Limit Texas Hold’em” and “More generally,
this shows that the best AI’s ability to do strategic reasoning under imperfect
information has surpassed the best humans.” Andrew Ng, a computer scientist at
Stanford University said that this is a “major milestone for AI”, comparable to AI
achievements in chess and Go. While this is certainly true, poker is most often played
with six to ten players at a table, situations in which humanity still had the upper hand.

What does this mean for the future of poker and online games? If an agent is this
strong against four of the best 15 players in the world, then it could certainly be
extremely successful against typical opponents encountered online. One caveat is that
decisions tend to take a large amount of time and online sites allow only a specified
number of seconds per action, (along with a regenerating time bank for more difficult
decisions) so this strongest version of the agent would probably not quite be ready to
play online now. 

Reputable poker sites have strong anti-bot detection and while
this can be circumvented by manually inputting commands given by bot software, this
makes it more challenging to scale. Finally, most poker games take places at six or
nine player tables (including the even more complex tournament style of poker),
which means more players and more complexity, and research has not yet focused on
this problem, although even agents like Libratus may succeed with only minor
tweaks.

There were a number of super interesting hands from this match -- here we discuss two that were especially weird! 

In the first hand the computer had 53 of clubs and Daniel McAualay had two hearts (his exact hand was not given). Preflop there was a raise by Daniel, a reraise by Libratus, and a 4bet by Daniel. Normally in this situation an opponent would expect Daniel to have a very, very strong hand and would almost always throw away a hand as weak as 53 of clubs unless perhaps the stack sizes were huge. 

The flop was K of hearts, Q of hearts, J of clubs, giving Daniel a flush draw and Libratus almost no chance of winning. Both players checked, Libratus probably to give up and Daniel probably to take a "free" card since the flop was "messy" and could result in getting raised, while he would rather see the next card and hopefully hit his flush. 

Indeed the next card was a heart (exact card not given), which means that Libratus has nothing and cannot win and Daniel has a very strong hand with a flush. Again both players checked, this time again probably for Libratus to give up, and this time for Daniel to slow play his very strong hand to try to get Libratus to bluff or hit something. 

The river card was a 5 of spades, giving Libratus a pair, but being very unlikely that it would win given the rest of the board. Even if it were the best hand, it would be extremely unlikely that an opponent would call a bet with a worse hand. Still, Libratus bet, defying conventional poker wisdom, and Daniel made a small raise that he wanted Libratus to read as being a likely bluff. Then Libratus went allin as a complete bluff, knowing that it would lose if called. Daniel quickly called and won. 

What do we make of this hand? If we saw a human do this, we'd think that he was absolutely crazy and quite likely a very poor player, but Libratus is actually one of the best agents ever created. Is it possible that this action was actually a very very tiny probability action that we got to see? This shows that a top poker player is very unpredictable and AI is even better at being unpredictable and randomizing and doing this low probability plays than humans ever will be. 

Noam Brown, who was the lead on creating Libratus, said that despite the bot’s skill at playing unexploitable poker, he
believes that humans are still superior when it comes to exploiting weaker players, but
that bots are gradually improving in this area also.

## 2019 Pluribus

## Human Biases
Why can computer agents be superior to expert players? They can certainly store more information and do calculations faster and act faster, but even on a more even playing field, there are human emotional biases that make things difficult relative to the objectivity of a computer program. Daniel Kahneman, a well known behavioral economist, has written about how decision makers often react to different frames
(how information is presented) in different ways, and suggests that these people
would be better off using a risk policy that they apply as a standard broad frame.
Computer agents are essentially already doing this and have no framing or emotional
biases or loss aversion that trouble most human decision makers and poker players.

In Daniel Kahneman’s 2011 book “Thinking Fast and Slow”, a study by Paul
Meehl is cited that shows clearly that statistical predictions made by combining a few
scores or ratings according to a rule tend to be much superior to predictions based on
subjective impressions of trained professionals. Looking at about 200 comparisons,
the algorithms are significantly better in about 60% of cases and the rest are
considered ties (although algorithms are generally much cheaper). Examples of
studies include credit risk evaluation by banks and the odds of recidivism amongst
juvenile offenders. Although poker involves much more than just statistical
predictions, this study suggests that despite poker having a reputation as being an
emotional game where reading others and having a good poker face are important, the
reality is that already computer poker agents are better than all but the very best
human players. Some specific issues mentioned are: 

- Experts try to be clever and to think outside of the box instead of sticking to
“fundamentals”
- Humans are inconsistent in making summary judgments of complex
information
