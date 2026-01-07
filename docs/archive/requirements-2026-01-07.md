# BuildSeason

## Product Requirements Document

**Version:** 1.0  
**Date:** December 29, 2025  
**Status:** Draft

---

## Executive Summary

BuildSeason is an open-source team management platform designed to transform how robotics teams operate. By combining intelligent parts management, budget tracking, and proactive awareness systems, BuildSeason eliminates the operational chaos that plagues FTC teams—particularly during the intense build season—while simultaneously teaching students real-world operational practices that transfer to professional environments.

The platform targets the intersection of two critical needs: making coaches' lives easier (reducing the mental load of tracking parts, approvals, and logistics) and building student capacity (giving young people hands-on experience with procurement, inventory management, and budget accountability).

---

## The Agent-First Philosophy

### The Core Insight: Machines for Machine Work, Humans for Human Work

The most profound impact of BuildSeason isn't efficiency—it's _liberation_.

Every minute a mentor spends comparing restaurant menus, cross-referencing dietary restrictions, calculating delivery timing, and coordinating orders is a minute they're NOT:

- Sitting with the kid whose code doesn't work and who's about to cry from frustration
- Noticing that two students are having a conflict and gently intervening
- Celebrating the moment the robot actually picks something up for the first time
- Having the hard conversation with the senior who didn't get into their first-choice college
- Being present at the MakerFaire booth, actually talking to families about why robotics matters
- Consoling the team after a devastating loss
- Giving the quiet freshman a chance to present and watching them find their voice

**These are irreplaceable human moments.** No machine can do them. They're why mentors volunteer. They're what students remember 20 years later.

But here's the tragedy: mentors spend enormous energy on logistics that machines can do _better_. The machine can:

- Cross-reference 12 dietary restrictions perfectly, every time
- Calculate delivery timing to the minute
- Remember that Marcus hated the pizza place and Sofia loved the Thai restaurant
- Track the food budget to the penny
- Find restaurants that accommodate both "delivered lunch at MakerFaire" and "sit-down dinner on the way home"
- Present options with rationale instead of making humans do the research

**The agent handles the logistics so the humans can handle the humans.**

This isn't about making teams "more efficient." It's about redirecting human energy from machine-work to human-work. The mentor who isn't researching restaurants has bandwidth to notice that a student seems withdrawn today. The coach who isn't chasing permission form signatures can actually prepare for the conversation with the struggling student.

### Beyond Tools: An Intelligent Team Member

BuildSeason isn't a better spreadsheet. It's an intelligent presence that becomes part of the team's culture—meeting students where they are (Discord), freeing mentors from the mental load of tracking and nagging, and nurturing sponsor relationships with genuine human moments.

The agent isn't a feature bolted onto a database. **The agent IS the experience.** Every interaction should feel like having a witty, competent team manager who never sleeps, never forgets, and genuinely cares about the team's success—while maintaining a personality that makes teenagers actually want to engage.

### Design Principles

**1. Meet Students Where They Are**
Students live in Discord. They don't check dashboards. They don't read emails. They respond to messages in channels where their friends are. The agent should be a Discord presence first, with the web interface as the "back office" for mentors and detailed work.

**2. Delight Over Efficiency**
A boring notification gets ignored. A GLaDOS quip gets screenshot and shared. The goal isn't just to remind Marcus about the arm BOM—it's to do it in a way that makes him laugh, show his friends, and actually respond. Personality isn't decoration; it's the delivery mechanism for operational information.

**3. Escalation, Not Nagging**
Mentors volunteer their limited time. They shouldn't spend it asking "did you order that part yet?" The agent handles the first three reminders. The agent tracks who's responsive and who isn't. Mentors only get involved when the agent has tried and failed—and when they do get involved, they have full context.

**4. Notice What Humans Miss**
The agent should see patterns humans don't:

- "You've emergency-ordered zip ties before 3 of your last 4 competitions"
- "This part is showing 'limited stock' at REV—you use 12 per robot"
- "Lead times from goBILDA have increased 2 days this month"
- "Sofia completed her first solo order—worth celebrating?"

**5. Nurture, Don't Report**
Sponsor relationships aren't about quarterly PDFs. They're about making sponsors feel connected to something meaningful. The agent should notice shareable moments and make it effortless to share them—not just track deliverables.

**6. Prepare, Don't Just Remind**
The difference between a reminder and preparation:

- Reminder: "Don't forget to order lunch for the MakerFaire event"
- Preparation: "Here are 3 restaurant options that can deliver to the MakerFaire location, accommodate all 8 attendees' dietary needs, and fit within budget. Option A is Thai (Sofia's favorite), Option B is pizza (but Marcus had a bad experience last time), Option C is Mediterranean (new, good reviews, halal options). Want me to poll the students?"

---

## Concrete Scenario: MakerFaire Meal Coordination

This scenario illustrates the philosophy in action. Watch how the agent handles machine-work so the mentor can focus on the students.

### The Setup

**Event:** MakerFaire outreach, Saturday 10am-6pm  
**Location:** Convention Center, 45 minutes from school  
**Attendees:** 8 students + 2 adult chaperones (Mrs. Chen, Mr. Rodriguez)  
**Meals needed:** Lunch delivered to booth, dinner stop on drive home  
**Budget:** $180 for the day ($18/person × 10 people)

**Dietary restrictions (stored in student profiles):**

- Sofia: Vegetarian
- Marcus: Nut allergy (severe)
- Aisha: Halal
- Jordan: Gluten-free
- Others: No restrictions

**Stored preferences (from previous events):**

- Sofia: Loved the Thai place (Pad Thai, 4.5 stars)
- Marcus: Bad experience with Domino's (wrong order, late)
- Team generally: Prefers variety over pizza again

### The Agent Workflow

**Thursday, 2 days before event:**

_Agent processes:_

1. Event is Saturday, 8 students + 2 adults confirmed
2. Cross-reference attendee dietary needs
3. Search for restaurants that can deliver to Convention Center
4. Filter for: vegetarian options, nut-free kitchen or protocols, halal options, gluten-free options
5. Check reviews, delivery reliability, timing
6. Calculate budget fit
7. Find dinner options on route home
8. Compile with rationale

_Agent DMs Mrs. Chen (designated lead chaperone):_

> "Hi Mrs. Chen! I've put together meal options for Saturday's MakerFaire. Here's what I found:
>
> **Lunch (delivered to booth, ~12:30pm):**
>
> **Option A: Thai Basil** ⭐ Recommended
>
> - $14-18/person, fits budget ✓
> - Vegetarian: Extensive options (Sofia loved their Pad Thai last time)
> - Nut-free: Kitchen can accommodate with notice
> - Halal: Yes, certified
> - Gluten-free: Multiple options
> - Delivery: Reliable, 4.8 stars, delivers to Convention Center
> - _Why I like it: Checks every dietary box, team has positive history_
>
> **Option B: Mezze Mediterranean**
>
> - $12-16/person, under budget ✓
> - Vegetarian: Good falafel/hummus options
> - Nut-free: Kitchen is nut-free
> - Halal: Most items halal
> - Gluten-free: Salads, rice bowls
> - Delivery: 4.5 stars, new to area
> - _Why I like it: Budget-friendly, naturally accommodates all restrictions_
>
> **Option C: Panera Bread**
>
> - $11-14/person, well under budget ✓
> - Covers all dietary needs but less exciting
> - Very reliable delivery
> - _Backup option: Safe but the team might prefer more variety_
>
> **Dinner (on route home, ~6:30pm):**
>
> **Option A: Chili's** (exit 34, 5 min detour)
>
> - Quick seating for groups, predictable
> - All dietary needs covered
> - Kids generally like it
>
> **Option B: Local Mexican place "Casa del Sol"** (exit 36, 8 min detour)
>
> - Better food, slightly longer wait
> - Great vegetarian/halal options
> - More memorable
>
> Want me to:
>
> 1. ✅ Run a poll in Discord for the students to vote?
> 2. Just pick Thai Basil + Casa del Sol (my recommendation)?
> 3. See more options?
>
> Once you approve, I can prepare the order details so you just need to call it in, or I can draft an online order for your review."

**Mrs. Chen replies:** "Poll sounds great, let's let them pick!"

**Agent posts in #makerfaire-saturday channel:**

> "Hey MakerFaire crew! 🎪 Time to pick your meals for Saturday.
>
> **LUNCH** (delivered to our booth):
> 🍜 React 1️⃣ for **Thai Basil** — Sofia's favorite, great Pad Thai
> 🥙 React 2️⃣ for **Mezze Mediterranean** — Falafel, hummus, rice bowls  
> 🥖 React 3️⃣ for **Panera** — Safe, reliable, you know what you're getting
>
> **DINNER** (on the way home):
> 🌶️ React 🅰️ for **Chili's** — Quick, easy, everyone knows it
> 🌮 React 🅱️ for **Casa del Sol** — Local Mexican, better food, bit more time
>
> Poll closes Friday 6pm so we can prep. Your dietary needs are already covered in all options. 🙌"

**Students vote. Results: Thai Basil wins lunch, Casa del Sol wins dinner.**

**Agent stores preferences:** "Marcus voted for Thai Basil" (updates his preference profile)

**Friday evening, agent DMs Mrs. Chen:**

> "Poll results are in!
>
> **Lunch:** Thai Basil (6 votes)
> **Dinner:** Casa del Sol (5 votes)
>
> I've prepared everything:
>
> **Thai Basil Order (ready to place):**
>
> - Order for 10, delivery to Convention Center Booth #47
> - Delivery time: 12:30pm Saturday
> - Total estimate: $156 (under budget ✓)
> - Special instructions included: 'Nut allergy at table - please ensure Marcus's dish is prepared nut-free and packaged separately'
> - Phone: (555) 123-4567
> - [Link to their online ordering]
>
> **Casa del Sol:**
>
> - Reservation for 10 at 6:45pm (gives buffer from event end)
> - Address: 1234 Main St (Exit 36, 8 min from Convention Center)
> - Phone: (555) 987-6543
> - Note: I'll remind you Saturday afternoon to confirm the reservation
>
> **Budget status:** ~$156 lunch + ~$140 dinner estimate = ~$296. You're $116 over the $180 budget.
>
> Options:
>
> - Request additional budget approval ($116)
> - Switch dinner to Chili's (saves ~$30)
> - Have students contribute $5 each toward dinner
>
> What would you like to do?"

**Mrs. Chen:** "Let me check with Coach about the budget overage."

**Agent:** "No problem! I'll hold everything. Just let me know by Saturday 10am so I can place the lunch order in time."

**Saturday 9am, Mrs. Chen confirms budget approved:**

**Agent:**

> "Perfect! Here's your Saturday meal summary card (also sent to your email for offline access):
>
> **LUNCH - Thai Basil**
> ✅ Order placed, confirmation #TH-4521
> 📍 Delivering to: Convention Center, Booth #47
> ⏰ Arrival: 12:30pm (±15 min)
> 💰 Total: $156.40 (paid via team card on file)
> ⚠️ Marcus's meal marked nut-free, packaged separately
>
> **DINNER - Casa del Sol**
> 📍 1234 Main St, Exit 36
> ⏰ Reservation: 6:45pm for 10
> ☎️ (555) 987-6543
> 💰 Budget: ~$140 remaining
>
> I'll check in at 12:15 to confirm delivery is on track. Have a great event! 🤖"

**Saturday 12:20pm:**

> "Lunch update: Thai Basil confirms driver departed, ETA 12:35pm. Running 5 minutes late but you're covered. Enjoy!"

### What Just Happened

The mentor (Mrs. Chen) spent approximately **3 minutes** on meal coordination:

- 30 seconds reading options
- 10 seconds approving the poll
- 30 seconds reading poll results
- 1 minute confirming budget approval
- 10 seconds acknowledging final summary

The agent handled:

- Cross-referencing 4 different dietary restrictions across 8 students
- Researching restaurants that deliver to the venue
- Checking reviews, reliability, and timing
- Calculating budget impact
- Finding dinner options on the route home
- Remembering Sofia's preferences and Marcus's bad experience
- Running a student poll (in Discord, where they actually respond)
- Preparing complete order details
- Tracking the delivery
- Storing new preference data for next time

**Mrs. Chen's bandwidth on Saturday was spent:**

- Helping a nervous student practice their booth presentation
- Noticing that Jordan seemed off and checking in (turns out: stressed about a test Monday)
- Celebrating when a middle schooler said "I want to do robotics because of you guys"
- Taking the photos that will go to sponsors
- Being _present_ with the team

**This is what technology should do.** Not replace humans—_liberate them_ to be more human.

---

## Delight Moments: What "Wow" Really Looks Like

### For Students: The Agent as Team Mascot

**GLaDOS in Discord (#mechanical channel):**

> "I notice the arm subsystem hasn't logged progress since Tuesday. I'm not saying the robot will be incomplete. I'm just running the probability calculations. They're not good, Marcus."

**Celebrating small wins:**

> "Sofia just completed her first solo part order without adult supervision. The Enrichment Center is... almost impressed. [confetti emoji]"

**Competition countdown with personality:**

> "14 days until regionals. At current velocity, you will complete the intake with approximately 6 hours to spare. I recommend against celebrating yet. But I've been wrong before. Once."

**When someone finds lost parts:**

> "Inventory reconciliation detected: 6 standoffs found in the 'mystery bin.' I've added them to inventory and made a note that bin organization may require attention. No judgment. Much."

**The "it just knew" moment:**
Student updates OnShape assembly at 10pm. By 10:02pm, in #design:

> "I see you've added REV-41-1877 to the arm assembly. Checking... We have 0 in stock. REV has them, 5-day lead time, $51.96 for 4. Budget can handle it. Competition is in 18 days—you have margin. Want me to add to the order queue? React ✅ to confirm."

Student reacts ✅. Done. No forms, no asking permission, no wondering if someone will see it.

### For Mentors: The "I Didn't Have to Ask" Experience

**Monday morning dashboard:**

> "Weekend summary: 3 parts ordered (auto-approved under threshold), 2 permission forms received, OnShape BOM updated with 4 new parts (all cross-referenced, 1 needs ordering). Action needed: 0 items. GLaDOS handled it."

**Escalation that actually helps:**

> "I've reminded Marcus 3 times about the arm BOM update. Last reminder was Tuesday. No response. His typical response time is 4 hours. This is unusual. Want to check in?"

One click opens a draft message with context. Mentor isn't starting from scratch.

**Pattern recognition:**

> "Observation: Build sessions before 4pm have 73% attendance. Build sessions after 6pm have 94% attendance. Consider schedule adjustment?"

### For Sponsors: Feeling Connected, Not Reported To

**The moment-capture system:**

Competition day. Team wins Inspire Award. Sofia (specifically funded by TechCorp's STEM grant) was the lead presenter. Photos are uploaded to the system.

Agent notices:

- Award won (competition results webhook)
- Sofia in photos (tagged or face recognition)
- Sofia connected to TechCorp funding source
- Last TechCorp contact: 34 days ago

Agent drafts (in sponsor dashboard, with notification):

> "TechCorp moment detected: Sofia, funded by their STEM grant, just led the team to an Inspire Award. Draft message ready with photo. This is the kind of story they want to hear."

Coach personalizes for 30 seconds, sends. TechCorp contact gets a genuine, timely, personal message—not a quarterly PDF.

**Relationship nurturing prompts:**

> "It's been 47 days since you contacted TechCorp. Their renewal conversation is in 90 days. Since your last update: Won regional qualifier, Sofia presented at MakerFaire, team completed 12 outreach hours. Any of these worth sharing?"

**The "sponsor memory" feature:**

> "TechCorp's original funding letter mentioned they care about 'students pursuing engineering careers.' Sofia just announced she's applying to MIT for mechanical engineering. This connects directly to their stated interest. Personalized update draft ready."

### For International Teams: The Travel Concierge

**Flight monitoring:**

> "Your Frankfurt connection is delayed 45 minutes. Current buffer: 90 minutes. New buffer: 45 minutes. Still viable but tighter. I'm monitoring. If it slips another 20 minutes, I'll present rebooking options."

_20 minutes later:_

> "Connection now at risk. I've identified 3 rebooking scenarios:
> • Option A: Keep group together, arrive 4 hours late, €0 additional cost (airline responsibility)
> • Option B: Split into two groups on different connections, both arrive 2 hours late, €340 rebooking fees
> • Option C: Overnight in Frankfurt, airline provides hotel, arrive next morning fresh
>
> Budget impact and logistics breakdown for each available. Which scenario should I prepare?"

**Customs preparation:**

> "Based on your equipment manifest, I've pre-generated customs declarations for US entry. Note: You have 4 lithium battery packs listed. US CBP requires these in carry-on luggage, not checked. I've flagged this for your packing assignments. Also, the robot's declared value of €8,400 is below the threshold requiring an ATA Carnet, but I recommend one anyway based on community reports of smoother processing."

**Dietary coordination:**

> "Dinner reservation confirmed at Pappadeaux for 24. I've informed them: 4 vegetarian, 2 halal (they confirmed halal fish options), 1 severe nut allergy (kitchen will prepare separately). Menu preview sent to travelers. Marcus asked about the dessert situation—I told him there are nut-free options. He seemed relieved."

### The "This Changes Everything" Demos

These are the moments that make people say "wait, it can do THAT?"

**"The robot told me we're missing a part"**
OnShape webhook fires → agent checks inventory → agent checks vendor availability → agent calculates lead time against competition date → Discord message with one-click ordering. Student updates CAD; 90 seconds later, they know if they have a problem.

**"It noticed the pattern I missed"**

> "Observation: You've ordered from goBILDA with expedited shipping 4 times this season, total $127 in rush fees. Average non-rush lead time: 7 days. If you'd ordered 7 days earlier each time, you'd have saved $127. Want me to add a 'goBILDA 7-day warning' to your competition countdown?"

**"The sponsor got a video from our robot"**
Competition win → System prompts for celebration video → Student records 30 seconds on phone → System packages with team branding, competition results, connects to relevant sponsor → Ready to send. Total mentor effort: approve and click send.

**"It knew the part was being discontinued"**
Vendor monitoring detects "limited stock" or "discontinued" status on a part the team uses frequently:

> "Alert: REV-41-1320 is showing 'limited stock' status on REV's website. You've used 12 of these this season. Current price: $8.99. Recommend ordering a buffer supply? React with quantity: 🔟 for 10, 2️⃣0️⃣ for 20."

**"GLaDOS negotiated our hotel block"**
Agent has access to team size, dates, budget parameters:

> "I found 3 hotel options near the venue for Worlds. Best value: Marriott Marquis, $189/night, 2.3 miles from venue, breakfast included, 12 rooms available in block. Total: $4,536 for 4 nights. This is 23% under your lodging budget. Want me to draft a booking request?"

---

## OnShape Integration: The "Magic" Layer

### The Vision

When OnShape becomes a live input to BuildSeason, the BOM stops being a document and becomes a living connection between design intent and operational reality.

**What the integration enables:**

1. **Real-time part detection**
   - New part added to assembly → Instant notification
   - Part quantity changed → Inventory delta calculated
   - Part removed → "Hey, you removed REV-41-1877 from the arm. Want me to cancel the pending order for 4 of them?"

2. **Design-to-reality reconciliation**
   - Assembly says: 12 of part X
   - Inventory says: 4 in stock, 4 on order
   - Agent says: "You're 4 short. Lead time is 6 days. Competition is in 14 days. Order now?"

3. **Alternative suggestions**
   - Part specified in design is backordered
   - Agent knows compatible alternatives (from community data + vendor cross-references)
   - "REV-41-1877 is backordered 3 weeks. goBILDA part 3103-0001-0250 is compatible (same specs, different color). In stock, 4-day lead time. Want to substitute?"

4. **Cost impact in context**
   - Student adds fancy new part to design
   - Agent immediately shows: "That part is $47.99 each. Your design uses 4. Total: $191.96. Current remaining budget: $212. That would leave you $20 for the rest of the season. Proceed?"

5. **Version tracking with operational impact**
   - Major design revision uploaded
   - Agent diffs the BOM: "New version adds 12 parts, removes 3, changes quantities on 7. Net budget impact: +$234. Lead time for new parts: 8 days. Want the full breakdown?"

### Sample Interaction Flow

**10:47 PM — Student Updates OnShape:**
Marcus finishes redesigning the arm. New assembly uploaded.

**10:47 PM — BuildSeason webhook receives update**

**10:48 PM — Agent processes:**

- Parses BOM diff from previous version
- Cross-references each part against inventory
- Checks vendor availability and pricing
- Calculates lead times
- Compares against competition calendar
- Evaluates budget impact

**10:49 PM — Discord #design channel:**

> "Hey Marcus, I see you've updated the arm assembly. Here's what changed:
>
> **New parts needed:**
> • REV-41-1877 (qty 4) — Not in stock, not ordered. REV has it, $12.99 ea, 5-day lead.
> • goBILDA 3104 (qty 2) — 2 in inventory. You're covered.
>
> **Parts no longer needed:**
> • REV-41-1320 (qty 2) — We have 4 on order. Want me to reduce the order?
>
> **Budget impact:** +$51.96 for new parts, -$25.98 if we reduce the order. Net: +$25.98
>
> **Timeline check:** Competition in 18 days. Longest lead time is 5 days. ✅ You have margin.
>
> Want me to:
> ✅ Add REV-41-1877 (4) to order queue
> 📉 Reduce REV-41-1320 order from 4 to 2
>
> React to confirm either/both."

Marcus reacts with both emojis. Order queue updated. Mentor gets a summary notification in the morning if they want it. No meetings, no forms, no waiting until the next build session to ask.

---

### Vision

Every robotics team—from first-year programs to world championship contenders—operates with the clarity and confidence of a well-run engineering organization.

### Mission

To create an open-source platform that makes the _right_ operational practices easy, building awareness and accountability in students without requiring mentors to constantly monitor and nag.

### Strategic Positioning

- **Win the best teams first.** Elite teams have the most pain, highest standards, and greatest influence. When championship-caliber teams adopt BuildSeason, others follow.
- **Start with FTC, design for extensibility.** The architecture accommodates FRC, MATE underwater robotics, rocketry, and other programs from day one.
- **Hosted service with community intelligence.** Aggregated, anonymized data creates network effects—lead time insights, vendor reliability scores, and community benchmarks that benefit all participating teams.

---

## Target Users & Personas

### Primary Personas

#### Coach Chen — The Volunteer Mentor

**Demographics:** Software engineer by day, FTC mentor by evening. Parents two kids, one on the team. Limited time, high standards.

**Goals:**

- Stop being the bottleneck for every decision
- Know the team is on track without micromanaging
- Not lose sleep wondering if critical parts will arrive in time
- Teach students real skills, not just robotics

**Pain Points:**

- Spreadsheets everywhere, none of them current
- Students forget to tell her when things ship
- Budget tracking happens in her head
- Permission forms are a nightmare to chase
- "Did we ever order that bearing?"

**Wow Moment:** _Opening the app Monday morning and seeing: "All critical path parts ordered. Estimated arrival: 4 days before competition. No action needed." She didn't have to ask anyone._

---

#### Marcus — The Build Captain

**Demographics:** Junior, third year on the team. Natural leader, strong technical skills, wants more responsibility.

**Goals:**

- Run the mechanical subsystem like a professional team
- Know what parts he can use without asking permission
- Prove he's ready for engineering leadership roles
- Build a portfolio that impresses colleges

**Pain Points:**

- Has to wait for coach approval for everything
- Never knows what's actually in inventory
- Spends meeting time tracking down parts status
- Other students don't follow through on orders

**Wow Moment:** _Getting a notification: "Part REV-41-1320 in your assembly hasn't been ordered. Based on goBILDA's current 7-day lead time, order by Wednesday to have it before regionals." He orders it himself with one click, coach gets notified, done._

---

#### Sofia — The New Programmer

**Demographics:** Freshman, joined because a friend was on the team. Intimidated by the experienced members. Learning fast.

**Goals:**

- Understand how the team operates
- Not mess anything up
- Find ways to contribute beyond just coding
- Feel like part of the team

**Pain Points:**

- Doesn't know who to ask about parts
- Afraid to touch inventory system
- Lost when seniors talk about "build season chaos"
- Wants to help but doesn't know how

**Wow Moment:** _Being assigned "Electronics Parts Manager" role and actually feeling confident because the system shows her exactly what she's responsible for, what's running low, and what to do about it._

---

#### International Team Coordinator — Elena, Team from Romania

**Demographics:** Teacher at technical high school in Bucharest, running nation's top FTC team with students who've competed at Worlds three times. Managing €100k+ annual budget across government grants, corporate sponsors, and parent contributions.

**Goals:**

- Order parts that actually arrive in time despite 8+ day lead times
- Get 24 people (18 students, 6 mentors) to Houston and back safely
- Track customs and international shipping without surprises
- Manage multiple currencies and funding sources without confusion
- Document everything for government grant compliance
- Connect with global FTC community and share knowledge

**Pain Points:**

- Lead times from US vendors are unpredictable (customs adds uncertainty on top of shipping)
- Worlds travel is a 3-month planning nightmare: passports, visas, consent forms, dietary needs, hotel rooms, flight connections
- Exchange rates make budgeting complex; receipts come in 3 currencies
- Domestic alternatives for parts often don't exist
- Grant reporting requires specific formats and documented proof of outreach hours
- When flights get delayed, rebooking 24 people through text messages is chaos
- Sponsor deliverables (social posts, logo placement, facility visits) tracked on sticky notes
- Parents want to know exactly where their child will be at every moment of international travel

**Wow Moment:** _Two weeks before Worlds departure, opening the dashboard and seeing: "24/24 travelers document-ready (passports valid, visas confirmed, consent forms signed). Dietary requirements compiled (4 vegetarian, 2 halal, 1 nut allergy). Hotel rooming assignments complete. Customs declarations pre-generated. Contingency contacts documented. Flight delay monitoring active." She doesn't have to check a single spreadsheet._

---

#### Parent — The Booster Club Treasurer

**Demographics:** Works in finance, volunteered to help with team budget. Not technical, wants to support daughter's team.

**Goals:**

- Track where money goes
- Generate reports for sponsors
- Ensure receipts are collected
- Understand costs for fundraising targets

**Pain Points:**

- Students submit receipts randomly (or not at all)
- Hard to see committed vs. spent vs. remaining
- Sponsor reports take hours to compile
- No visibility into what's pending

**Wow Moment:** _Generating a sponsor report in 30 seconds that shows exactly how their $500 donation was spent, complete with photos of the subsystem it funded._

---

### Secondary Personas

- **School Administrator:** Needs documentation for liability, permission tracking, program justification
- **Regional Partner:** Wants aggregate data across teams in their region for support decisions
- **Multi-Program Director:** Manages FTC, FRC, and rocketry teams at same school, needs unified view

---

## User Needs & Jobs To Be Done

### Core Jobs

#### Job 1: "Help me know what to order and when"

**Context:** Build season is 16 weeks of intense activity. Missing one $12 part can delay an entire subsystem.

**Current Approach:** Spreadsheets, memory, frantic last-minute orders, overnight shipping costs

**Success Criteria:**

- Never miss a critical part for competition
- Order at optimal time (not too early, not too late)
- Minimize expedited shipping costs
- Know order status without asking anyone

**Functional Needs:**

- BOM tracking tied to design files (OnShape integration)
- Lead time estimation by vendor and destination
- Proactive notifications based on competition dates
- Order status aggregation across vendors

---

#### Job 2: "Help me track what we have and where it is"

**Context:** FTC teams operate from closets, garages, classrooms. Parts migrate between locations. New students don't know the system.

**Current Approach:** Memory, labels that fall off, "ask the seniors," frantic searches at 10pm

**Success Criteria:**

- Find any part in under 30 seconds
- Know quantities without counting
- Get alerts before running out
- Handle the "found parts in random box" discovery gracefully

**Functional Needs:**

- Location hierarchy (room → cabinet → bin)
- Quantity tracking with photos
- Check-out during build sessions
- QR code support (optional but powerful)
- "Reconciliation" workflow for discoveries

---

#### Job 3: "Help me manage money without being the bad guy"

**Context:** Teams operate on tight budgets—often grants with restrictions. Students want to order; coaches want control.

**Current Approach:** Coach controls credit card, students ask for permission, receipts get lost, budget is fuzzy

**Success Criteria:**

- Students can request purchases independently
- Approval workflow doesn't slow things down
- Budget status is visible to all stakeholders
- Sponsor reporting is effortless

**Functional Needs:**

- Budget categories with allocation
- Purchase request → approval workflow
- Receipt capture and attachment
- Real-time committed/spent/remaining
- Sponsor and grant tracking

---

#### Job 4: "Help me get students to competitions legally"

**Context:** Schools require permission forms for every off-campus activity. Forms expire. Parents forget to sign. Coaches chase signatures.

**Current Approach:** Paper forms, email reminders, spreadsheet tracking, last-minute scrambles

**Success Criteria:**

- Know exactly who's cleared for each event
- Collect signatures electronically where allowed
- Automated reminders to parents
- Clear dashboard before each competition

**Functional Needs:**

- Form templates by event type
- Per-student status tracking
- Parent notification system
- Expiration tracking for recurring clearances
- "Who's missing for Saturday?" query

---

#### Job 5: "Help me build awareness without nagging"

**Context:** Mentors are volunteers. They shouldn't spend their limited time chasing down status updates. Students should develop responsibility.

**Current Approach:** Mentors ask in every meeting, students forget between meetings, things slip through cracks

**Success Criteria:**

- Students see their responsibilities proactively
- Escalation happens only when necessary
- Mentors can "trust but verify"
- Deadlines are visible without being announced

**Functional Needs:**

- Role-based dashboards with personal action items
- Graduated notification escalation
- Competition-aware deadline calculation
- "No news is good news" for mentors

---

## Desired Outcomes & Wow Moments

### The Transformation Promise

**Before BuildSeason:**

- Spreadsheets that nobody updates
- Mentors who carry everything in their heads
- Students who wait to be told what to do
- Last-minute orders with overnight shipping
- Scrambling before every competition
- "I thought someone else ordered that"

**After BuildSeason:**

- Single source of truth everyone trusts
- Mentors who check in, not check up
- Students who own their responsibilities
- Orders placed at optimal times
- Calm, prepared competition mornings
- "I saw it was needed and handled it"

### Wow Moments by Persona

#### Coach Chen's Wow Moments

1. **"I didn't have to ask"** — Opening the dashboard and seeing all critical parts tracked, ordered, and on schedule without initiating any conversations
2. **"The system caught what I missed"** — Notification about a part in the design that wasn't in inventory or on order
3. **"Sponsor report in 30 seconds"** — Generating professional budget documentation instantly
4. **"Permission forms handled themselves"** — Arriving at competition with all paperwork complete because the system managed the reminders

#### Marcus's Wow Moments

1. **"I can actually see what I'm responsible for"** — Personal dashboard showing exactly what actions are needed from him
2. **"I ordered it myself"** — Submitting a purchase request, getting automatic approval under threshold, done
3. **"The system knew before I did"** — Alert about lead time putting a needed part at risk
4. **"I looked like a professional"** — Presenting subsystem budget report at sponsors night from the app

#### Sofia's Wow Moments

1. **"I understand how this works"** — Clear onboarding showing her role and responsibilities
2. **"I found it immediately"** — Searching for a part and seeing exactly which bin it's in
3. **"I can help without breaking anything"** — Marking parts as checked out during build session with confidence
4. **"The seniors asked ME"** — Being the authority on electronics parts status because she owns that role

#### International Team's Wow Moments

1. **"I know when it will actually arrive"** — Community-powered lead time estimates to their specific region
2. **"Currency is handled"** — Budget tracking in their currency with vendor prices converted automatically
3. **"We're connected to the global community"** — Seeing that other teams are dealing with the same vendor challenges
4. **"Customs tracking too"** — Integration that updates when packages clear international shipping milestones

### Delight Factors

**Unexpected Helpfulness:**

- System notices design-to-inventory discrepancies before humans do
- Suggests alternative parts when primary choice has long lead time
- Remembers "last time you competed at this venue, you needed X"

**Anticipatory Intelligence:**

- "If you plan to use this part, order by Wednesday"
- "Three teams in your region also ordered from goBILDA this week—lead times may increase"
- "Your budget is 80% committed with 12 weeks remaining—here's how similar teams pace spending"

**Community Connection:**

- See (anonymized) how your team compares to others
- Benefit from collective wisdom on vendors
- Contribute to community knowledge automatically

**Personality & Delight:**

- GLaDOS-inspired agent persona (opt-in) provides dry, helpful commentary
- "Part REV-41-1320 has been in 'needed' status for 9 days. I'm not saying you've forgotten. I'm just noting it for the permanent record."
- Easter eggs for Portal fans (Companion Cube icons, "the cake is a lie" for slipped deliveries)
- Configurable personas: GLaDOS (passive-aggressive), Wheatley (enthusiastic chaos), Cave Johnson (aggressive motivation), Turret (sweet, slightly ominous)

---

## Feature Requirements

### 1. Parts & BOM Management

#### Intent

Enable teams to connect their robot design to their operational reality—knowing what parts they need, what they have, and what to order.

#### User Stories

**As a build captain**, I want to see my OnShape BOM reflected in the system automatically so that I don't have to manually enter every part we need.

**As a student**, I want to search for a part by name, SKU, or description so that I can quickly find if we have it and where.

**As a mentor**, I want to see which parts in our design aren't yet ordered or in inventory so that I can catch gaps before they become emergencies.

**As a team**, I want vendor-specific part data pre-loaded (REV, goBILDA, AndyMark, ServoCity) so that we're not starting from scratch.

#### Acceptance Criteria

- OnShape assemblies can be linked and BOMs pulled automatically
- Parts can be mapped from OnShape to vendor SKUs
- Search returns results in under 500ms
- BOM shows status for each part: in inventory / on order / needed / not ordered
- Discrepancies highlighted automatically (design needs 12, inventory shows 4)

#### Wow Factor

_A notification arrives: "Your OnShape assembly was updated. New part detected: REV-41-1877. This part is not in inventory or on order. Add to order?"_

---

### 2. Inventory Management

#### Intent

Know exactly what you have and where it is—eliminating the "I think we have some somewhere" problem.

#### User Stories

**As a student**, I want to check out parts during a build session so that others know what's in use.

**As a parts manager**, I want to see low-stock alerts before we run out so that I can reorder proactively.

**As anyone**, I want to find a part's physical location quickly so that I'm not searching through every bin.

**As a team**, I want to record "found parts" without feeling like I'm admitting a mistake so that our inventory stays accurate.

#### Acceptance Criteria

- Location hierarchy supports at least 4 levels (building → room → cabinet → bin)
- Low-stock threshold is configurable per part
- Check-out records who took what and when
- "Reconciliation" workflow handles additions gracefully
- QR codes can be generated and scanned (mobile support)
- Kit of Parts items tracked separately with "official" status

#### Wow Factor

_Scanning a QR code on a bin shows everything in it with photos, quantities, and "last used by Marcus, 3 days ago."_

---

### 3. Order Management

#### Intent

Transform multi-vendor ordering from chaos into a coordinated, visible process.

#### User Stories

**As a build captain**, I want to see a consolidated cart across all vendors so that I can review everything we need to order in one place.

**As a mentor**, I want an approval workflow for orders over a threshold so that students have autonomy but I maintain oversight.

**As a student**, I want to know when my order will arrive so that I can plan my build schedule.

**As an international team**, I want to track customs status separately from shipping so that I understand where delays happen.

#### Acceptance Criteria

- Cart aggregates items from multiple vendors
- Approval threshold is configurable (e.g., $50)
- Order status flows: requested → approved → ordered → shipped → customs (international) → delivered → inventoried
- Shipping tracking integrates where vendors provide APIs
- Split shipments handled (partial delivery recorded)
- Order history searchable with easy reorder

#### Wow Factor

_"Your goBILDA order shipped. Based on current community data for shipments to Romania, estimated arrival: March 15 ± 2 days. Competition is March 22. You have margin."_

---

### 4. Budget & Financial Tracking

#### Intent

Make budget visible and manageable, with appropriate controls that don't slow teams down.

#### User Stories

**As a coach**, I want to see committed vs. spent vs. remaining so that I know our true financial position.

**As a student**, I want to submit purchase requests without bothering a mentor every time so that I can take initiative.

**As a treasurer**, I want to track grants with restrictions so that we use designated funds appropriately.

**As a team**, I want to generate sponsor reports easily so that we maintain good relationships with supporters.

#### Acceptance Criteria

- Budget categories configurable (parts, travel, registration, tools, etc.)
- Real-time calculation: committed (approved not yet purchased) + spent = used; budget - used = remaining
- Receipt/invoice photo capture on mobile
- Grant/sponsorship tracking with usage restrictions
- One-click sponsor report generation with customizable branding
- Multi-currency support with exchange rate tracking

#### Wow Factor

_Sponsor receives an automated email: "Here's how your $500 donation impacted Team 12345" with photos of the subsystem their money funded and budget breakdown._

---

### 5. Event & Outreach Management

#### Intent

Manage the full spectrum of team activities—from local outreach visits to international championship travel—with the same rigor applied to competition logistics.

#### The Reality Check

A competitive robotics team isn't just a competition team. A team like the Romanian squad qualifying for Worlds faces:

- MakerFaire booths requiring staff scheduling, equipment transport, and public engagement
- Middle school visits for STEM outreach (often grant-required)
- FLL event volunteering (mentoring the next generation)
- Sponsor facility tours and demos
- Local scrimmages and practice events
- Regional competitions
- National championships
- World Championship (if qualified)

Each event is a logistics challenge with different team member subsets, different equipment needs, different permission requirements, and different budget implications. Currently managed through chaos—email threads, Discord messages, group texts, and hope.

#### User Stories

**As a coach**, I want to see all upcoming events with their readiness status so that nothing falls through the cracks.

**As an outreach coordinator**, I want to schedule team members for MakerFaire shifts and know who's confirmed so that we don't leave a booth unstaffed.

**As a student**, I want to see which events I'm signed up for and what I need to do (permission form, transportation, etc.) so that I can be prepared.

**As a mentor**, I want to know which subset of the team is attending each event so that I can plan supervision ratios.

**As a school administrator**, I want documentation that our outreach fulfills grant requirements so that we maintain funding eligibility.

#### Event Types & Complexity

| Event Type             | Typical Complexity | Key Challenges                                                |
| ---------------------- | ------------------ | ------------------------------------------------------------- |
| Build session          | Low                | Attendance tracking only                                      |
| Local outreach         | Medium             | Permission forms, subset scheduling, equipment list           |
| Regional competition   | High               | Full team travel, packing lists, pit setup                    |
| Multi-day championship | Very High          | Hotels, meals, complex logistics                              |
| International travel   | Extreme            | Passports, customs, medical, dietary, rebooking contingencies |

#### Acceptance Criteria

- Event calendar with multiple event types and custom fields
- Team member assignment per event (who's going, who's confirmed)
- Per-event permission form requirements and tracking
- Equipment/robot checklist per event type
- Outreach hour tracking (for grants and awards submissions)
- Event templates (MakerFaire, school visit, competition) with pre-configured requirements
- Post-event reporting (attendance, outcomes, photos) for sponsor deliverables

#### Wow Factor

_"You have 7 outreach events scheduled this season totaling 142 volunteer hours across 23 team members. Current completion: 4 events, 89 hours logged. Grant requirement: 100 hours. You're on track."_

---

### 6. Travel & Logistics Management

#### Intent

Transform complex multi-person travel coordination from email chaos into a coherent, trackable system—especially critical for international teams traveling to championships.

#### The Worlds Qualification Scenario

When a Romanian team qualifies for World Championship in Houston, they face:

**People Logistics (24 travelers)**

- 18 students with varying passport validity, visa requirements, dietary restrictions
- 6 mentors with their own availability constraints
- Emergency contacts and medical information for everyone
- Travel consent forms (often notarized for international minor travel)
- Who sits with whom on a 14-hour journey

**Equipment Logistics**

- The robot (customs classification: educational equipment? machine? contains lithium batteries)
- Spare parts inventory (47 identical aluminum brackets look suspicious at customs)
- Tools (some restricted on aircraft, all need value declarations)
- Pit display materials (banners, giveaways—some countries tax promotional items)
- Which cases go as checked luggage vs. cargo vs. hand-carry

**Itinerary Complexity**

- Flights (often with connections—CDG → JFK → IAH)
- Ground transportation (airport → hotel → venue → airport)
- Hotel room assignments (students grouped appropriately, mentor supervision)
- Meal planning across 5+ days for 24 people with dietary restrictions
- Contingency planning for delays, cancellations, missed connections

**Documentation Requirements**

- Passport copies accessible offline
- Travel insurance documentation
- Medical authorization forms
- Embassy contact information
- Customs declarations pre-prepared
- Team manifest for venue credential pickup

#### User Stories

**As a travel coordinator**, I want to see all travelers' document status (passport valid? visa obtained? consent signed?) so that no one is stopped at the border.

**As a parent**, I want to know exactly where my child will be, who they're with, and how to reach them in emergency so that I can consent to the trip confidently.

**As a mentor**, I want to see the complete itinerary with all travelers so that I can manage the group effectively.

**As a coach**, I want contingency plans documented so that when (not if) something goes wrong, we have a playbook.

**As an international team**, I want customs documentation pre-prepared so that we're not explaining robotics parts to a confused customs agent at 2am.

**As a student**, I want to know my roommate assignment, meal times, and daily schedule so that I can focus on competition, not logistics.

#### Acceptance Criteria

**Traveler Management**

- Per-person profiles: passport info, visa status, dietary restrictions, medical notes, emergency contacts
- Document status tracking: valid / expiring soon / expired / not uploaded
- Travel consent form workflow with electronic signature (where legally sufficient)
- Parental authorization tracking for minors
- Rooming assignment management with appropriate groupings

**Itinerary Management**

- Multi-leg trip builder (flight → ground → hotel → venue)
- Shared itinerary visible to all travelers and parents
- Offline access to critical information (PDF export, mobile app caching)
- Real-time flight status integration (delays, gate changes)
- Rebooking scenario tracking (if flight 1 is delayed, here are our options)

**Equipment & Customs**

- Packing list with assignment (who's responsible for which case)
- Customs declaration generator based on contents and destination country
- Value documentation for temporary import (robot, tools)
- Restricted items flagging (lithium batteries, certain tools)
- Carnet support for teams that need formal temporary import documentation

**Meal & Dietary Management**

- Per-person dietary restrictions/preferences/allergies
- Meal planning across trip duration
- Restaurant/catering coordination with headcounts by dietary need
- "Sofia is vegetarian, Marcus has nut allergy, 3 students require halal" → meal orders

**Contingency Planning**

- Emergency contact cascade (who calls whom)
- Alternative routing documentation
- Local emergency services information
- Embassy contact details
- "If separated" protocol documentation

#### Wow Factor

_Flight delay notification arrives. System shows: "Your CDG→JFK connection is now at risk. 3 rebooking options identified. Option A preserves all 24 travelers together, arrives 4 hours late. Option B splits into two groups, both arrive 2 hours late. Option C: overnight in Paris, next day arrival. Budget impact and logistics summary for each option available."_

---

### 7. Sponsor Relationship Nurturing

#### Intent

Transform sponsor management from quarterly reporting into continuous relationship cultivation—making sponsors feel genuinely connected to something meaningful, and making it effortless for teams to share the moments that matter.

#### The Deeper Truth About Sponsors

Sponsors don't give money because they want PDFs. They give because:

- They believe in STEM education
- They want to be part of something bigger than their business
- They remember being a kid who loved building things
- Someone on the team is a customer, employee's kid, or neighbor
- They want to see the impact of their contribution—real stories, real students, real outcomes

The real product isn't report generation. It's **moment capture and relationship nurturing**:

- The student who got into MIT partly because of skills learned on this team
- The robot that actually worked for the first time (send them the video!)
- The shy freshman who's now presenting confidently to 200 people
- The "YOUR donation bought the servo that scored the winning points" story

A team that sends one personalized, meaningful update every 3-4 weeks will retain sponsors forever. A team that sends quarterly PDFs will lose them to the next ask.

#### User Stories

**As a sponsor relations lead**, I want to know when something "shareable" happens so that I can send a quick personal update to relevant sponsors.

**As a coach**, I want the system to remind me about sponsor relationships before they go cold so that I'm nurturing, not just reporting.

**As a sponsor**, I want to feel connected to specific students and outcomes so that my contribution feels meaningful (even though they'll never say this directly).

**As a team**, I want to connect sponsors to the specific impact of their contribution so that renewals are easy conversations.

**As a grant writer**, I want documented proof of impact with stories and data so that renewal applications write themselves.

#### Acceptance Criteria

**Moment Detection & Capture**

- Recognize "shareable moments": awards won, milestones reached, student achievements, competition results
- Connect moments to relevant sponsors (Sofia won an award → TechCorp funded Sofia's participation)
- Auto-generate draft messages with context, photos, and personalization hooks
- One-click send with optional personalization
- "Quick video" prompt for student-recorded thank-yous

**Relationship Health Tracking**

- "Days since last contact" per sponsor
- Renewal timeline awareness ("TechCorp renewal conversation due in 90 days")
- Sponsor interest memory ("TechCorp's original letter mentioned they care about students pursuing engineering careers")
- Suggested talking points based on what's happened since last contact
- Engagement pattern tracking (which sponsors open emails, which respond, which go quiet)

**Funding Source Management**

- Create funding sources with: name, amount, restrictions, key contacts, stated interests
- Restriction categories: unrestricted, competition only, outreach only, travel only, equipment only
- Multi-year tracking with relationship history
- In-kind donation tracking with fair market value

**Deliverable Tracking (The Minimum)**

- Per-sponsor deliverable list (logo placement, social posts, facility visit)
- Status tracking: promised → scheduled → completed → documented
- Photo/evidence attachment
- Automated reminders for upcoming deliverables

**Impact Documentation**

- Auto-compile impact metrics: students served, competitions attended, awards won, outreach hours
- Connect expenses to outcomes ("$3,400 on travel → Regional Championship qualification")
- Story library: tagged photos, quotes, student achievements linked to funding sources
- One-click "impact snapshot" for any sponsor at any time

**Reporting (When Required)**

- Report templates by funder type (government grant format, corporate summary, individual donor thank-you)
- Auto-populated data from all team activities
- Export in multiple formats
- Year-over-year comparison for renewal applications

#### Wow Factors

**The proactive moment notification:**
_"Sofia just led the team to an Inspire Award. She's funded by TechCorp's STEM grant. Photos are ready. Draft message: 'Hi [contact name], wanted you to see this—Sofia, one of the students your grant supports, just led our Inspire Award presentation. The judges specifically cited her explanation of our autonomous navigation. This is the kind of confidence your investment builds. [Photo attached]' Send with one click?"_

**The relationship reminder:**
_"It's been 47 days since you contacted TechCorp. Since your last update: Won regional qualifier, Sofia presented at MakerFaire (photos available), team logged 12 outreach hours. Their renewal is in 90 days. Draft update ready."_

**The "sponsor memory" insight:**
_"TechCorp's original funding letter mentioned they care about 'students pursuing engineering careers.' Sofia just announced she's applying to MIT for mechanical engineering. This connects directly to their stated interest. Personalized update drafted."_

**The gratitude that feels genuine:**
_Competition win. System prompts: "Record a quick thank-you video for sponsors? I can package it with competition footage and send to your top 5 funders." Student records 30 seconds. System adds intro/outro, team branding, competition results. Sponsors receive a personalized video that took the team 2 minutes total._

---

### 8. Competition Logistics

#### Intent

Ensure teams arrive at competitions prepared, with all logistics handled, paperwork complete, and roles assigned for competition day.

#### User Stories

**As a coach**, I want to see who doesn't have permission forms signed so that I'm not scrambling the night before.

**As a pit manager**, I want a packing checklist that knows our inventory so that we bring what we need and nothing critical is forgotten.

**As a team**, I want competition dates to automatically inform ordering urgency so that we don't miss deadlines.

**As a school administrator**, I want permission tracking that meets our compliance requirements so that we're not exposed to liability.

**As a drive team**, I want to know the competition schedule and when we need to be where so that we're never late to a match.

#### Acceptance Criteria

- Competition calendar integration (FTC, FRC schedule imports)
- Custom event creation for scrimmages, outreach
- Permission form templates by event type
- Per-student status tracking (needed → sent → signed → expired)
- Automated reminders to parents/guardians
- Packing list generator based on inventory and checklist templates
- Lead time calculations reference competition dates
- Competition-day schedule builder with role assignments (who's scouting, who's in pit, who's queuing)
- Spare parts kit verification against inventory

#### Wow Factor

_"Competition in 14 days. All 18 students have signed permission forms. Spare parts kit is complete (47/47 items verified). Tools checklist verified. Room assignments confirmed. Meal plan accounts for 2 vegetarians and 1 nut allergy. You're ready."_

---

### 9. Meal & Event Logistics Planning

#### Intent

Handle the logistical complexity of feeding teams at events—cross-referencing dietary restrictions, finding appropriate restaurants, managing budgets, and coordinating preferences—so that mentors can focus on mentoring instead of menu research.

#### The Problem This Solves

A typical outreach event requires:

- Knowing who's attending and their dietary restrictions
- Finding restaurants that can deliver to the venue (lunch)
- Finding restaurants on the route home (dinner)
- Ensuring every restriction is accommodated (vegetarian, nut allergy, halal, gluten-free)
- Staying within budget
- Remembering that Marcus hated the pizza place last time
- Coordinating preferences across 8-12 teenagers
- Placing orders, tracking delivery, handling changes

**This is machine work.** The agent can do it better, faster, and without the mental load on mentors.

#### User Stories

**As a chaperone**, I want meal options that already account for all dietary restrictions so that I'm not cross-referencing spreadsheets.

**As a student**, I want to vote on meal choices so that I feel included in decisions that affect me.

**As a mentor**, I want the agent to prepare complete order details so that I just need to approve and click.

**As a team**, I want meal preferences remembered so that the next event is even easier.

**As a budget manager**, I want to see meal costs against budget before committing so that we don't overspend.

#### Agent Capabilities

**Pre-Event Research (Automatic)**

- Cross-reference attendees with dietary restrictions/allergies
- Identify meal needs (delivered lunch? sit-down dinner? both?)
- Search for restaurants matching: location, delivery capability, dietary accommodations, budget range
- Check reviews, reliability, and past team experience
- Calculate delivery timing and route logistics
- Compile options with rationale for each

**Recommendation with Rationale**

- Present 2-3 options per meal, not a raw list
- Explain WHY each option works ("covers all dietary needs, Sofia loved it last time, reliable delivery")
- Flag concerns ("Marcus had a bad experience here last time")
- Show budget impact for each option

**Student Polling**

- Post poll in appropriate Discord channel
- Emoji voting for easy participation
- Deadline enforcement ("Poll closes Friday 6pm")
- Results compilation with tie-breaking if needed

**Order Preparation**

- Generate complete order details (items, quantities, special instructions)
- Include dietary accommodation notes ("nut allergy - prepare separately")
- Provide restaurant contact info and online ordering links
- Calculate and display budget impact
- Track delivery status on event day

**Preference Learning**

- Store individual preferences from votes and feedback
- Flag restaurants with positive/negative history
- Use preferences to improve future recommendations
- "Sofia voted for Thai again" → weight Thai higher for future events

#### Acceptance Criteria

- Dietary restrictions pulled from student profiles
- Restaurant search considers: delivery capability, dietary accommodations, budget, reviews
- Agent presents options with clear rationale, not raw search results
- Discord polling with emoji reactions
- Order details include special instructions for allergies
- Budget tracking shows meal cost against event allocation
- Preference data persists and influences future recommendations
- Day-of delivery tracking and alerts

#### Workflow Example

**Thursday (2 days before):**
Agent → Chaperone: "Here are 3 lunch options and 2 dinner options for Saturday. All accommodate Sofia's vegetarian needs, Marcus's nut allergy, Aisha's halal requirement, and Jordan's gluten sensitivity. Thai Basil is my top pick because [reasons]. Want me to poll the students?"

**Friday:**
Agent → Discord: "Time to vote on Saturday meals! 🍜🥙🌮 [Poll with emoji reactions]"

**Friday evening:**
Agent → Chaperone: "Thai Basil won lunch, Casa del Sol won dinner. Here's the complete order for Thai Basil [details]. Budget impact: $156. Dinner reservation details ready. Want me to place the lunch order?"

**Saturday:**
Agent → Chaperone: "Lunch delivery confirmed on track, ETA 12:35pm. Enjoy the event!"

#### Wow Factor

_The chaperone spends 3 minutes on meal logistics instead of 90 minutes. That's 87 extra minutes to actually be present with the students—noticing who needs encouragement, celebrating small wins, handling the inevitable teenage drama that no machine can address._

---

### 10. Communication & Awareness

#### Intent

Build student accountability and awareness through intelligent notifications—not mentor nagging.

#### User Stories

**As a student**, I want to see my action items without being told by a mentor so that I can be proactive.

**As a mentor**, I want escalation only when students don't respond so that I'm not babysitting.

**As a team**, I want notifications in Discord where we already communicate so that we're not adding another system to check.

**As a student**, I want to know WHY something is urgent so that I can prioritize intelligently.

#### Acceptance Criteria

- Role-based dashboards with personal action items
- Graduated escalation (student notification → reminder → mentor escalation)
- Discord bot integration (notifications, slash commands for lookups)
- Competition-aware urgency calculation
- Configurable notification preferences per user
- Digest options (real-time vs. daily summary)

#### Wow Factor

_Discord notification: "Hey Marcus, the servo you're waiting on (REV-41-1320) just shipped. ETA Tuesday. Just wanted you to know so you can plan the arm assembly."_

---

### 11. Team & Role Management

#### Intent

Enable students to own responsibilities while giving mentors appropriate oversight.

#### User Stories

**As a coach**, I want to assign students to subsystem teams so that responsibilities are clear.

**As a student**, I want to take on operational roles (parts manager, budget lead) so that I can develop leadership skills.

**As a mentor**, I want to see who's responsible for what so that I know who to support.

**As a new team member**, I want to understand my role and permissions so that I can contribute confidently.

#### Acceptance Criteria

- Roles: student, mentor, coach, parent (with permission levels)
- Subsystem assignments (drivetrain, arm, intake, etc.)
- Operational roles (parts manager, budget lead, logistics coordinator, travel coordinator, sponsor relations)
- Role-based permissions (can request vs. can approve vs. can purchase)
- Contact management with privacy controls
- Skill/certification tracking (safety, travel approval, driver's license)
- Per-person profiles for travel: passport, dietary restrictions, medical notes, emergency contacts

#### Wow Factor

_Sofia gets assigned "Electronics Parts Manager" and sees a welcome message: "Here's your domain. These 47 parts are your responsibility. 3 are below reorder point. Here's what to do."_

---

### 12. Agent & Extensibility

#### Intent

Create an intelligent presence that becomes part of the team's culture—not a tool to be used, but a team member to interact with. The agent should meet students where they are (Discord), handle the work mentors shouldn't have to do (nagging), and demonstrate what's possible with modern AI technology.

#### The Agent Philosophy

**The agent IS the product.** Most of what users experience should be through agent interactions, not dashboards. The web interface is the "back office" for detailed work; the agent is the daily touchpoint.

**Personality isn't decoration—it's the delivery mechanism.** A boring notification gets ignored. A GLaDOS quip gets screenshot, shared with friends, and actually responded to. The personality makes operational information stick.

**Discord-native, not Discord-compatible.** Students don't check apps. They don't read emails. They live in Discord. The agent should feel like a natural part of their Discord server—posting in the right channels, responding to mentions, using reactions appropriately.

#### User Stories

**As a student**, I want the agent to remind me about my responsibilities in a way that's funny rather than annoying so that I actually respond.

**As a mentor**, I want the agent to handle the first three reminders to students so that I only get involved when genuinely needed.

**As a team**, I want to choose a personality that matches our culture so that the agent feels like it belongs.

**As a student developer**, I want to contribute new capabilities through clear APIs so that I can add value and learn.

**As anyone**, I want to ask natural questions and get useful answers without learning special commands.

#### Agent Capabilities

**Proactive Monitoring & Notification**

- Parts status changes → notify relevant people
- Deadlines approaching → escalating reminders
- Orders shipped/delivered → celebration or heads-up
- Design changes detected → inventory/budget impact analysis
- Patterns recognized → suggestions offered

**Natural Language Queries**

- "What parts do we need to order?"
- "How much budget do we have left?"
- "Who hasn't signed permission forms?"
- "What's our status for regionals?"
- "When will the goBILDA order arrive?"

**Discord-Native Interactions**

- Posts in appropriate channels (#parts, #mechanical, #travel, etc.)
- Responds to mentions and DMs
- Uses reactions for quick confirmations (✅ to approve, 📦 to mark received)
- Respects channel purposes (doesn't spam #general with parts updates)
- Threads long conversations appropriately

**Graduated Escalation**

1. First reminder: To the responsible student, friendly tone
2. Second reminder: Slightly more pointed, still to student
3. Third reminder: "I've reminded you 3 times..." tone
4. Escalation: Mentor notified with context ("I've tried 3 times, no response")
5. Pattern tracking: "Marcus typically responds within 4 hours. It's been 2 days. This is unusual."

#### Personality System

**GLaDOS (Default)** — Dry, passive-aggressive, secretly helpful

> "I see you've added REV-41-1877 to the arm assembly. We don't have any. I'm not saying this is a problem. I'm saying it's a situation that, left unaddressed, will become a problem. Shall I add it to the order queue?"

**Wheatley** — Enthusiastic, chaotic, tries his best

> "OH! New part! Brilliant! I love new parts! Let me just check if we have—nope. We don't have any. Should we order some? I think we should order some! Let's order some! 🎉"

**Cave Johnson** — Aggressive motivation, science-first

> "I'm not going to stand here and let some BACKORDERED PART stop us from building the greatest robot this competition has ever seen! Find an alternative! MAKE one if you have to! When life gives you lemons, you MAKE COMBUSTIBLE LEMONS!"

**Turret** — Sweet, slightly ominous, helpful

> "Hello. I noticed something. The arm assembly needs parts we don't have. I want to help you. Do you want me to order them? I promise I won't hurt you. I mean... I can't hurt you. I'm software. Ordering parts now? 🎯"

**Neutral** — Professional, minimal personality

> "New part detected in arm assembly: REV-41-1877 (qty 4). Status: Not in inventory, not on order. Vendor availability: In stock at REV. Lead time: 5 days. Add to order queue?"

#### Skills Architecture

**Core Philosophy:** The agent should be extensible by students. Contributing a new skill should be a great "first PR" experience—teaching real software development while adding value to the platform.

**Skill Types:**

- **Vendor integrations** — Price checking, availability monitoring, order status
- **Platform integrations** — OnShape sync, Discord commands, Google Calendar
- **Monitoring skills** — Flight status, shipping tracking, vendor website changes
- **Intelligence skills** — Pattern recognition, prediction, optimization suggestions
- **Meal planning skills** — Restaurant search, dietary matching, delivery coordination

**Skill API Requirements:**

- Clear input/output contracts
- Sandboxed execution
- Rate limiting and error handling built-in
- Documentation and examples for each skill type
- Review process for community contributions

#### Acceptance Criteria

- Discord bot with slash commands and natural language understanding
- Configurable persona per team (with preview/test mode)
- Graduated escalation system with configurable timing
- Skills can be enabled/disabled per team
- Natural language queries return actionable information
- Reactions trigger actions (✅ on order suggestion → add to queue)
- Thread management for long conversations
- DM support for private queries

#### Wow Factors

**The conversation that blew someone's mind:**

> Student: "@buildseason can we afford 4 of those new servos?"
>
> Agent: "The REV Smart Servo is $24.99 each, so 4 would be $99.96. You have $212 remaining in parts budget. Yes, you can afford them.
>
> However: Your current BOM shows 2 servos in the intake design. Are you adding 4 to that (total 6) or replacing them? If adding, I'd note that 6 servos will draw more current than your current PDP configuration supports—you'd need to rebalance breakers.
>
> Also, goBILDA has a comparable servo for $19.99 that several teams have used successfully. Want me to pull up the comparison?"

**The "it saved our competition" moment:**

> 11 PM night before competition. Agent notices parts checklist incomplete.
>
> Agent (DM to pit manager): "Hey Sofia, the spare parts checklist shows the backup intake motor as 'packed' but inventory shows it was checked out to Marcus 3 days ago and not returned. Can you verify it's actually in the travel kit? I'm probably wrong, but I'd rather ask now than have you discover this at 7 AM."

**The sponsor relationship that deepened:**

> Agent notices: Competition won, photos uploaded, student tagged, student linked to sponsor.
>
> Agent (to sponsor relations lead): "Moment detected: Sofia led the Inspire Award presentation. She's funded by TechCorp's STEM grant. Here's a draft message with the best photo attached. Their contact usually responds within 24 hours. Send now and you'll hit their inbox Monday morning."

---

### 13. Community Intelligence

#### Intent

Leverage collective experience across teams to provide insights no single team could generate.

#### User Stories

**As an international team**, I want to know realistic lead times to my region so that I can plan effectively.

**As a new team**, I want to understand what similar teams spend on different subsystems so that I can budget realistically.

**As any team**, I want to benefit from others' vendor experiences so that I can make better decisions.

**As the community**, I want teams to contribute data automatically so that everyone benefits.

**As a Worlds-bound team**, I want to know what other international teams have experienced with customs, shipping, and travel so that I can avoid their mistakes.

#### Acceptance Criteria

- Anonymized, aggregated lead time data by vendor × destination region
- Opt-in data sharing with clear consent
- Vendor reliability scores based on delivery accuracy
- Spending benchmarks by team size/experience/region
- "Teams like yours" comparisons
- Data contribution happens automatically when enabled
- Customs/travel insights for international teams (aggregated experiences)
- Sponsor/grant intelligence (what funders support teams like ours?)

#### Wow Factor

_"Community insight: Teams traveling to Houston from Europe report average customs clearance time of 2.3 hours for robot cases when using ATA Carnet. 94% success rate with pre-prepared documentation. 3 teams reported issues with undeclared lithium batteries—make sure all battery packs are listed."_

---

## Non-Functional Requirements

### Performance

- Page loads under 2 seconds on 3G connections (international teams)
- Search results return in under 500ms
- Real-time updates for order status changes
- Mobile-responsive for build session use

### Reliability

- 99.9% uptime during competition season (September-April)
- Graceful degradation for offline scenarios
- Data backup with point-in-time recovery
- Zero data loss guarantee

### Security

- Role-based access control
- Student data privacy (FERPA considerations)
- Parent contact information protected
- Audit logging for financial transactions
- OAuth integration for school SSO where available

### Scalability

- Support 10,000+ teams without degradation
- Efficient handling of competition-day traffic spikes
- International CDN for global performance

### Accessibility

- WCAG 2.1 AA compliance
- Screen reader compatible
- Keyboard navigation
- High contrast mode option

---

## Out of Scope (Explicit Deferrals)

### Phase 1 Exclusions

**Full CAD Integration Beyond OnShape**

- SolidWorks, Fusion 360 integration deferred
- Rationale: OnShape dominates FTC; expand later based on demand

**Vendor Direct Purchase**

- API integration to place orders directly with vendors
- Rationale: Vendor API availability varies; start with tracking

**Advanced Analytics & Reporting**

- Machine learning predictions, advanced visualizations
- Rationale: Get core value working first

**Native Mobile Apps**

- iOS/Android apps
- Rationale: PWA provides adequate mobile experience initially

**Video/Media Management**

- Engineering notebook integration, match video storage
- Rationale: Out of core scope; other tools exist

**Scheduling & Calendar Management**

- Practice scheduling, room booking
- Rationale: Teams have existing solutions; avoid scope creep

---

## Success Metrics

### Leading Indicators (Track Monthly)

- Active teams (used in past 7 days)
- Parts tracked per team
- Orders placed through system
- Student logins vs. mentor logins (proxy for student ownership)
- Feature adoption rates
- Events created and tracked
- Travelers managed (for travel-enabled teams)
- Funding sources tracked

### Lagging Indicators (Track Seasonally)

- Teams retained season-over-season
- Net Promoter Score
- "Would recommend to other teams" survey
- Time saved (self-reported)
- Expedited shipping costs reduced (self-reported)
- International trips completed without major incident
- Grant compliance rate (teams that met all reporting requirements)

### Wow Moment Metrics

- "Proactive notification prevented issue" events
- Zero mentor intervention orders completed
- Permission form completion rate before competition week
- Sponsor reports generated
- Travel documents complete >7 days before departure
- Flight rebooking scenarios handled smoothly
- Outreach hours automatically logged vs. manually entered

---

## Competitive Landscape

### Current Alternatives

**Google Sheets/Docs**

- Universal, free, familiar
- No structure, no automation, no integration
- BuildSeason advantage: Purpose-built workflows, proactive intelligence

**Notion/Airtable**

- Flexible, modern interface
- Requires significant setup, no FTC-specific features
- BuildSeason advantage: Out-of-box FTC optimization, community data

**Custom Team Solutions**

- Tailored to specific team needs
- Not shared, not maintained, not scalable
- BuildSeason advantage: Community benefits, ongoing development

**Nothing (Memory + Chaos)**

- Zero cost, zero setup
- High stress, missed parts, overnight shipping
- BuildSeason advantage: Peace of mind

### Positioning Statement

For FTC robotics teams who struggle with parts ordering, inventory tracking, and operational coordination, BuildSeason is an open-source team management platform that provides intelligent awareness and proactive notifications. Unlike spreadsheets and generic project tools, BuildSeason understands robotics teams—integrating with OnShape, knowing vendor lead times, and building student accountability without mentor nagging.

---

## Appendix A: Glossary

| Term             | Definition                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| ATA Carnet       | International customs document for temporary import of goods (like robots and equipment) without paying duties |
| Build Season     | The period from game reveal (typically September) to competition when teams design and build their robot       |
| BOM              | Bill of Materials—list of parts needed for a design                                                            |
| Deliverable      | Promised action or output owed to a sponsor (logo placement, social post, facility visit, etc.)                |
| FLL              | FIRST LEGO League—robotics competition for younger students that FTC teams often mentor                        |
| FTC              | FIRST Tech Challenge—robotics competition for grades 7-12                                                      |
| FRC              | FIRST Robotics Competition—larger-scale robotics for high school                                               |
| In-Kind Donation | Non-cash contribution (parts, tools, services) that has value and should be tracked                            |
| Kit of Parts     | Standard parts provided with team registration                                                                 |
| Lead Time        | Days from order to delivery                                                                                    |
| MATE             | Marine Advanced Technology Education—underwater robotics program                                               |
| OnShape          | Cloud-based CAD software popular with FTC teams                                                                |
| Outreach         | Community engagement activities (school visits, MakerFaire, FLL mentoring) often required by grants            |
| Pit              | Team's workspace area at competition venues                                                                    |
| Restricted Funds | Sponsor or grant money that can only be used for specific purposes                                             |
| Subsystem        | Functional unit of the robot (drivetrain, arm, intake, etc.)                                                   |
| Worlds           | FIRST World Championship—annual international competition in Houston                                           |

---

## Appendix B: Agent Persona Examples

### GLaDOS Mode (Default)

**Order Reminder:**

> "Part REV-41-1320 has been sitting in 'needed' status for 9 days. I'm not saying you've forgotten about it. I'm just noting it for the permanent record."

**Delivery Update:**

> "Good news: Your goBILDA order shipped. Bad news: Based on current lead times, it will arrive 2 days after regionals. I'm sure you have a backup plan. You do have a backup plan, don't you?"

**Permission Forms:**

> "Three students still haven't submitted permission forms for Saturday. I've added them to the list of test subjects who will not be attending. I mean competitors."

**Budget Warning:**

> "Your budget shows $47.23 remaining. The part you just requested costs $52.99. I'll wait while you do the math."

**BOM Alert:**

> "Congratulations on completing your BOM. The OnShape assembly shows 47 parts you haven't added yet. But I'm sure those are just decorative."

### Neutral Mode

**Order Reminder:**

> "Part REV-41-1320 hasn't been ordered yet. Based on lead times, order by March 8 to receive before competition."

**Delivery Update:**

> "Your goBILDA order shipped. Estimated arrival: March 20. Competition is March 22."

---

## Appendix C: Example User Journeys

### Journey 1: New Team Onboarding

1. Coach signs up, creates team
2. System imports FTC competition calendar for region
3. Guided setup: add mentors, add students with roles
4. Connect OnShape workspace (optional)
5. Import vendor catalogs (pre-loaded options)
6. Quick inventory scan to capture starting point
7. Dashboard shows: "Ready for build season. Here's what to do next."

### Journey 2: Mid-Season Part Discovery

1. Design team updates OnShape assembly
2. BuildSeason detects new part (REV-41-1877)
3. System checks: Not in inventory, not on order
4. Notification to parts manager (Sofia)
5. Sofia clicks notification, sees part details
6. One-click add to order queue
7. Order aggregated with other needs
8. Request sent to mentor for approval (over threshold)
9. Mentor approves from phone
10. Order placed, tracking begins
11. Part arrives, Sofia marks received
12. Inventory updates, BOM shows complete

### Journey 3: International Worlds Travel (Romanian Team)

**3 Months Before Departure**

1. Worlds qualification confirmed → system creates "Worlds 2025" trip
2. Travel coordinator Elena invited to build itinerary
3. System prompts: Who's traveling? (Select from team roster)
4. 24 travelers added → system checks each person's profile
5. Dashboard shows: "18 students need valid passports, 6 need US visa, 24 need travel consent forms"
6. Automated reminders begin for missing documents

**2 Months Before**

1. Flight options researched, itinerary entered (Bucharest → Frankfurt → Houston)
2. System calculates: connection time, rebooking risk, group seating feasibility
3. Hotel block entered with room count
4. Rooming assignment tool opened → Elena assigns students to rooms
5. Dietary survey sent automatically to all travelers
6. Responses collected: 4 vegetarian, 2 halal, 1 severe nut allergy
7. System flags nut allergy: "Ensure airline is notified, restaurants confirmed nut-free options"

**1 Month Before**

1. Document dashboard: 22/24 passports uploaded, 5/6 visas confirmed, 20/24 consent forms signed
2. Automated escalation: Parents of 4 students receive reminder
3. Budget tracking: €67,000 committed against €75,000 Worlds travel allocation
4. Packing list generated: Robot crate contents, spare parts, tools, pit materials
5. Customs declaration pre-generated based on equipment list and values
6. System recommends: "Consider ATA Carnet for equipment valued over €10,000"

**2 Weeks Before**

1. All documents complete (system verified passport validity against travel dates)
2. Meal plan finalized: breakfast at hotel, lunch vouchers at venue, team dinners booked
3. Restaurant reservations include dietary notes
4. Emergency contact cascade documented and shared with all parents
5. "Day of" schedule built: who's where, when, doing what
6. Offline packet generated: PDF with all itineraries, contacts, emergency info

**Travel Day**

1. Flight monitoring active
2. Frankfurt connection delay detected (45 minutes)
3. System calculates: "Connection still viable with 38-minute buffer. Monitoring."
4. All travelers check in via app at each milestone
5. Arrival in Houston confirmed for all 24 travelers

**At Competition**

1. Daily schedule visible to all
2. Meal coordination: "Dinner tonight at Pappadeaux, 6:30pm. Nut allergy accommodated, halal fish confirmed."
3. Parents receive daily photo update (opt-in)
4. Expense tracking continues for reimbursement documentation

**Return Journey**

1. Customs declaration ready for robot return
2. Receipts collected throughout trip attached to expenses
3. Return flights monitored
4. All 24 travelers confirmed home safely
5. System generates: "Worlds 2025 Trip Complete. Total spend: €71,247. Budget variance: €3,753 under. All travelers returned safely."

**Post-Trip**

1. Expense report auto-generated for government grant
2. Sponsor deliverables checked: "Logo photos collected ✓, social posts completed ✓, thank-you notes drafted"
3. "Lessons learned" prompt for future travel planning
4. Community data contribution: customs timing, airline experience, hotel review (anonymized, opt-in)

---

### Journey 4: Competition Week Preparation (Domestic Team)

1. 14 days out: System generates readiness report
2. Identifies: 2 permission forms missing, 1 part in transit
3. Automated reminders sent to parents
4. Daily check: "12 days out, still waiting on Jordan's form"
5. Day 10: Jordan's form received
6. Day 8: Part delivered, marked received
7. Day 7: Packing list generated based on inventory
8. Day 2: Final readiness check—all green
9. Competition day: Team arrives prepared, coach slept well

### Journey 5: Outreach Event Coordination

1. MakerFaire invitation received → event created in calendar
2. Event type "outreach" selected → system loads template requirements
3. Shift scheduler opened: need 4 students per 3-hour shift, 3 shifts
4. Students self-sign-up for available shifts
5. System tracks: "Shift 2 (1pm-4pm) needs 2 more students"
6. Notification sent to students not yet signed up
7. Equipment checklist generated: demo robot, banner, giveaways
8. Each item assigned to a person: "Marcus: demo robot. Sofia: banner and tablecloth."
9. Permission forms auto-requested for all signed-up students
10. Day before: "All 12 participating students have signed forms. Equipment assignments confirmed."
11. Event day: attendance logged via check-in
12. Post-event: 36 outreach hours logged automatically (12 students × 3 hours)
13. Photos uploaded → tagged for sponsor reporting
14. System updates: "Season outreach total: 89 hours. Grant requirement: 100 hours. 11 hours remaining."

### Journey 6: Sponsor Report Generation

1. End of quarter approaches → system prompts: "Q3 sponsor reports due in 2 weeks"
2. Coach opens sponsor dashboard
3. Title sponsor (€25k) selected → system shows deliverable status
4. Deliverables: Logo placement ✓, 4 social posts (3/4 complete), facility visit (scheduled March 15)
5. "Generate report" clicked → system compiles:
   - Expense summary: €18,420 of €25,000 spent through Q3
   - Competition results: Regional winner, State qualifier
   - Outreach impact: 6 events, 89 hours, 412 students reached
   - Photo gallery: auto-selected from tagged uploads
   - Team roster with sponsor branding
6. Report exported as PDF with sponsor logo
7. Email draft generated with personalization
8. "Schedule remaining social post" reminder set
9. Sponsor contact updated: "Q3 report sent [date]"
10. Renewal conversation reminder set for 60 days before contract end

---

_Document maintained at: buildseason.org/docs/prd_
