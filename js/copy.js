// Alle vaste teksten van de scan op één plek (jij-vorm). Vragen, ankers en claims komen uit de JSON.
// Teksten gemarkeerd met [CONCEPT] zijn door Claude Code geschreven en wachten op Iris' akkoord.

export const COPY = {
  scanName: 'AI-readinessscan', // werktitel; definitieve naam is een open punt
  welcome: {
    eyebrow: 'Gratis · ongeveer 10 minuten · direct je uitslag',
    title: 'Hoe klaar is jouw organisatie voor AI?', // [CONCEPT]
    intro:
      'Deze scan brengt in kaart waar jouw bedrijf of organisatie nu staat met AI. Je beantwoordt 22 vragen over wat er in de praktijk gebeurt. Daarna zie je direct waar het stevig staat, waar het schuurt en waar je het best kunt beginnen.', // [CONCEPT]
    // [CONCEPT] Alinea "wat is de scan en waarom", naar het voorbeeld van Wortell (opbouw, niet de tekst).
    whyTitle: 'Waarom deze scan?',
    why: [
      'Bijna elke organisatie doet inmiddels iets met AI. Een collega die een chatbot gebruikt om teksten te schrijven, een slimme functie in software die je al had, een eerste proef in een team. Maar losse initiatieven leveren nog geen resultaat op.',
      'Wie verder wil, loopt vooral tegen vragen aan die niet over techniek gaan. Wie is verantwoordelijk? Gaan de mensen mee? Wat levert het op, en wat mag er eigenlijk? Daar stranden de meeste AI-trajecten, niet op de tool.',
      'Deze scan laat zien waar jullie nu staan, over de volle breedte: van leiderschap en mensen tot data, agents en governance. Je ziet wat al stevig staat, waar het schuurt en waar je het best kunt beginnen.',
    ],
    irisNote: 'Ik ontwikkelde deze scan binnen mijn MBA-onderzoek naar mensgerichte AI. Na je uitslag kun je het beeld in een kort gesprek met mij bespreken.', // [CONCEPT]
    start: 'Start de scan',
    resume: 'Verder waar je was',
    restart: 'Opnieuw beginnen',
    irisCaption: 'Iris Ficker Younge · Global Voice Intelligence',
    breadth:
      'Zes pijlers en 22 dimensies, over de volle breedte van de AI-transformatie, met de focus op mensgerichte AI en governance. Dus niet alleen data en techniek, maar ook mensen, waarde en agents.',
    isTitle: 'Wat de scan is',
    is: [
      'Een onderbouwd, transparant profiel van waar jouw organisatie nu staat met AI',
      'Een startpunt voor een gesprek, met je team of met Iris',
      'Een eerste beeld vanuit jouw blik, in ongeveer 10 minuten',
    ],
    isNotTitle: 'Wat de scan niet is',
    isNot: ['Geen audit of certificering', 'Geen oordeel over naleving van de AI-verordening', 'Geen totaalcijfer of ranglijst'],
    pillarsTitle: 'Zes pijlers, 22 dimensies',
    pillarsIntro: 'Van richting en mensen tot data, agents en governance. Elke pijler bestaat uit drie of vier dimensies, en bij elke dimensie hoort één vraag.',
    getTitle: 'Wat je krijgt',
    getNow: {
      title: 'Direct op je scherm',
      items: [
        'Een overzicht van de zes pijlers: in één oogopslag waar het stevig staat en waar het schuurt',
        'Je drie prioriteiten, met voor elk een eerste stap die je deze week kunt zetten',
        'Je profiel op 22 dimensies',
        'De pijler die jij kiest volledig uitgewerkt: per onderdeel wat het betekent, waar je staat en wat je volgende stap is',
        'Rode vlaggen, met uitleg, en signalen uit de AI-verordening',
      ],
    },
    getMail: {
      title: 'Gratis in je mailbox',
      items: [
        'Het volledige rapport als pdf: alle zes pijlers uitgewerkt',
        'De vragen om in een gesprek verder uit te diepen',
        'Al je antwoorden, de scoreregels in gewone taal en de bronnen',
        'Een uitnodiging voor een gesprek van 20 tot 30 minuten met Iris',
      ],
    },
    // [CONCEPT] stappenplan; vervolgdiensten bewust zonder naam of prijs tot het aanbod vastligt.
    stepsTitle: 'Zo werkt het',
    steps: [
      ['Vul de scan in', '22 vragen over wat er nu in de praktijk gebeurt. Ongeveer 10 minuten.'],
      ['Zie direct je uitslag', 'Je overzicht, je drie prioriteiten en je profiel staan meteen op je scherm.'],
      ['Ontvang het volledige rapport', 'Alle pijlers uitgewerkt als pdf, gratis in je mailbox.'],
      ['Bespreek het met Iris', 'In 20 tot 30 minuten toetsen we het beeld en scherpen we je werkvraag aan.'],
      ['Kies je vervolg', 'Bijvoorbeeld een kansenkaart met je beste toepassingen, of een eerste pilot met een meetbaar doel. Alleen als het past.'],
    ],
    compareTitle: 'Wat de scan verandert',
    compareHead: ['', 'Zonder scan', 'Met de scan'],
    compare: [
      ['Beeld', 'Losse indrukken en meningen', 'Eén profiel op zes pijlers en 22 dimensies'],
      ['Breedte', 'Vooral techniek en tools', 'Ook mensen, waarde en agents'],
      ['Prioriteit', 'Beginnen waar het hardst geroepen wordt', 'Drie prioriteiten die volgen uit je eigen antwoorden'],
      ['Regels', 'Onduidelijk wat de AI-verordening voor je betekent', 'Signalen uit de AI-verordening die bij jouw gebruik passen'],
      ['Gesprek', 'Steeds opnieuw bij nul beginnen', 'Een gedeeld startpunt voor je team'],
    ],
    faqTitle: 'Veelgestelde vragen',
    faq: [
      ['Voor wie is de scan?', 'Voor mkb-bedrijven, zzp\'ers, maatschappelijke organisaties en lokale overheden die willen weten waar ze staan met AI. Werk je alleen, dan past de scan zich daarop aan.'],
      ['Wat meet de scan precies?', 'Wat er nu in de praktijk gebeurt, verdeeld over zes pijlers: leiderschap en richting, mensen en cultuur, AI-geletterdheid, werk en waarde, data, technologie en agents, en governance. Niet wat je van plan bent.'],
      ['Wat als we nog weinig met AI doen?', 'Dan is de scan juist nuttig. Een lage score is een startpunt, geen oordeel. Weet je iets niet, dan kies je "Weet ik niet". Dat telt niet mee in je score.'],
      ['Wat kost het?', 'Niets. De scan, je uitslag en het volledige rapport zijn gratis.'],
      ['Waarom krijg ik geen totaalscore?', 'Een gemiddelde over zulke verschillende onderwerpen zou meer precisie suggereren dan er is. Je ziet daarom per pijler en per dimensie waar je staat.'],
      ['Is dit een audit of een check op de AI-verordening?', 'Nee. De scan geeft een onderbouwde oriëntatie en laat zien welke onderdelen van de AI-verordening bij jouw gebruik in beeld komen. Een juridisch oordeel is het niet.'],
      ['Kunnen meerdere collega\'s de scan invullen?', 'Ja, ieder in de eigen browser. Juist de verschillen tussen jullie antwoorden zijn waardevol om samen te bespreken.'],
      ['Waar komt de scan vandaan?', 'De scan is ontwikkeld binnen het MBA-afstudeeronderzoek van Iris aan Tomorrow University en gebouwd op meer dan honderd wetenschappelijke en praktijkbronnen.'],
    ],
    ctaTitle: 'Benieuwd waar jouw organisatie staat?',
    ctaBody: 'In ongeveer 10 minuten heb je een eerste beeld en weet je waar je begint.',
    // [CONCEPT] Privacyblok: definitieve tekst volgt zodra de verwerking bij een rapportaanvraag vastligt.
    privacyTitle: 'Je gegevens',
    privacyBody:
      'Tijdens het invullen worden je antwoorden alleen in je eigen browser bewaard, zodat je later verder kunt. Met "Opnieuw beginnen" wis je ze. Hoe we gegevens verwerken als je het volledige rapport aanvraagt, beschrijven we in de privacyverklaring.',
    privacyLink: 'Lees de privacyverklaring',
  },
  context: {
    title: 'Over jou',
    intro: 'Acht korte vragen. Ze tellen niet mee in je uitslag, maar helpen om de vragen en signalen op jou af te stemmen.',
    optional: 'optioneel',
    workQuestionPlaceholder: 'Bijvoorbeeld: waar begin ik, zonder dat het een losse pilot blijft?', // [CONCEPT]
  },
  priority: {
    title: 'Waar wil je het eerst meer over weten?',
    intro: 'Deze pijler werken we op je uitslagscherm volledig uit. De andere vijf staan in het volledige rapport.',
  },
  pillar: {
    gateLabel: 'Basisvraag',
    gateHelp:
      'Deze vraag gaat over de basis van deze pijler. De andere onderdelen bouwen erop voort.',
    autoNA: {
      solo: 'Niet van toepassing, omdat je zzp/solo werkt.',
      agents: 'Niet van toepassing, omdat je aangaf geen agents te gebruiken.',
    },
    sourcesLabel: 'Bronanker',
    next: 'Volgende pijler',
    toResult: 'Bekijk je uitslag',
    back: 'Terug',
    incomplete: 'Beantwoord eerst alle vragen op dit scherm. "Weet ik niet" is ook een antwoord.',
    helpTitle: 'Zo vul je de vragen in',
  },
  levels: { unknown: 'Weet ik niet', na: 'Niet van toepassing' },
  result: {
    title: 'Je uitslag',
    webTitle: () => 'Je profiel op 22 dimensies',
    webTitleNote: 'De rest is niet van toepassing.',
    webHelp: 'Elk punt is één dimensie, gegroepeerd per pijler. Hoe verder naar buiten, hoe verder je bent. De drie ringen zijn de niveaus 1, 2 en 3. Een vraagteken betekent: nog niet in beeld. Een onderdeel dat voor jou niet van toepassing is, staat in het midden.',
    thermoTitle: 'Je zes pijlers in één oogopslag',
    flagsTitle: 'De basis op orde',
    flagsNone: 'In alle pijlers staat de basis op orde, of is ze niet van toepassing.',
    starLegend: 'de basis vraagt nog aandacht',
    aiActTitle: 'Signalen uit de AI-verordening',
    aiActNote: 'Deze signalen zijn niet gescoord en geen juridisch oordeel.',
    detailTitle: (name) => `Uitgewerkt: ${name}`,
    teaserTitle: 'Wil je dezelfde uitwerking voor de andere vijf pijlers?',
    teaserBody:
      'Ontvang het volledige rapport als pdf: alle zes pijlers per onderdeel uitgewerkt, met je antwoorden, de scoreregels in gewone taal en de bronnen. Met een link om een gesprek met Iris in te plannen.', // [CONCEPT]
    teaserCta: 'Ontvang het volledige rapport',
    howTitle: 'Zo komt je uitslag tot stand',
    edit: 'Antwoorden aanpassen',
  },
  status: {
    green: 'groen',
    orange: 'oranje',
    red: 'rood',
    grey: 'nog niet in beeld',
    disabled: 'niet van toepassing',
  },
  statusLong: {
    green: 'Dit staat',
    orange: 'Op weg',
    red: 'Hier ligt je eerstvolgende winst',
    grey: 'Nog niet in beeld',
  },
  card: {
    meaning: 'Wat dit betekent',
    now: 'Waar je nu staat',
    step: 'Je volgende stap',
    hold: 'Vasthouden',
    begin: 'Zo begin je',
    week: 'Deze week',
    done: 'Het is gelukt als',
    target: 'Je werkt toe naar',
    talk: 'Om verder te bespreken',
    gateNote: 'De basis van deze pijler',
    level: (n) => `Niveau ${n} van 3`,
  },
  // De drie prioriteiten bovenaan de uitslag. [CONCEPT]
  prio: {
    title: 'Waar je begint',
    intro: (n) =>
      n === 1
        ? 'Eén onderdeel vraagt nu je aandacht. De eerste stap kun je deze week al zetten.'
        : `Deze ${n === 2 ? 'twee' : 'drie'} onderdelen vragen als eerste je aandacht. Begin bovenaan: de eerste stap van nummer 1 kun je deze week al zetten.`,
    how: 'Zo is dit samengesteld: eerst de basis die nog niet op orde is, dan het laagste onderdeel in de pijler die jij koos, en daarna je laagste onderdelen in de andere pijlers.',
    reason: {
      flag: 'de basis van deze pijler',
      priorityPillar: 'laagste onderdeel in de pijler die jij koos',
      lowest: 'een van je laagste onderdelen',
    },
    now: 'Je antwoord:',
    none: 'Alles staat op het hoogste niveau of is niet van toepassing. Houd het vast, en vul de scan over een halfjaar opnieuw in.',
  },
  request: {
    title: 'Ontvang het volledige rapport',
    intro: 'Vul je gegevens in. Je krijgt een bevestigingscode per mail, daarna sturen we het rapport als pdf.',
    name: 'Je naam',
    org: 'Organisatie',
    email: 'E-mailadres',
    reportConsent:
      'Ik vraag het rapport aan. GVI gebruikt mijn antwoorden en gegevens alleen om dit rapport te maken en te sturen.',
    newsConsent: 'Ik wil ook af en toe nieuws van GVI ontvangen. (Los van het rapport, je kunt je altijd afmelden.)',
    privacyLink: 'Lees hoe GVI met je gegevens omgaat',
    submit: 'Stuur mij de code',
    codeTitle: 'Vul je bevestigingscode in',
    codeIntro: (email) => `We hebben een code van zes cijfers gestuurd naar ${email}. De code is 15 minuten geldig.`,
    codeLabel: 'Bevestigingscode',
    codeSubmit: 'Bevestig en ontvang het rapport',
    codeWrong: (left) => `Deze code klopt niet. Je kunt het nog ${left} keer proberen.`,
    codeExpired: 'Deze code is verlopen of te vaak fout ingevuld. Vraag een nieuwe code aan.',
    resend: 'Nieuwe code aanvragen',
    doneTitle: 'Je rapport is onderweg',
    doneBody: 'Check je inbox. Zie je niets binnen een paar minuten, kijk dan ook in je spam.',
    openReport: 'Open het rapport (pdf)',
  },
  sim: {
    title: 'Testpaneel · simulatie',
    note: 'Lokale simulatie. Er is niets verstuurd.',
    code: 'Bevestigingscode',
    mail: 'Voorbeeld van de mail',
  },
  footer: {
    privacy: 'Privacy',
    madeBy: 'Global Voice Intelligence · Iris Ficker Younge',
  },
};

// Persoonlijke mail van Iris (jij-vorm). [CONCEPT] — agendalink nog open.
export const MAIL = {
  subject: 'Je volledige AI-readinessrapport',
  body: ({ name, firstStepText, agendaUrl }) => `Hoi ${name || 'daar'},

Fijn dat je de AI-readinessscan hebt ingevuld. In de bijlage vind je je volledige rapport: alle zes pijlers per dimensie, je antwoorden en precies hoe je uitslag tot stand kwam.

Je eerste stap volgens de scan:
${firstStepText}

Het rapport is een eerste beeld vanuit één blik. Het wordt pas echt bruikbaar als we samen kijken wat erachter zit: wat je kunt laten zien, hoe een collega het zou invullen en wat je eigenlijke werkvraag is. Daar is een gesprek van 20 tot 30 minuten voor.

Plan het hier in: ${agendaUrl}

Hartelijke groet,
Iris Ficker Younge
Global Voice Intelligence`,
};

export const AGENDA_URL = 'https://example.invalid/agenda-link-volgt'; // open punt: echte afsprakenlink

// Teksten van de pilotmodus (besloten, voorlopige versie). [CONCEPT] Ter beoordeling door Iris.
export const PILOT_COPY = {
  welcome: {
    eyebrow: 'Voorlopige versie · ongeveer 10 minuten',
    title: 'Hoe klaar is jouw organisatie voor AI?',
    intro:
      'Deze scan brengt in kaart waar jouw organisatie nu staat met AI. Je beantwoordt 22 vragen over wat er in de praktijk gebeurt. Er zijn geen goede of foute antwoorden.',
    points: [
      'Aan het eind dien je de scan in. Je ziet dan direct je uitslag.',
      'Iris Ficker Younge ontvangt je antwoorden, als voorbereiding op jullie gesprek.',
      'Dit is een voorlopige versie. Jouw ervaring helpt om de scan beter te maken.',
    ],
    privacy: 'Je antwoorden staan alleen in je eigen browser, tot je ze indient.',
    start: 'Start de scan',
    resume: 'Ga verder waar je was',
    restart: 'Opnieuw beginnen',
  },
  priorityIntro: 'Je keuze bepaalt mee waar je uitslag je laat beginnen.',
  toSubmit: 'Naar indienen',
  submit: {
    eyebrow: 'Laatste stap',
    title: 'Dien je scan in',
    intro: 'Je hebt alle vragen beantwoord. Dien de scan in, dan zie je direct je uitslag.',
    name: 'Je naam',
    org: 'Organisatie',
    consent:
      'Met indienen stuur je je antwoorden naar Iris Ficker Younge van Global Voice Intelligence. Zij gebruikt ze alleen om jullie gesprek voor te bereiden.',
    how: 'Na het indienen opent je mailprogramma met een bericht aan Iris. Verstuur dat bericht, dan heeft zij je antwoorden.',
    button: 'Indienen',
    busy: 'Bezig met indienen…',
    retry: 'Probeer opnieuw',
    failed: 'Het indienen is niet gelukt. Controleer je internetverbinding en probeer het opnieuw. Je antwoorden zijn bewaard.',
    mailWay: 'Blijft het misgaan?',
    mailWayCta: 'Dien in via je eigen mail',
    back: 'Terug naar de vragen',
    missing: 'Vul je naam in.',
  },
  sent: {
    autoTitle: 'Je scan is ingediend',
    autoBody: 'Iris heeft je antwoorden ontvangen.',
    mailTitle: 'Nog één klik: verstuur de mail aan Iris',
    mailBody: 'Er staat een bericht voor je klaar in je mailprogramma. Verstuur het, dan heeft Iris je antwoorden.',
    mailAgain: 'Open de mail opnieuw',
    copy: 'Kopieer je antwoorden',
    copied: 'Gekopieerd. Plak ze in een mail aan',
    noMail: 'Opent er geen mail? Kopieer dan je antwoorden en mail ze naar',
  },
  result: {
    saveTitle: 'Bewaar je samenvatting',
    saveBody: 'Open de samenvatting en bewaar haar als pdf. Zo heb je haar bij de hand in het gesprek.',
    saveCta: 'Open de samenvatting (pdf)',
    nextTitle: 'Het volledige rapport bespreken we samen',
    nextBody:
      'Het volledige rapport werkt elk onderdeel uit: wat het betekent, waar je nu staat en wat een goede eerste stap is. Iris neemt het met je door in jullie gesprek.',
    changed: 'Je hebt een antwoord aangepast. Dien de scan opnieuw in, dan heeft Iris de laatste versie.',
  },
  report: {
    eyebrow: 'AI-readinessscan · samenvatting · voorlopige versie',
    toolbar: 'Je samenvatting',
    none: 'Dien eerst je scan in. Daarna staat hier je samenvatting.',
    toScan: 'Naar de scan',
  },
};
