# Card rewards

How crew members gain cards over a run: when, how many, and who decides. A companion to `card-landscape.md` (what cards exist and what decks they make) and section 5 of `encounter-design.md` (rewards grow out of encounters).

## Goals

- **No crew member is shut out.** Without these rewards, a station's deck only changes at its own shop, a route visits 2–3 of the 4 shop kinds, and act 1 pays about 60–70 antimatter before the boss, so some stations get nothing for a whole sector. Every station should gain something every sector.
- **Choosing between crew members is part of the game,** but it should be mild, regular and talked about aloud, not a harsh call that freezes one player out. Losing out should mean a weaker card, not no card. The heavy version of that choice stays with shops, where it's planned along with the route.
- **Runs differ.** Decks should split apart from the first minute, and the route and its encounters should shape how they grow.
- **Few systems, each with a clear job.** Cards come in three ways and leave two ways:

| | Source | Job |
|---|---|---|
| In | **Outfitting**, at each sector's start | A guaranteed card for every station |
| In | **Salvage**, on the map after each successful fight | The crew deciding together who gets the next card |
| In | **Shops** (with work orders) | Planned, heavier investment in one station, chosen with the route |
| Out | **Selling**, **scrapping** or **replacing** | Every card that leaves a deck is worth 10 antimatter |

## Salvage

After each regular or elite fight whose objective is met, the ship salvages one card. It's what the ship tractored in at the end of the fight, made into a card once it has warped away, so it's chosen on the sector map rather than in the fight.

- **Three cards are offered, one for each of three stations.** The fourth station, the one that received the previous salvage, can't benefit, so it **chooses** which of the three the ship takes. It can't grab one for itself, and it doesn't know the other decks well, so it has to ask: "Science, would this help you?"
- **The chooser can instead scrap all three for 10 antimatter.** Nobody gained a card, so the same station chooses next time. Scrapping isn't new income: any salvaged card could be taken and then sold for 10 at the next station anyway. It just skips that pointless step. A free decline would be a fake option, since taking and selling would always beat it.
- **The offer shows on the main viewscreen,** in a big panel over the sector map, where every crew member, and a phoneless captain if there is one, can see it and argue for a card. Each offered card shows its station's deck size against its cap (for example "Tactical 12/12"), so the chooser can see when a card would force a swap. Only the chooser's phone has controls. The chooser can hold a button to hide the panel, on their phone and the viewscreen, so the crew can look at the map behind it while deciding.
- **The chooser role carries across sectors.** The very first salvage of a run has a random chooser. Outfitting doesn't count as salvage.
- **The card goes to the bottom of the recipient's deck,** like a shop card. If that deck is at its cap, the recipient replaces a card (see below).
- **It happens on the map, once the ship has warped away.** Helm gets the warp card as soon as the objective is met, as for any encounter, and nobody has to choose under fire from enemies that haven't left yet. On the map the offer covers the chooser's console, and helm doesn't get the route cards until the salvage is settled. That's no hurry, as the ship's systems don't run on the map, and the choice fits the route discussion: "if science gets this, we can skip the science shop." A recipient with a full deck can make room straight away, as replacing a card is allowed on the map.
- **Elites** offer better odds of uncommon and rare cards, rather than more cards. **Failed fights** give no salvage, in line with "fail forward pays nothing".
- **Later, salvage is drawn from the encounter that was beaten,** where its cards allow: its faction's or theme's cards, and the "cards it wishes existed" from its spec, mixed with the general pool. That makes fights distinct rewards, gives routes a reason to pass particular encounters, and lets sector themes pull decks in different directions from run to run. Until there are enough themed cards, salvage uses the shop pool and rarity weights.

**Watch in playtests:** two players passing cards back and forth between themselves while the other two stations miss out. The starved player saying so out loud should be enough. A pity rule would need a visible counter to make sense, so it's left out unless playtests show a need.

## Outfitting

Outfitting replaces the repair station at the start of every sector, and the ship docks there as soon as the sector intro is dismissed, before the map. It always repairs the ship too, which does nothing in sector 1 but matters after each boss. Helm doesn't get the warp card until outfitting is settled.

### Sector 1: a pick each

**Every crew member picks 1 of 3 cards for their own station,** on their own phone, all four at the same time. The cards use the shop's rarity weights. The viewscreen shows a tile for each crew member, lit once they've picked, so everyone can see who the ship is waiting on.

This is the first thing the crew does in a run. It teaches the card-pick screen and each player's own station before any fight, and the starter decks immediately split apart from run to run. A choice between crew members would be shallow here: every run starts from the same decks, so it would mean judging cards in a vacuum, and experienced crews would learn the "right" answers.

### Sectors 2 and 3: bundles

**The crew chooses 1 of 3 bundles, and each bundle holds one known card for each of the four stations.** Everyone gets a card whichever bundle is taken. The choice is about weighing what each station would get against the others, and by now the decks have diverged, so the answer is different every run.

- **Each bundle has a standout:** one uncommon or rare card, each bundle's for a different station, with commons for the rest. So the question is mostly "whose standout do we take this sector?", with the cost to everyone else in plain view. Fully random bundles tend to come out flat.
- **The viewscreen shows the three bundles,** each as a 2×2 grid of its four cards, one per station, with the standout marked. Every crew member's vote shows against the bundle they chose.
- **Each phone shows only its own station's row:** the card each bundle would give it, with full card text. So every player reads three cards, judges their own row, and argues for it: "Bundle 2 is huge for me." "But bundle 2 gives engineer nothing useful."
- **Every crew member votes, and a bundle is taken once three of the four agree.** A 2–2 split just means more talking, so there's no tie-break rule.
- Each card goes to the bottom of its station's deck, and a station at its cap replaces a card as usual.

## Deck cap

Each ship design sets a **`maxDeckSize` for each crew system**, alongside `maxPowerLevel`. The starter ship has 12 for each crew station. Later ships can vary this, for example a ship built around a big tactical deck. Hull and reactor don't gain cards, so they don't need a cap.

- **A card that would take a deck past its cap replaces one, and the recipient picks which.** Even when someone else chose the salvage, the recipient still decides what it costs them. The recipient can also discard the new card instead.
- **The card that leaves pays 10 antimatter,** the same as selling. Every card leaving a deck is worth the same 10, whether it's sold, scrapped or replaced. Otherwise a player with a full deck would sell down to 11 at every station to keep a free slot, which is bookkeeping, not a decision. If late-run income runs too high, lower that one value everywhere rather than making replacing an exception.
- This applies to every way a card arrives: outfitting, salvage, shops and work-order deliveries.
- The replace prompt waits on the recipient's phone until it's answered, and doesn't block warping. It should be a single tap from the deck view, because late in a run replacing becomes the normal case.
- **This also caps a system's health,** since max health is card count: a station can't grow tougher than 12 cards. That's a balance change, and it's intentional.

## Shops and work orders

Shops are unchanged: a station of one kind sells 5 cards to one crew member, and helm's choice of route decides which shops the crew passes. They're still the place for the hard "who do we invest in?" call, two or three times a sector.

Work orders stay as the way to reach a station whose shop isn't on the route. Salvage covers much of that need, so once salvage is in, revisit their price (45, then ×1.5 per order from the same ship): cheaper and more common, or cut.

## Expected flow

Per station per sector: 1 card from outfitting, about 1–1.5 from salvage (4–5 fights shared across four stations), and 0–2 from shops. So every station gains at least about 2 cards a sector, and a favoured one about 4. Starting from 8, a favoured station reaches the cap of 12 during sector 2; the others reach it in sector 3, if at all.

Salvage adds about 10 antimatter of value per fight, taken either as a card or as antimatter, and card flow roughly doubles, so shops matter a little less. Check that routes full of shops still compete with routes full of fights before touching the fight reward or the sell price.

## Build order

Each step builds on the one before.

1. **Deck cap.** `maxDeckSize` on each crew system's setup, and the replace-and-refund flow, applied to shop purchases and work-order deliveries.
2. **Salvage.** The engine offer and chooser on the map after successful fights, scrapping, the viewscreen display, the chooser's controls, and holding back helm's route cards until it's settled. Uses the shop pool at first.
3. **Outfitting.** A new station kind for the start layer, replacing `'repair'` for the `'start'` role in `SectorGenerator`, which the ship docks at after each sector intro. It repairs, gives each crew member a 1-of-3 pick in sector 1, and offers bundles with voting in later sectors.

Steps 1–3 are built. Themed salvage and retuning are still to do.
4. **Themed salvage.** Salvage pools drawn from the beaten encounter, its faction and its theme.
5. **Retune.** Fight rewards, the sell price, shop prices and work-order prices, using balance tests and playtests.

## Levers for later

- **One pack per station, all different,** as a mid-sector station kind: the viewscreen lists four pack kinds (1 of 3 normal, 1 of 2 uncommon or better, a single rare unseen until opened, a free work-order delivery, two picks of 1 of 2) and each crew member claims one for their station. Everyone gets something, and the crew decides who gets the good pack, in the style of Slay the Spire's Blitz shops.
- **A requisition budget:** a few points to spend across four mini-shops, each crew member filling their own basket, with the viewscreen showing the total against the budget. The strongest coordination moment, but it's more UI and repeats the "split a pot" decision that shops already ask for.
- **A crew vote at a station,** such as "a rare pick for one named station, or antimatter".
- **Upgraded cards,** which would make mystery packs properly exciting.
- **A style per sector:** biasing a sector's salvage and outfitting towards reliable, risky or technical cards, for more run-to-run variety.

## Considered and dropped

- **Every station picks 1 of 3 after each fight:** solves the shut-out problem but removes any choice between crew members, grows decks too fast, and makes shops irrelevant.
- **A big starting budget with all four shops at the start station:** a good conversation once, but front-loaded, prone to four phones racing to spend one pot, and it undercuts routing towards shops.
- **Two salvages for an elite:** needs a sequencing rule for little gain; better rarity odds do the same job.
- **Packs to pick between at outfitting (crew, specialist, synergy, refit), agreed by two stations:** a negotiation on phones with no clear default. The synergy pack duplicated work orders and the refit pack duplicated selling.
- **Giving unclaimed salvage away automatically when the ship warps:** holding back the route cards is simpler.
- **Choosing salvage before warping away:** enemies that are still withdrawing, or that a survive or protect objective leaves behind, would harry the crew while they choose. Making every hostile break off once the objective is met would fix that, but would take away encounters' own exits, such as running out of range.
- **A viewscreen count of salvages since each station's last card:** players will say when they're missing out, faster than a counter would.
