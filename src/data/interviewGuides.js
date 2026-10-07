/**
 * The Interview Preparation guides.
 *
 * Four long reads a student works through before handing in their written
 * answers on the journey's Interview Preparation stage. The journey template's
 * `resources` link here by slug (`/interviews/guides/<slug>`), so a slug is a
 * URL contract with `backend/app/services/journey_templates.py` and its
 * migration — rename one and the journey cards point at nothing.
 *
 * Figures that change (maintenance amounts, the Graduate Route's length) are
 * stated as "check the current figure" rather than printed: a guide that goes
 * stale on a number is worse than one that sends the student to GOV.UK.
 *
 * Section shapes (every key optional except `heading`):
 *   body       paragraphs
 *   tips       a list of short points
 *   dos/donts  side-by-side lists
 *   questions  [{ q, checking, tip }] — what is asked, what it tests, how to answer
 *   template   [{ label, prompt }]    — fill-in prompts
 *   examples   [{ label, weak, strong }]
 */

const q = (question, checking, tip) => ({ q: question, checking, tip });

export const interviewGuides = [
  {
    slug: "common-questions",
    title: "Common interview questions",
    description: "Top 40 credibility questions with tips",
    readMinutes: 18,
    intro:
      "UK universities run a pre-CAS interview before they issue your CAS, and UKVI can call you for a credibility interview before deciding your visa. Both ask the same thing in different words: are you a genuine student who chose this course for a real reason, can you pay for it, and will you follow the rules of your visa? These are the 40 questions that come up most, grouped by what they are really testing.",
    sections: [
      {
        heading: "How to use this list",
        body: [
          "Do not memorise scripted answers. Interviewers are trained to spot recitation, and a word-perfect answer delivered without thinking reads as coached — which is one of the reasons applications are refused.",
          "Instead, for each question, know the facts underneath it: your course modules, your fees, your sponsor's income, your plan after graduating. Then say it in your own words. If you know the facts, the wording takes care of itself.",
        ],
        tips: [
          "Answer the question asked, then stop. Long answers wander into things you did not need to say.",
          "Specific beats impressive. \"Module 3, Machine Learning, because of my final-year project\" beats \"the world-class teaching\".",
          "If you do not understand a question, ask them to repeat it. That is normal and costs you nothing.",
          "Everything you say must match your application, SOP and financial documents. Inconsistency is the most common reason for refusal.",
        ],
      },
      {
        heading: "About you and your background",
        questions: [
          q("Tell me about yourself.", "Whether you can give a short, honest summary that leads naturally to your study plan.", "Keep it to 60 seconds: where you studied, what you have done since, and why that leads to this course."),
          q("What did you study before, and what were your results?", "That your academic history is what your documents say it is.", "Know your grades, institution and year of completion exactly. Do not round up."),
          q("What have you been doing since you finished your last qualification?", "Whether a gap in your studies has a real explanation.", "Name the job, course or responsibility, with dates. A gap explained with evidence is fine; a vague gap is a red flag."),
          q("Do you have any work experience? How does it relate to this course?", "Whether the course is a logical next step in your career.", "Connect one concrete task you did at work to one module on the course."),
          q("Have you ever been refused a visa for any country?", "Honesty. They already know the answer.", "Say yes if it is yes, and explain briefly what has changed since. Lying here is fatal; a past refusal usually is not."),
          q("Have you travelled abroad before?", "Your immigration history and whether you returned on time.", "Give the countries, dates and purpose. Mention that you returned as planned."),
        ],
      },
      {
        heading: "About your course",
        questions: [
          q("What course will you study, and how long is it?", "That you know the basic facts of your own application.", "Exact title, level, duration and start date — as written on your offer letter."),
          q("Why did you choose this course?", "Whether there is a real academic or career reason.", "Link something you have already studied or done to two or three named modules, then to a career goal."),
          q("Name some of the modules you will study.", "Whether you have actually read the course page.", "Know three or four modules by name and be able to say in a sentence what each covers."),
          q("How is the course assessed?", "Depth of your research beyond the headline.", "Exams, coursework, group projects, dissertation — and roughly how the final year is weighted."),
          q("How does this course relate to your previous studies?", "Progression. A backwards or unrelated step needs a reason.", "Show it builds on what you know. If you are changing field, explain exactly why and what prepared you."),
          q("Why not study this course in your own country?", "Whether the UK is chosen for the education, not the visa.", "Compare specifically: a module, accreditation, industry links or duration that is not available at home."),
          q("What will you do in your dissertation or final project?", "Whether you have thought beyond enrolment.", "A topic area and why it interests you is enough. It does not need to be final."),
          q("Is there a placement or internship on the course?", "That you know the structure you signed up for.", "Say whether there is, and if so, how long and when."),
        ],
      },
      {
        heading: "About the university",
        questions: [
          q("Why did you choose this university?", "Whether you compared options or simply took the first offer.", "Give two concrete reasons: a module, a facility, a staff member's research, a ranking in your subject, or industry links."),
          q("Which other universities did you apply to?", "Consistency of your choices.", "Name them honestly and say why this one came out on top."),
          q("Where is the university, and what do you know about the city?", "That you have looked beyond the website's home page.", "Name the city and campus, roughly where you will live, and how you will travel to classes."),
          q("How did you find out about this university?", "Whether an agent chose it for you.", "Say how you found it, then show you researched it yourself."),
          q("What is the university known for in your subject?", "Real research.", "One fact: a subject ranking, an accreditation, a research centre, or a well-known employer partnership."),
          q("Who will teach you, or what facilities will you use?", "Depth of research, mostly for postgraduate students.", "Know one lab, studio, library resource or academic whose work interests you."),
        ],
      },
      {
        heading: "About your finances",
        questions: [
          q("How much are your tuition fees?", "That you know exactly what you are paying.", "State the annual fee from your offer or CAS, and how much you have already paid as a deposit."),
          q("Who is paying for your studies?", "Who the sponsor is and whether that is believable.", "Name them and their relationship to you. See the Finance & sponsor guide."),
          q("What does your sponsor do, and how much do they earn?", "Whether the income can genuinely support the cost.", "Their occupation, employer or business, and their annual income — consistent with the documents you submitted."),
          q("How much will you need for living costs, and where is that money?", "That the maintenance money exists and is set aside.", "The monthly amount UKVI requires for your location, and the account it is held in."),
          q("Have you taken an education loan?", "Consistency with your financial evidence.", "If yes: the bank, amount and whether it is disbursed or sanctioned. If no, say so."),
          q("What will you do if your sponsor can no longer pay?", "Whether you have thought about risk.", "Mention the funds already held and any backup — do not suggest working to pay your fees."),
          q("Do you plan to work while studying?", "Whether you are coming to work, not study.", "Part-time at most, within visa limits, and never to fund your fees. Study comes first."),
        ],
      },
      {
        heading: "About the UK and your visa",
        questions: [
          q("How many hours can you work on a Student visa?", "That you know the conditions of the visa you are applying for.", "During term time, students at degree level can usually work up to 20 hours a week. Check the current rule on GOV.UK."),
          q("Where will you live in the UK?", "Planning and realistic costs.", "University halls or private accommodation, the area, and roughly what it costs per month."),
          q("What will your monthly living costs be?", "That your budget is realistic.", "Rent, food, travel and bills, adding up to roughly what you have shown for maintenance."),
          q("Do you have any family or friends in the UK?", "Whether there is a pull factor to stay.", "Answer honestly. Having family there is not a problem; hiding it is."),
          q("What do you know about the Graduate Route?", "Whether you plan around immigration rather than study.", "Know that it exists and what it is for, but keep your plan focused on your career goal, not on staying."),
          q("Why did you choose the UK over countries like Canada or Australia?", "Whether the UK is a deliberate choice.", "Course length, the specific programme, recognition of UK degrees in your field at home."),
        ],
      },
      {
        heading: "After you graduate",
        questions: [
          q("What will you do after you finish your course?", "That your plan is clear and believable.", "A specific role, sector and place. A vague plan reads as a plan to stay."),
          q("What job do you expect to get, and what will it pay?", "Return on investment — does the course make sense?", "Name two or three employers or job titles at home and a realistic salary range."),
          q("How will this degree help your career at home?", "Ties and motivation to return.", "Show how the qualification is valued at home, with an example employer or sector."),
          q("What ties do you have to your home country?", "Whether you will leave when your visa ends.", "Family, property, a job offer, a family business — whatever is true and specific."),
          q("Would you stay in the UK if you got a job offer there?", "A trap question about intent.", "Be honest and balanced: your plan is to return and use the degree at home; you would follow the immigration rules whatever happens."),
          q("Where do you see yourself in five years?", "Coherence of the whole story.", "A role that connects your past studies, this course and your home country."),
          q("Is there anything else you want to tell us?", "A chance to fix a weak answer.", "Briefly correct or add to anything you answered poorly. Otherwise, a short thank-you is fine."),
        ],
      },
      {
        heading: "On the day",
        dos: [
          "Test your camera, microphone and internet 30 minutes before.",
          "Sit in a quiet, well-lit room with nothing behind you that distracts.",
          "Keep your passport, offer letter, CAS details and financial documents within reach.",
          "Look at the camera, not the screen, when you speak.",
          "Pause for a second before answering. It shows you are thinking, not reciting.",
        ],
        donts: [
          "Do not read from notes or a second screen. It is noticed, and it can end the interview.",
          "Do not let anyone else in the room or prompt you.",
          "Do not guess numbers. \"I am not sure of the exact figure, it is around …\" is better than a confident wrong answer.",
          "Do not criticise your home country's education system to justify the UK.",
          "Do not mention working to pay your fees or wanting to settle in the UK.",
        ],
      },
    ],
  },
  {
    slug: "course-research",
    title: "Course & university research",
    description: "Template: why this course, why this university",
    readMinutes: 12,
    intro:
      "\"Why this course?\" and \"why this university?\" are asked in almost every interview, and they are where most weak answers come from. A strong answer is not a compliment about the university — it is evidence that you compared options and chose this one for reasons that connect to your past and your future. This guide gives you the checklist to research with, and a template to turn that research into your answer.",
    sections: [
      {
        heading: "Your research checklist",
        body: ["Open your course page and the university's website, and note down each of these. You will use them in the template below."],
        tips: [
          "Full course title, level, duration and start date — exactly as on your offer letter.",
          "Three or four modules by name, and one sentence on what each covers.",
          "How the course is assessed: exams, coursework, group work, dissertation or project.",
          "Any placement year, internship, field trip or live industry project.",
          "Accreditation by a professional body (for example BCS, ACCA, NMC, IMechE), if there is one.",
          "The university's ranking in your subject — subject tables mean more than the overall ranking.",
          "One academic, research centre or facility linked to your interests.",
          "The city and campus: where it is, where you might live, and the rough monthly cost.",
          "Tuition fee per year, the deposit you have paid, and any scholarship you received.",
          "Career outcomes: typical roles and employers for graduates of this course.",
        ],
      },
      {
        heading: "Why this course — the template",
        body: ["Fill in each line in your own words. Your answer should flow past → course → future."],
        template: [
          { label: "What I studied or did before", prompt: "My background is in … where I studied / worked on …" },
          { label: "The gap I want to fill", prompt: "I realised I need deeper knowledge of … because …" },
          { label: "Modules that fill it", prompt: "The modules … and … cover exactly this, especially …" },
          { label: "How it is taught or assessed", prompt: "The course includes … (placement / project / lab work), which suits me because …" },
          { label: "Where it leads", prompt: "After graduating I plan to work as … at … in my home country." },
        ],
      },
      {
        heading: "Why this university — the template",
        template: [
          { label: "How I chose", prompt: "I compared … (two or three other universities) on … (modules, cost, ranking, location)." },
          { label: "What stood out academically", prompt: "This university offers … which the others did not." },
          { label: "Reputation in my subject", prompt: "It is ranked / accredited / known for … in my subject." },
          { label: "Practical reasons", prompt: "The location / cost / support for international students suits me because …" },
        ],
      },
      {
        heading: "Why the UK",
        template: [
          { label: "The course itself", prompt: "A course with … is not available at home / takes longer at home." },
          { label: "Recognition", prompt: "UK degrees in my field are valued by employers such as … at home." },
          { label: "Duration and value", prompt: "A … year programme lets me … and return to my career sooner." },
        ],
      },
      {
        heading: "Weak answers vs strong answers",
        examples: [
          {
            label: "Why this course?",
            weak: "Because it is a very good course and it will give me a better future.",
            strong:
              "In my BSc I built a small inventory app and found I enjoyed the data side most. This MSc's modules in Machine Learning and Big Data Systems go deeper into exactly that, and the final project is done with an industry partner. I want to return to work as a data analyst in a bank, where these skills are in demand.",
          },
          {
            label: "Why this university?",
            weak: "It is a world-class university with excellent facilities and a beautiful campus.",
            strong:
              "I compared it with two other universities. This one has a BCS-accredited course and a module in cloud computing the others did not offer, and its computer science department ranks well for graduate employment. The fees were also within my family's budget.",
          },
          {
            label: "Why the UK?",
            weak: "The UK has a good education system and many opportunities.",
            strong:
              "A one-year master's in the UK lets me get back into my career quickly, and UK degrees in IT are well recognised by employers back home. A comparable programme at home takes two years and does not include an industry project.",
          },
        ],
      },
      {
        heading: "Check your answer against your documents",
        tips: [
          "Your SOP, your interview answers and your application should tell the same story.",
          "Use the module names exactly as the course page lists them.",
          "If your plans have changed since you wrote your SOP, tell your counsellor before the interview.",
        ],
      },
    ],
  },
  {
    slug: "finance-sponsor",
    title: "Finance & sponsor explanation",
    description: "How to talk about your funding clearly",
    readMinutes: 10,
    intro:
      "Questions about money are where interviews are most often lost — not because students lack funds, but because they cannot explain them. You are expected to know who is paying, where the money comes from, how much the course costs, and how your living costs will be covered. Every answer must match the financial documents you submitted.",
    sections: [
      {
        heading: "Know these numbers before the interview",
        tips: [
          "Your annual tuition fee, as written on your offer or CAS.",
          "The deposit you have already paid, and the balance still due.",
          "The maintenance (living cost) amount UKVI requires for your study location — it is higher in London. Check the current figure on GOV.UK.",
          "The total you needed to show (remaining fees + maintenance), and the total in your evidence.",
          "The name of the bank and the type of account where the funds are held.",
          "If you have a loan: the lender, sanctioned amount and whether it has been disbursed.",
        ],
      },
      {
        heading: "Explaining your sponsor",
        body: [
          "Most students are funded by a parent, a close relative or a loan. Whoever it is, be ready to say who they are, what they do, and why they are paying.",
        ],
        template: [
          { label: "Who", prompt: "My studies are funded by my … (father / mother / uncle …), …" },
          { label: "What they do", prompt: "who works as a … at … / runs a … business, for … years." },
          { label: "Their income", prompt: "Their annual income is about …, from … (salary / business / agriculture / rental)." },
          { label: "Where the money is", prompt: "The funds have been held in their … account at … since …" },
          { label: "Why they are supporting you", prompt: "They are supporting me because …" },
        ],
      },
      {
        heading: "The 28-day rule",
        body: [
          "For a Student visa, your maintenance and remaining fee funds generally need to have been held for at least 28 consecutive days, and the closing balance date must fall within 31 days of your visa application. If the balance dipped below the required amount on any day in those 28 days, it can count against you.",
          "If your interviewer asks how long the money has been in the account, give the date it reached the required amount.",
        ],
      },
      {
        heading: "Large or recent deposits",
        body: [
          "A large sum that appeared in the account shortly before your application will be noticed. Be ready to explain it with evidence: sale of land or property, maturity of a fixed deposit, a loan disbursement, a business payment. Say what it was, when, and which document proves it.",
        ],
      },
      {
        heading: "Do and don't",
        dos: [
          "Use the same figures as your bank statements and sponsor letter.",
          "Say \"about\" when you give an approximate figure, and know the exact figure for fees.",
          "Explain your sponsor's income source in one or two plain sentences.",
          "Mention the deposit you have already paid — it shows commitment.",
        ],
        donts: [
          "Do not say you will work in the UK to pay your fees or living costs.",
          "Do not say a friend, agent or unrelated person lent you money \"for the visa\".",
          "Do not guess your sponsor's income or change the figure when asked twice.",
          "Do not say money will come \"later\" or \"when needed\" — funds must already be held.",
        ],
      },
      {
        heading: "Example answer",
        examples: [
          {
            label: "Who is paying for your studies?",
            weak: "My family will manage it.",
            strong:
              "My father is sponsoring me. He has run a hardware wholesale business for 15 years and earns about 4.5 million rupees a year. The funds for my remaining fees and nine months of living costs have been in his savings account since March, and I have already paid a £5,000 deposit to the university.",
          },
        ],
      },
    ],
  },
  {
    slug: "mock-interview",
    title: "Practise with a mock interview",
    description: "Scored practice in your portal",
    readMinutes: 6,
    intro:
      "Reading answers is not the same as saying them out loud under pressure. The three practice sets on this page simulate the interviews you will meet: the university's Pre-CAS interview, the UKVI credibility interview, and an academic interview for your programme. Completing all three is what unlocks your Interview Recording hand-in.",
    sections: [
      {
        heading: "The three practice sets",
        tips: [
          "Pre-CAS Interview — the university's check before it issues your CAS: course knowledge, funding and intent.",
          "UKVI Credibility Interview — the Home Office's questions on whether you are a genuine student.",
          "Academic / Programme Interview — subject questions about your background and why this programme.",
        ],
      },
      {
        heading: "How it works",
        body: [
          "Each set asks a handful of questions one at a time. You can type your answer or record yourself with your camera or microphone. When you finish, you get a score and feedback on what to improve.",
          "You can retake a set as often as you like — your best score is what shows on this page. Once all three show Completed, you can send your scores to your counsellor from the Interview Recording hand-in.",
        ],
      },
      {
        heading: "Set up like the real thing",
        tips: [
          "A quiet room, a plain background and light in front of you, not behind.",
          "Camera at eye level; look into the lens when you answer.",
          "Headphones with a microphone if your room echoes.",
          "No notes in front of you — practise answering from what you know.",
          "Dress as you would for the real interview, so it feels real.",
        ],
      },
      {
        heading: "Getting the most from practice",
        tips: [
          "Do each set once without preparing, to find your weak spots.",
          "Read the relevant guide, then do the set again and compare scores.",
          "Watch your recordings back: check pace, eye contact and filler words (\"um\", \"basically\").",
          "Aim for answers of 30–90 seconds. Shorter usually lacks detail; longer usually wanders.",
          "If a question keeps tripping you up, write down the facts behind it — not a script.",
        ],
      },
    ],
  },
];

export const interviewGuide = (slug) => interviewGuides.find((guide) => guide.slug === slug) ?? null;

/**
 * The guide a journey resource card should open.
 *
 * Templates seeded before the guides existed carry `url: ""` (or `/interviews`
 * for the mock), so an older row is matched on its title instead.
 */
export const guideHrefForResource = (resource) => {
  if (resource?.url?.startsWith("/interviews/guides/")) return resource.url;
  const guide = interviewGuides.find((g) => g.title === resource?.title);
  return guide ? `/interviews/guides/${guide.slug}` : resource?.url || null;
};
