// NYS Regents ELA — practice passages and prompts
// Each entry: { id, type, title, source, texts: [{title, body}], prompt }

const PASSAGES = [
  // ── Text Analysis (Part 3) ─────────────────────────────────────────────────
  {
    id: "ta_1",
    type: "text_analysis",
    title: "The Road Not Taken — Robert Frost",
    source: "Poetry, 1916",
    texts: [{
      title: "The Road Not Taken",
      body: `Two roads diverged in a yellow wood,
And sorry I could not travel both
And be one traveler, long I stood
And looked down one as far as I could
To where it bent in the undergrowth;

Then took the other, as just as fair,
And having perhaps the better claim,
Because it was grassy and wanted wear;
Though as for that the passing there
Had worn them really about the same,

And both that morning equally lay
In leaves no step had trodden black.
Oh, I kept the first for another day!
Yet knowing how way leads on to way,
I doubted if I should ever come back.

I shall be telling this with a sigh
Somewhere ages and ages hence:
Two roads diverged in a wood, and I—
I took the one less traveled by,
And that has made all the difference.`
    }],
    prompt: `After reading the poem "The Road Not Taken" by Robert Frost, write a well-developed essay in which you identify a central idea of the poem and analyze how the poet's use of a specific literary element (such as imagery, tone, symbolism, or figurative language) develops that central idea. Use strong and thorough evidence from the poem to support your analysis.`
  },

  {
    id: "ta_2",
    type: "text_analysis",
    title: "A Raisin in the Sun — Lorraine Hansberry (excerpt)",
    source: "Drama, 1959",
    texts: [{
      title: "A Raisin in the Sun (Act I, Scene I)",
      body: `WALTER: You know what I was thinking 'bout in the bathroom this morning?
RUTH: No.
WALTER: How come you always try to be so pleasant!
RUTH: What is there to be pleasant 'bout!
WALTER: You want to know what I was thinking 'bout in the bathroom or not!
RUTH: I know what you was thinking 'bout.
WALTER: (ignoring her) 'Bout what me and Willy Harris was talking about last night.
RUTH: (immediately — a refrain) Willy Harris is a good-for-nothing loudmouth.
WALTER: Anybody who talks to me has got to be a good-for-nothing loudmouth! And what you know about who is just a good-for-nothing loudmouth? Charlie Atkins was just a "good-for-nothing loudmouth" too, wasn't he! When he wanted me to go in the dry-cleaning business with him. And now — he's grossing a hundred thousand a year. A hundred thousand dollars a year! You still call him a loudmouth!
RUTH: (bitterly) Oh, Walter Lee...
WALTER: (rising and coming to her and standing over her) You tired, ain't you? Tired of everything. Me, the boy, the way we live — this beat-up hole — everything. Ain't you? (She doesn't look up, doesn't answer) So tired — moaning and groaning all the time, but you wouldn't do nothing to help, would you? You couldn't be on my side for once — that all I ask — just a little old support from my wife!`
    }],
    prompt: `After reading this excerpt from "A Raisin in the Sun" by Lorraine Hansberry, write a well-developed essay in which you identify a central idea and analyze how the playwright uses a specific literary element — such as dialogue, conflict, tone, or characterization — to develop that idea. Use strong and thorough evidence from the text to support your analysis.`
  },

  // ── Argument Essay (Part 2) ────────────────────────────────────────────────
  {
    id: "arg_1",
    type: "argument",
    title: "Should Students Have Homework?",
    source: "Informational Texts",
    texts: [
      {
        title: 'Text 1: "The Case Against Homework" — Sara Bennett & Nancy Kalish (adapted)',
        body: `Homework has been a staple of the American educational system for over a century. But research increasingly questions whether it actually helps students learn — especially at the elementary and middle school levels.

Stanford University researcher Denise Pope found that high-achieving students who spent more than three hours per night on homework reported higher levels of stress, health problems, and less time for friends and family. "The data is clear," Pope wrote. "There is no evidence that homework benefits elementary school students, and benefits at the middle school level are limited."

Many educators argue that the purpose of education is not just to fill students with facts, but to help them become curious, resilient thinkers. Homework — especially rote practice — often accomplishes neither goal. Instead, it creates anxiety and erodes love of learning.

Countries like Finland, which consistently ranks among the world's top education systems, assign very little homework. Finnish students spend time in activities they choose — reading for pleasure, sports, family time — and they perform exceptionally well on international tests.

Some argue that homework builds responsibility and time management. But if we want students to become self-directed learners, we should give them time outside school to pursue their own interests, not assign them more teacher-directed tasks.`
      },
      {
        title: 'Text 2: "In Defense of Homework" — Dr. Harris Cooper (adapted)',
        body: `Harris Cooper, a psychology professor at Duke University who has reviewed hundreds of homework studies, found a consistent positive relationship between homework and academic achievement — particularly for high school students. His "10-minute rule" — 10 minutes per grade level per night — has been widely adopted by schools.

Homework serves several important functions beyond content review. It teaches students to work independently, to manage their time, and to persist through challenges without a teacher nearby. These executive function skills are critical for success in college and careers.

Critics who compare American students to Finnish students often overlook a key difference: Finland has a highly selective teaching workforce and a culturally different attitude toward education. What works in Finland may not translate directly to urban American classrooms with larger class sizes and greater socioeconomic diversity.

Homework also provides equity benefits: it extends learning time for students whose schools have fewer resources. A student who spends 20 extra minutes practicing math each night accumulates more than 60 additional hours of practice per year.

The solution is not to eliminate homework but to make it purposeful, manageable, and meaningful. Busy work should go. But practice that reinforces and extends classroom learning? That's worth keeping.`
      },
      {
        title: 'Text 3: Student Voices — NYC High School Survey (adapted)',
        body: `In a 2023 survey of 800 NYC high school students, 72% said they had more than two hours of homework on a typical school night. 61% said homework often kept them from sleeping before midnight.

"I have four AP classes," said one junior from the Bronx. "By the time I finish homework, it's 1 a.m. I'm exhausted in school the next day. How is that helping me learn?"

But opinions were mixed. A sophomore in Queens said homework helped her stay on top of material: "When I don't do the reading at home, I'm totally lost in class. It keeps me accountable."

Many students said the problem wasn't homework itself, but the lack of coordination between teachers. "Five teachers all assigning homework like theirs is the only class is the real issue," said one student. "If teachers planned together, it would be more manageable."

Students also distinguished between types of homework: reading, projects, and writing were seen as valuable; repetitive worksheets were overwhelmingly disliked. "Give me something that makes me think," one student said, "not 50 problems that are all the same."

The survey suggests that students don't want homework eliminated — they want it to be relevant, reasonable, and worth their time.`
      },
      {
        title: 'Text 4: "What the Research Actually Says" — Education Week (adapted)',
        body: `The homework debate is often framed as black-and-white, but the research suggests a more nuanced picture.

Studies consistently show that homework is more beneficial for older students than younger ones. For elementary school students, there is little to no evidence of academic benefit. For middle school students, benefits are modest. For high school students, meaningful homework — reading, writing, problem-solving — correlates with higher achievement.

Quality matters more than quantity. Homework that requires students to think, apply concepts, or make connections shows stronger results than drill-and-practice assignments.

Teacher feedback is also critical. Homework that is assigned but never reviewed or discussed in class shows little benefit. When teachers connect homework to classroom instruction — reviewing it, discussing it, building on it — the impact is measurable.

Finally, homework can widen achievement gaps if some students have more support at home (educated parents, quiet study spaces, internet access) than others. Schools must account for these inequities when designing homework policies.

The research doesn't support wholesale elimination of homework, but it does demand that educators be intentional, selective, and equitable in what they assign.`
      }
    ],
    prompt: `Write a well-developed argument essay in which you take a position on whether schools should reduce or eliminate homework. Use evidence from at least three of the four texts to support your argument. Acknowledge and counter at least one opposing viewpoint. Remember to identify the sources you use by title or author whenever you quote or paraphrase.`
  },

  {
    id: "arg_2",
    type: "argument",
    title: "Social Media and Teen Mental Health",
    source: "Informational Texts",
    texts: [
      {
        title: 'Text 1: "The Anxious Generation" — Jonathan Haidt (adapted)',
        body: `Since 2012, rates of depression, anxiety, and self-harm among American teenagers — especially girls — have risen sharply. That year corresponds almost exactly to when smartphones became ubiquitous and social media use exploded among teens.

The correlation is striking. Girls who spend five or more hours per day on social media are nearly three times more likely to be depressed than girls who spend one hour or less. The platforms themselves are designed to be addictive — endless scrolling, algorithmic feeds that prioritize outrage and envy, and constant social comparison.

Instagram, in particular, has been shown internally (by Facebook's own researchers, revealed in leaked documents) to worsen body image for teenage girls. "We make body image issues worse for one in three teen girls," one internal presentation acknowledged.

Social media has replaced the unstructured, face-to-face socializing that prior generations used to develop emotional resilience. Teens today have fewer real-world friendships, less unsupervised outdoor time, and less experience handling conflict and boredom — the very experiences that build psychological strength.

The solution is not a total ban, but meaningful limits: no smartphones before high school, no social media before age 16, and phone-free schools. Parents and lawmakers must act before another generation is harmed.`
      },
      {
        title: 'Text 2: "Social Media Isn\'t the Problem" — Candice Odgers (adapted)',
        body: `The narrative that smartphones caused a teen mental health crisis is compelling — but the evidence doesn't support it.

Multiple large-scale studies, including a 2019 analysis of data from over 350,000 teenagers published in Nature Human Behaviour, found that social media use explains less than 1% of variance in adolescent well-being. That's smaller than the effect of wearing glasses, eating potatoes, or sleeping in shoes.

The mental health crisis among teens is real — but its causes are more likely to be economic anxiety, school pressure, rising inequality, and the aftermath of the 2008 financial crisis, which affected the families of the teenagers born in the mid-1990s.

Furthermore, for many marginalized teens — LGBTQ+ youth in rural areas, teens with disabilities, first-generation immigrants — social media provides vital community, information, and connection they cannot find locally. A blanket restriction would harm them most.

Blaming social media is convenient and politically easy. Addressing the real causes — poverty, school stress, gun violence, healthcare — is harder. We should be careful not to let a panic about technology distract us from the structural problems that actually harm young people.`
      },
      {
        title: 'Text 3: NYC Students on Social Media',
        body: `In interviews conducted at three NYC high schools, students described a complicated relationship with social media.

"It's the first thing I check when I wake up and the last thing I check before bed," said a junior from Brooklyn. "I know it's bad. But if I'm not on it, I feel like I'm missing out."

Many students acknowledged the negative effects. "Seeing everyone's highlight reel makes you feel like your life is boring," said a sophomore. "But when something good happens to me, I still post it. It's like we all know the game but keep playing."

Some students, however, pushed back on the idea that social media is inherently harmful. "For my queer friends, Instagram and TikTok were where they found their community before they came out," said one student. "You can't just take that away."

Several students mentioned school phone bans approvingly. "When I don't have my phone in class, I actually focus. I get more done. But the second I walk out of school, I'm back on it."

The consensus: students want help managing social media, not to have it taken away. "Teach us how to use it better," one student said. "Don't just ban it and pretend the problem is solved."`
      },
      {
        title: 'Text 4: What the Research Shows — American Psychological Association (adapted)',
        body: `A 2023 advisory from the American Psychological Association found that social media "can have a profound risk of harm" to the mental health of children and adolescents, while also acknowledging benefits for some groups.

The APA recommends that adolescents under 14 should not use social media without parental supervision, and that all social media use should be limited before bed and during school hours.

Research on social media and mental health shows that the effect is not uniform. Passive use — scrolling without interacting — is more strongly linked to depression than active use, such as messaging friends or creating content. Time of day also matters: late-night use disrupts sleep, which independently harms mental health.

The APA also emphasizes that platforms have a responsibility to design products that protect adolescent users. "The mental health of our nation's children cannot be held hostage to the profits of social media companies," the advisory stated.

The research suggests a middle path: not elimination, but intentional design, parental guidance, school policies, and media literacy education. Teens need to be taught not just how to use these platforms, but how to use them wisely.`
      }
    ],
    prompt: `Write a well-developed argument essay in which you take a position on whether social media is harmful to teenage mental health and whether it should be regulated or restricted for minors. Use evidence from at least three of the four texts to support your argument. Acknowledge and counter at least one opposing viewpoint. Identify sources by title or author when you quote or paraphrase.`
  },

  // ── Document Analysis (DBQ-style) ─────────────────────────────────────────
  {
    id: "dbq_1",
    type: "document_analysis",
    title: "The Civil Rights Movement: Strategies for Change",
    source: "Historical Documents",
    texts: [
      {
        title: "Document 1: Letter from Birmingham Jail — Martin Luther King Jr. (excerpt, 1963)",
        body: `One may well ask, "How can you advocate breaking some laws and obeying others?" The answer lies in the fact that there are two types of laws: just and unjust. One has not only a legal but a moral responsibility to obey just laws. Conversely, one has a moral responsibility to disobey unjust laws. I would agree with St. Augustine that "an unjust law is no law at all."

We know through painful experience that freedom is never voluntarily given by the oppressor; it must be demanded by the oppressed. Frankly, I have yet to engage in a direct action campaign that was "well timed" in the view of those who have not suffered unduly from the disease of segregation. For years now I have heard the word "Wait!" It rings in the ear of every Negro with piercing familiarity. This "Wait" has almost always meant "Never."

We have waited for more than 340 years for our constitutional and God-given rights... There comes a time when the cup of endurance runs over, and men are no longer willing to be plunged into the abyss of despair. I hope, sirs, you can understand our legitimate and unavoidable impatience.`
      },
      {
        title: "Document 2: Founding Statement of the Student Nonviolent Coordinating Committee (SNCC, 1960)",
        body: `We affirm the philosophical or religious ideal of nonviolence as the foundation of our purpose, the presupposition of our belief, and the manner of our action. Nonviolence as it grows from the Judeo-Christian tradition seeks a social order of justice permeated by love.

Through nonviolence, courage displaces fear; love transforms hate. Acceptance dissipates prejudice; hope ends despair. Peace dominates war; faith reconciles doubt. Mutual regard cancels enmity. Justice for all overcomes injustice. The redemptive community supersedes systems of gross social immorality.

We will not wait for the hearts of men to change. We will take direct action against injustice without waiting for other agencies to act. We will not obey unjust laws or submit to unjust practices. We will do this peacefully, openly, cheerfully, because our aim is to persuade. We adopt the means of nonviolence because our end is a community at peace with itself.`
      },
      {
        title: "Document 3: The Black Panther Party Platform — Huey Newton & Bobby Seale (excerpt, 1966)",
        body: `1. We want freedom. We want power to determine the destiny of our Black Community.
2. We want full employment for our people.
3. We want an end to the robbery by the White man of our Black Community.
4. We want decent housing, fit for shelter of human beings.
5. We want education for our people that exposes the true nature of this decadent American society.

We believe that the federal government is responsible and obligated to give every man employment or a guaranteed income. We believe that if the White American businessmen will not give full employment, then the means of production should be taken from the businessmen and placed in the community so that the people of the community can organize and employ all of its people and give a high standard of living.

We believe we can end police brutality in our Black community by organizing Black self-defense groups that are dedicated to defending our Black community from racist police oppression and brutality.`
      }
    ],
    prompt: `Using evidence from all three documents, write a well-developed essay that analyzes the strategies used by civil rights leaders and organizations in the 1960s to achieve social change. What were their different approaches, and what underlying beliefs drove those approaches? Use specific evidence from the documents to support your analysis. You may include relevant outside knowledge.`
  },

  // ── Text Analysis 3 ──────────────────────────────────────────────────────────
  {
    id: "ta_3",
    type: "text_analysis",
    title: "The Tell-Tale Heart — Edgar Allan Poe (excerpt)",
    source: "Short Fiction, 1843",
    texts: [{
      title: "The Tell-Tale Heart",
      body: `True! — nervous — very, very dreadfully nervous I had been and am; but why will you say that I am mad? The disease had sharpened my senses — not destroyed — not dulled them. Above all was the sense of hearing acute. I heard all things in the heaven and in the earth. I heard many things in hell. How, then, am I mad? Hearken! and observe how healthily — how calmly I can tell you the whole story.

It is impossible to say how first the idea entered my brain; but once conceived, it haunted me day and night. Object there was none. Passion there was none. I loved the old man. He had never wronged me. He had never given me insult. For his gold I had no desire. I think it was his eye! yes, it was this! He had the eye of a vulture — a pale blue eye, with a film over it. Whenever it fell upon me, my blood ran cold; and so by degrees — very gradually — I made up my mind to take the life of the old man, and thus rid myself of the eye forever.

Now this is the point. You fancy me mad. Madmen know nothing. But you should have seen me. You should have seen how wisely I proceeded — with what caution — with what foresight — with what dissimulation I went to work! I was never kinder to the old man than during the whole week before I killed him.`
    }],
    prompt: `After reading this excerpt from "The Tell-Tale Heart" by Edgar Allan Poe, write a well-developed essay in which you identify a central idea and analyze how Poe uses a specific literary element — such as point of view, diction, imagery, or irony — to develop that idea. Use strong and thorough evidence from the text to support your analysis.`
  },

  {
    id: "ta_4",
    type: "text_analysis",
    title: "The Outsiders — S.E. Hinton (excerpt)",
    source: "Young Adult Fiction, 1967",
    texts: [{
      title: "The Outsiders (Chapter 1)",
      body: `When I stepped out into the bright sunlight from the darkness of the movie house, I had only two things on my mind: Paul Newman and a ride home. I was wishing I looked like Paul Newman — he looks tough and I don't — but I guess my own looks aren't so bad. I have light-brown, almost-red hair and greenish-gray eyes. I wish they were more gray, because I hate most guys that have green eyes, but I have to be content with what I have. My hair is longer than a lot of boys wear theirs, squared off in the back and long at the front and sides, but I am a greaser and most of my neighborhood rarely bothers to get a haircut. Besides, I look better with long hair.

I had a long walk home and no company, but I usually lone it anyway, for two reasons: I enjoy walking and I had a book to read. I like reading and going to the movies better than anything else, cool cars and books. Will Rogers never met a man he didn't like. I never met a book I didn't like.

I have to tell you about the Socs and the greasers, because we are exactly the two different groups. The Socs are the jet set, the West-side rich kids. It's like the term "greaser," which is used to class all us boys on the east side. We're poorer than the Socs and the middle class. I reckon we're wilder, too. Not like the Socs, who jump greasers and wreck houses and throw beer blasts for kicks, and had it made. We steal things and drive old souped-up cars and hold up gas stations and have a gang fight once in a while.`
    }],
    prompt: `After reading this excerpt from "The Outsiders" by S.E. Hinton, write a well-developed essay in which you identify a central idea and analyze how the author uses a specific literary element — such as characterization, conflict, point of view, or setting — to develop that idea. Use strong and thorough evidence from the text to support your analysis.`
  },

  {
    id: "ta_5",
    type: "text_analysis",
    title: "Still I Rise — Maya Angelou",
    source: "Poetry, 1978",
    texts: [{
      title: "Still I Rise",
      body: `You may write me down in history
With your bitter, twisted lies,
You may trod me in the very dirt
But still, like dust, I'll rise.

Does my sassiness upset you?
Why are you beset with gloom?
'Cause I walk like I've got oil wells
Pumping in my living room.

Just like moons and like suns,
With the certainty of tides,
Just like hopes springing high,
Still I'll rise.

Did you want to see me broken?
Bowed head and lowered eyes?
Shoulders falling down like teardrops,
Weakened by my soulful cries?

Does my haughtiness offend you?
Don't you take it awful hard
'Cause I laugh like I've got gold mines
Diggin' in my own backyard.

You may shoot me with your words,
You may cut me with your eyes,
You may kill me with your hatefulness,
But still, like air, I'll rise.

Out of the huts of history's shame
I rise
Up from a past that's rooted in pain
I rise
I'm a black ocean, leaping and wide,
Welling and swelling I bear in the tide.

Leaving behind nights of terror and fear
I rise
Into a daybreak that's wondrously clear
I rise
Bringing the gifts that my ancestors gave,
I am the dream and the hope of the slave.
I rise
I rise
I rise.`
    }],
    prompt: `After reading "Still I Rise" by Maya Angelou, write a well-developed essay in which you identify a central idea of the poem and analyze how Angelou uses a specific literary element — such as repetition, metaphor, tone, or imagery — to develop that idea. Use strong and thorough evidence from the poem to support your analysis.`
  },

  // ── Argument Essay 3 ──────────────────────────────────────────────────────────
  {
    id: "arg_3",
    type: "argument",
    title: "Should College Be Free?",
    source: "Informational Texts",
    texts: [
      {
        title: 'Text 1: "The Case for Free College" — Senator Bernie Sanders (adapted)',
        body: `Every young person in America, regardless of their family's income, should be able to get a college education without going into debt. In Germany, Norway, Sweden, and Finland, public colleges are tuition-free or nearly so. These countries understand that investing in education is investing in the future of their nation.

In the United States, student loan debt now exceeds $1.7 trillion — more than credit card debt or auto loan debt. Young people are graduating with mortgages' worth of debt before they've earned their first paycheck. This debt delays home ownership, marriage, and family formation. It discourages talented students from entering essential but lower-paying fields like teaching, social work, and public service.

Critics say we can't afford it. But the United States currently spends over $700 billion per year on the military. We can afford to build aircraft carriers. We can afford to invest in our young people.

Making public colleges tuition-free would cost approximately $70 billion per year — easily funded by a modest tax on Wall Street speculation. The question isn't whether we can afford free college. The question is whether we value education enough to pay for it.`
      },
      {
        title: 'Text 2: "Free College Is the Wrong Answer" — Preston Cooper (adapted)',
        body: `The idea of free college sounds appealing, but it's bad policy — and it would make higher education worse, not better.

First, free college disproportionately benefits the wealthy. The students most likely to attend four-year colleges are from higher-income families. Subsidizing their education at taxpayer expense is a transfer of wealth from working Americans who never went to college to those who did. A plumber who didn't attend college would be funding degrees for the children of doctors and lawyers.

Second, eliminating tuition removes the incentive for colleges to compete on price and quality. When students are price-sensitive consumers, colleges must justify their costs. When the government foots the bill, colleges face no such pressure — costs will balloon even further.

Third, not everyone benefits from a four-year college degree. Many students would be better served by vocational training, apprenticeships, or community college. Focusing policy and resources on these alternatives — rather than on expensive four-year universities — would help more Americans at lower cost.

The real problem is that college is too expensive. The solution is to reduce costs and expand financial aid, not to make a dysfunctional system free.`
      },
      {
        title: 'Text 3: NYC Students on College Debt',
        body: `Students at three NYC high schools shared their feelings about college affordability.

"My parents make just enough that I don't qualify for much financial aid, but not enough to actually pay for college," said one senior from the Bronx. "I'm going to have to take out loans for something that should be a right."

Many first-generation students described pressure from families who see college as the only path forward. "My parents came here with nothing and they want me to go to college so bad. But I'm scared of the debt," said a student from Queens.

Some students questioned whether four-year college is always the right path. "I want to be an electrician," said one junior. "I don't need a bachelor's degree. But everyone acts like if you don't go to college, you failed."

A few students from wealthier backgrounds admitted they'd never really thought about tuition costs. "My parents will pay for it, so I don't really think about it," one said. "But I can see how it would be really stressful for other people."

The conversations revealed deep anxiety about the future — and near-universal agreement that the current system is unfair.`
      },
      {
        title: 'Text 4: The Return on Investment — Brookings Institution (adapted)',
        body: `The debate over free college often misses a key question: what do students actually get for their tuition dollars?

On average, a four-year college degree increases lifetime earnings by about $900,000 compared to a high school diploma. Even after accounting for the cost of tuition and four years of forgone wages, the average college graduate comes out significantly ahead. By this math, student loan debt — while painful — is often a rational investment.

However, averages can be misleading. Returns on a college degree vary enormously by major, institution, and field. A computer science degree from a state school yields a very high return. A fine arts degree from a private university with $200,000 in debt may not.

The real problem isn't that college is too expensive in absolute terms — it's that many students are paying high prices for degrees that don't pay off. Policy should focus on transparency (requiring schools to publish graduate earnings data), accountability (linking federal aid to outcomes), and targeted financial aid for students who need it.

Making all of college free addresses the symptom — high cost — without fixing the disease: a system that too often delivers poor value for high prices.`
      }
    ],
    prompt: `Write a well-developed argument essay in which you take a position on whether public college should be free or tuition-free in the United States. Use evidence from at least three of the four texts to support your argument. Acknowledge and counter at least one opposing viewpoint. Identify sources by title or author when you quote or paraphrase.`
  },

  {
    id: "arg_4",
    type: "argument",
    title: "Should Schools Have Dress Codes or Uniforms?",
    source: "Informational Texts",
    texts: [
      {
        title: 'Text 1: "The Case for School Uniforms" — National School Safety Center (adapted)',
        body: `Schools across the country are adopting uniform policies — and the results are encouraging. Uniforms reduce visible markers of socioeconomic difference, cutting down on bullying and the social pressure students feel to own expensive branded clothing. When everyone wears the same thing, what you wear is no longer a status symbol.

Studies from Long Beach, California — one of the first large urban districts to mandate uniforms — found that after adopting uniforms, school crime dropped 36%, assault dropped 34%, and vandalism dropped 18%. While researchers debate whether uniforms alone drove these outcomes, principals and teachers consistently report improved school climate.

Uniforms also save families money in the long run. Rather than buying an entire wardrobe of "appropriate school clothes," families purchase a simple uniform set that lasts the year. For low-income families, this is a real benefit.

Critics argue uniforms suppress individual expression. But school is primarily a place of learning, not fashion. Students can express their identity through their ideas, their words, their art, and their achievements — not just what they wear.`
      },
      {
        title: 'Text 2: "Uniforms Don\'t Work" — American Civil Liberties Union (adapted)',
        body: `There is little credible evidence that school uniforms improve academic performance, reduce bullying, or make schools safer.

A 2010 study published in the Journal of Educational Research analyzed data from over 1,500 Texas schools and found no significant improvement in academic achievement among schools that adopted uniforms. Similarly, a University of Houston study found that uniforms had "no significant effect on student achievement."

More troubling are the civil liberties concerns. Clothing is a form of personal expression protected by the First Amendment. Courts have repeatedly ruled that students do not "shed their constitutional rights at the schoolhouse gate." Forcing students to dress identically treats them as interchangeable rather than as individuals with their own identities, beliefs, and cultures.

For students from religious or cultural backgrounds who wear distinctive dress — hijabs, turbans, kufis, tzitzit — uniform policies can create conflict and exclusion. Any policy that forces students to choose between their faith and their education is one worth questioning.

The goal should be schools where all students feel safe and respected — not schools where conformity is mandated by fiat.`
      },
      {
        title: 'Text 3: NYC Students on Dress Codes',
        body: `Students at NYC schools with and without uniform policies shared mixed views.

"I used to hate my uniform when I was little, but now I get it," said one high schooler who attended a Catholic school. "Nobody was trying to show off what they had. You just focused on school."

At a public school with no uniform policy, a student described the social pressure differently: "Some kids get made fun of for wearing the same sneakers twice. It's exhausting. A uniform would actually be a relief."

But many students pushed back. "Expressing yourself is important," said one sophomore. "I can't afford a uniform AND clothes for outside school. It's another expense."

Several students also questioned whether uniforms addressed root causes. "Bullying isn't about clothes," said one student. "It's about power. Kids will find something else to pick on. A uniform doesn't fix that."

A teacher who had worked in both uniform and non-uniform schools said the research didn't match her experience: "The schools with uniforms I worked in were calmer. Whether that's the uniforms or the culture, I honestly can't say."

Students generally agreed: what matters most is how teachers and administrators build community — not what students wear.`
      },
      {
        title: 'Text 4: What Research Shows — Education Week (adapted)',
        body: `The research on school uniforms is genuinely mixed. Studies show modest benefits in some areas — particularly school climate and reduced bullying — but little consistent effect on academic achievement.

A key finding from recent research: the effect of uniforms depends heavily on how they are implemented and whether students and families have buy-in. Schools that adopt uniforms as part of a broader culture and safety initiative tend to see better results than those that impose them from above without community input.

Experts also note that uniforms are not the only — or even the most effective — way to reduce socioeconomic signaling in schools. Schools with strong anti-bullying programs, mentoring initiatives, and positive climate practices tend to outperform schools that rely on dress codes alone.

The debate over uniforms can distract from more impactful reforms: smaller class sizes, stronger counseling services, and better teacher pay. "We spend a lot of energy debating what kids wear," one researcher noted, "when we should be talking about what they learn."

The bottom line: uniforms may help in the right context, but they are no substitute for thoughtful, research-based approaches to school culture and climate.`
      }
    ],
    prompt: `Write a well-developed argument essay in which you take a position on whether public schools should require students to wear uniforms. Use evidence from at least three of the four texts to support your argument. Acknowledge and counter at least one opposing viewpoint. Identify sources by title or author when you quote or paraphrase.`
  },

  {
    id: "arg_5",
    type: "argument",
    title: "Should the Voting Age Be Lowered to 16?",
    source: "Informational Texts",
    texts: [
      {
        title: 'Text 1: "Let Them Vote" — Generation Citizen (adapted)',
        body: `Sixteen-year-olds can drive, pay taxes, hold jobs, and in many states be tried as adults for crimes. They can enlist in the military with parental consent. They are active, stake-holding members of their communities. They deserve a say in who governs them.

Countries that have lowered the voting age — including Scotland, Austria, and several others — have found that 16 and 17-year-olds vote at higher rates than 18 to 24-year-olds. Why? Because 16-year-olds are still embedded in their communities — living at home, attending school, connected to the civic institutions around them. When 18-year-olds leave for college or work, they often lose that connection, and many never vote again.

Neuroscience research shows that 16-year-olds have largely fully developed the brain systems responsible for deliberate decision-making — the prefrontal cortex — for low-stakes decisions made with time for reflection. Voting, which happens after discussion and deliberation, fits this profile.

Democracy works best when more people participate. Lowering the voting age would bring new voices into the process — voices of people who will live longest with the consequences of today's political decisions.`
      },
      {
        title: 'Text 2: "Not So Fast" — Dr. John Paul Wright (adapted)',
        body: `The argument for lowering the voting age, while emotionally appealing, doesn't hold up to scrutiny.

The same neuroscience research cited by advocates actually shows that the brain is not fully developed until the mid-20s — particularly in areas responsible for impulse control, long-term thinking, and resistance to peer pressure. This is why we don't allow 16-year-olds to purchase alcohol, enter contracts without parental consent, or serve on juries.

Voting is a complex civic act that requires weighing competing values, evaluating complex policy tradeoffs, and resisting manipulation by charismatic leaders. These skills develop with experience and maturity. The voting age of 18 already includes many first-time voters who are not fully engaged — adding millions of even younger voters is unlikely to strengthen democracy.

There is also a troubling asymmetry: if we are serious about political rights for teenagers, we should also extend political responsibility — including full criminal accountability and the ability to enter binding contracts. We cannot selectively grant adult political rights while shielding teenagers from adult legal responsibilities.`
      },
      {
        title: 'Text 3: Youth Voices on Voting',
        body: `We surveyed students at three NYC high schools about whether 16-year-olds should be allowed to vote.

The responses were passionate and divided.

"Climate change is going to define my entire adult life," said a 16-year-old from Manhattan. "Politicians making decisions right now about energy policy won't be alive to see the consequences. I will. I should have a say."

"I pay taxes on my part-time job," said a junior from Brooklyn. "If they can take money from me, I should be able to vote on how it's spent."

But others were skeptical. "I know a lot of people my age who have no idea what's going on politically," said one student. "And I'm not sure they should be voting. But then again, plenty of adults don't know either, and they get to vote."

Several students pointed to civic education as the real issue. "The problem isn't our age — it's that no one teaches us how government actually works," one student said. "Change the schools before you change the voting age."

Overall, about 65% of students surveyed supported lowering the voting age, with 20% opposed and 15% undecided.`
      },
      {
        title: 'Text 4: Voting Rights in History — Brookings Institution (adapted)',
        body: `The history of voting rights in the United States is a history of expansion. The franchise began as the exclusive right of white male landowners, then expanded to include non-landowners, formerly enslaved men, women, and finally, in 1971, 18-year-olds.

The 26th Amendment, which lowered the voting age from 21 to 18, was passed partly in response to the Vietnam War: young men who were old enough to die for their country should be old enough to vote for the leaders who sent them to war. The same argument applies today to 16-year-olds who can enlist with parental consent.

Internationally, the trend is also toward inclusion. Since Scotland lowered its voting age to 16 for the 2014 independence referendum, turnout among 16 and 17-year-olds has consistently exceeded that of 18 to 24-year-olds. A similar pattern has been observed in Austria, where 16-year-olds have been eligible to vote in national elections since 2007.

The question of voting age is ultimately a question of democratic values: who counts as a full member of the political community, and who gets to shape the future? History suggests that when we have expanded the franchise, democracy has been strengthened, not weakened.`
      }
    ],
    prompt: `Write a well-developed argument essay in which you take a position on whether the voting age in the United States should be lowered to 16. Use evidence from at least three of the four texts to support your argument. Acknowledge and counter at least one opposing viewpoint. Identify sources by title or author when you quote or paraphrase.`
  },

  {
    id: "arg_6",
    type: "argument",
    title: "Is Artificial Intelligence a Threat or an Opportunity?",
    source: "Informational Texts",
    texts: [
      {
        title: 'Text 1: "AI Will Reshape Work — Not End It" — MIT Technology Review (adapted)',
        body: `Throughout history, new technologies have destroyed some jobs while creating new ones. The printing press eliminated the job of the scribe but created an entire publishing industry. The automobile replaced the horse and buggy industry but created manufacturing, logistics, and a century of road-trip tourism. Economists call this "creative destruction" — and most evidence suggests AI will follow the same pattern.

A 2023 McKinsey Global Institute report found that while AI could automate up to 30% of current work tasks by 2030, it is also projected to create 20–50 million new jobs globally in areas like AI maintenance, data analysis, healthcare, and green energy. The key, as always, is adaptation: workers who learn to collaborate with AI tools will be more productive, not replaced.

AI also promises enormous benefits: earlier cancer detection, faster drug discovery, personalized education, and solutions to complex problems like climate change. These are not small gains. The question isn't whether AI will change the economy — it will. The question is whether we will invest in training and transition programs that help workers adapt.`
      },
      {
        title: 'Text 2: "This Time Is Different" — Daron Acemoglu (adapted)',
        body: `The optimistic view of AI — that it will create as many jobs as it destroys — may be dangerously wrong this time.

Unlike previous waves of automation, which replaced physical labor while increasing demand for cognitive work, AI is targeting cognitive work itself. Legal research, medical diagnosis, accounting, writing, and coding — the "safe" jobs of the knowledge economy — are now automatable. There is no clear category of work that AI cannot, in principle, eventually perform.

The pace of change also matters. Previous technological transitions happened over decades, giving labor markets time to adjust. AI capabilities are advancing at unprecedented speed. The workers and institutions that need to adapt have less time than they think.

Perhaps most concerning is who bears the costs. History shows that the gains from technological change go primarily to capital owners and highly skilled workers, while the disruption falls disproportionately on lower- and middle-income workers with less political power. Without strong policy intervention — including retraining programs, social safety nets, and potentially a universal basic income — AI could dramatically worsen inequality.

This doesn't mean we should stop developing AI. It means we need to be honest about the risks and govern the technology deliberately, not hope that the market will sort it out.`
      },
      {
        title: 'Text 3: NYC Students on AI',
        body: `Students at three NYC high schools described complex, sometimes contradictory feelings about AI.

"I use ChatGPT for everything," admitted one junior. "Homework, cover letters, emails. It makes my life easier. But I also wonder if I'm learning anything."

Several students raised concerns about their future careers. "I want to be a graphic designer," said one sophomore. "But AI can make images now. What happens to my job?"

Others were more optimistic. "AI isn't going to replace doctors," said a student interested in medicine. "It might help doctors diagnose faster. That means more patients get help."

A student who works a part-time retail job was less sure. "There are already self-checkout machines at my store. They're going to replace the cashiers. Those are real people losing real jobs."

Students were divided on whether schools were preparing them adequately. "We learn to use AI tools, but not really to think critically about them," one student said. "We should be asking: who benefits? Who's harmed? Who decides?"

The consensus: students want to benefit from AI, but they want protection from its worst effects — and they want a voice in shaping how it's used.`
      },
      {
        title: 'Text 4: Governing AI — The Brookings Institution (adapted)',
        body: `Artificial intelligence presents both extraordinary promise and serious risk. Managing the transition requires thoughtful governance — neither uncritical enthusiasm nor paralyzing fear.

Several areas demand immediate policy attention. First, labor market disruption: governments should invest significantly in retraining programs, portable benefits, and stronger unemployment insurance before displacement occurs at scale, not after. Second, bias and fairness: AI systems trained on historical data can encode and amplify existing inequalities. Regulators must require transparency and accountability in high-stakes AI applications in hiring, lending, and criminal justice. Third, concentration of power: AI capabilities are currently concentrated in a handful of large companies. Antitrust enforcement and open-source development can help prevent AI from becoming a tool of monopoly.

The good news: we have time to act — but not indefinitely. The policy choices made in the next few years will shape the AI economy for decades. History suggests that the countries and societies that invest early in managing technological transitions come out ahead.

AI is neither a utopia nor a dystopia. It is a powerful tool — and like all powerful tools, its effects depend on who controls it, and for what purpose.`
      }
    ],
    prompt: `Write a well-developed argument essay in which you take a position on whether artificial intelligence is primarily a threat or an opportunity for society. Use evidence from at least three of the four texts to support your argument. Acknowledge and counter at least one opposing viewpoint. Identify sources by title or author when you quote or paraphrase.`
  },

  // ── Document Analysis (DBQ) 2 ─────────────────────────────────────────────────
  {
    id: "dbq_2",
    type: "document_analysis",
    title: "Women's Suffrage: The Fight to Vote",
    source: "Historical Documents",
    texts: [
      {
        title: "Document 1: Declaration of Sentiments — Elizabeth Cady Stanton (excerpt, 1848)",
        body: `We hold these truths to be self-evident: that all men and women are created equal; that they are endowed by their Creator with certain inalienable rights; that among these are life, liberty, and the pursuit of happiness...

The history of mankind is a history of repeated injuries and usurpations on the part of man toward woman, having in direct object the establishment of an absolute tyranny over her. To prove this, let facts be submitted to a candid world.

He has never permitted her to exercise her inalienable right to the elective franchise.
He has compelled her to submit to laws, in the formation of which she had no voice.
He has withheld from her rights which are given to the most ignorant and degraded men — both natives and foreigners.
He has taken from her all right in property, even to the wages she earns.

In entering upon the great work before us, we anticipate no small amount of misconception, misrepresentation, and ridicule; but we shall use every instrumentality within our power to effect our object. We shall employ agents, circulate tracts, petition the State and National legislatures, and endeavor to enlist the pulpit and the press in our behalf. We hope this Convention will be followed by a series of Conventions embracing every part of the country.`
      },
      {
        title: "Document 2: Speech at the International Council of Women — Susan B. Anthony (excerpt, 1888)",
        body: `The right of self-government for every citizen is the fundamental idea of our Republic.

For fifty years the women of this nation have tried every possible way to secure their right to a voice in the government which taxes them, which drafts their sons into armies, which makes and administers the laws by which they are governed. They have made appeals to Congress, to State legislatures, to party conventions, to newspapers, to individuals; they have circulated petitions, delivered speeches, written articles, organized associations, held conventions. They have done everything that women could do. And the answer has always been the same — "Your time has not come. Wait."

I have been asked to say a word about the progress of our cause. It moves. Slowly, perhaps, but it moves. Every year more women vote in school elections, in municipal elections, in local elections. Every year more men of all parties begin to see that democracy cannot long endure half slave and half free — in this case, half voting and half non-voting.

The time will come — I believe it is near — when the women of this nation shall stand equal with men before the law.`
      },
      {
        title: "Document 3: Anti-Suffrage Pamphlet — Massachusetts Association Opposed to the Further Extension of Suffrage to Women (excerpt, 1915)",
        body: `The question is not whether women are capable or intelligent — manifestly they are both. The question is whether the extension of suffrage to women would be good for the State, for the family, and for women themselves.

We believe it would not.

The home is woman's sphere. The management of the household, the care and education of children, the maintenance of family life — these are tasks of supreme importance, and women perform them with a devotion and skill that no man can match. These tasks would be neglected, not advanced, if women were drawn into the hurly-burly of political life.

Moreover, the great majority of women do not want to vote. They are not asking for this right. A small and vocal minority speaks loudly, but they do not represent the silent majority of American womanhood who are content with their present position and who view with alarm the disruption that female suffrage would bring to the social order.

We do not oppose women's rights. We oppose the confusion of political rights with human rights, and the belief that voting is the measure of citizenship. Women's influence in society is profound, pervasive, and — we believe — better exercised through the home and the moral education of the next generation than through the ballot box.`
      }
    ],
    prompt: `Using evidence from all three documents, write a well-developed essay that analyzes how supporters of women's suffrage argued for their cause and how opponents argued against it. What values and assumptions underlie each position? Use specific evidence from the documents to support your analysis. You may include relevant outside knowledge.`
  },

  {
    id: "dbq_3",
    type: "document_analysis",
    title: "The New Deal: Government's Role in the Economy",
    source: "Historical Documents",
    texts: [
      {
        title: "Document 1: Franklin D. Roosevelt's First Inaugural Address (excerpt, 1933)",
        body: `This is preeminently the time to speak the truth, the whole truth, frankly and boldly. Nor need we shrink from honestly facing conditions in our country today. This great Nation will endure as it has endured, will revive and will prosper. So, first of all, let me assert my firm belief that the only thing we have to fear is fear itself — nameless, unreasoning, unjustified terror which paralyzes needed efforts to convert retreat into advance.

Our greatest primary task is to put people to work. This is no unsolvable problem if we face it wisely and courageously. It can be accomplished in part by direct recruiting by the Government itself, treating the task as we would treat the emergency of a war, but at the same time, through this employment, accomplishing greatly needed projects to stimulate and reorganize the use of our natural resources.

We do not distrust the future of essential democracy. The people of the United States have not failed. In their need they have registered a mandate that they want direct, vigorous action. They have asked for discipline and direction under leadership. They have made me the present instrument of their wishes. In the spirit of the gift I take it.`
      },
      {
        title: "Document 2: Statement Against the New Deal — Herbert Hoover (excerpt, 1936)",
        body: `I am speaking of a proposal which the New Dealers call "planned economy." It is not new. It was tried by Mussolini as the "Corporate State" and it is being tried by Hitler. True, it is not as drastic as European Fascism. But it is the same philosophy of government.

Fundamental American liberties are at stake. Is the Republican Party ready for the issue? Are you willing to cast your vote for liberty? I mean by liberty, liberty of the press, liberty of the courts, liberty of speech, freedom from bureaucracy. I mean the right of men to choose their jobs, the right of men to have their own business, the right of men to be free to earn a living without dictation from government.

Under the New Deal, the government has spent and spent. It has taxed and taxed. And it has elected and elected — buying votes with the people's own money. The spending bill for 1937 is the largest peacetime budget in the history of the Republic.

The issue is whether we shall have a government or whether we shall have a people.`
      },
      {
        title: "Document 3: Letter to President Roosevelt — Lillian Gentry, unemployed worker (1934)",
        body: `Dear Mr. President,

I am writing to you because I don't know where else to turn. My husband has been out of work for two years. We have three children, the youngest just four years old. We have lost our home. We are living with my husband's sister, who has her own family and her own troubles.

I am not writing to complain. I am writing to say thank you. The relief we have received through your programs has kept us alive. The work my husband found through the CCC — the Civilian Conservation Corps — has given him back his dignity. He gets up in the morning with a purpose again. He is helping to build something.

I know some people say the government shouldn't be doing this — that it's not the government's place to help people like us. But Mr. President, when there is no work to be found and no food on the table, where else can we turn? The banks failed us. The businesses failed us. Only the government has answered our call.

God bless you, Mr. President. Please keep fighting for us.

Respectfully,
Lillian Gentry`
      }
    ],
    prompt: `Using evidence from all three documents, write a well-developed essay that analyzes the debate over the New Deal's expansion of government power during the Great Depression. What were the arguments for and against government intervention in the economy? What values and interests shaped each perspective? Use specific evidence from the documents to support your analysis. You may include relevant outside knowledge.`
  }
];
