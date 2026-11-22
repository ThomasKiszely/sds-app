/**
 * Eksempeldata til Preview-siderne.
 *
 * Intet her kommer fra databasen. Siderne viser, hvordan funktionerne skal se
 * ud, når de bliver bygget. Navne, kunder og beløb er de samme som i designet
 * (sds-design.pen).
 */

const cleaner = {
    name: 'Anna Holm',
    title: 'Rengøringsassistent',
    phone: '30 12 45 67',
    emergencyContact: 'Jonas Holm',
    workHours: 'Man–fre, 06:00–15:00',
    month: { label: 'Oktober', hours: '98,5', km: 112, visits: 44 },
};

const today = {
    title: 'Mandag 2. november',
    summary: '2 besøg · 5,5 timer · 18 min kørsel',
    visits: [
        {
            time: '06:30', duration: '2,5 t', name: 'Hallens Butik', address: 'Torvet 5, 4600 Køge',
            key: 'Nøgle i boks, kode 4471', contact: 'Tina, 30 22 18 64',
            drive: '18 min kørsel, afsted senest 09:40',
            tasks: [
                { room: 'Butiksgulv', what: 'Støvsugning og vask' },
                { room: 'Kasseområde', what: 'Aftørring af disk' },
                { room: 'Personalerum', what: 'Vask, gulv og inventar' },
                { room: 'Toilet', what: 'Sanitet og gulv' },
                { room: 'Lager', what: 'Fejning, kun mandag' },
            ],
            note: 'Husk: Vinduerne tages ikke i dag.',
        },
        {
            time: '10:00', duration: '3 t', name: 'Solbakken Ejendomme', address: 'Solbakken 4, 4600 Køge',
            key: 'Nøgle hos vicevært', contact: 'Ole, 40 11 22 33',
            tasks: [
                { room: 'Opgang A', what: 'Trappevask' },
                { room: 'Opgang B', what: 'Trappevask' },
                { room: 'Vaskeri', what: 'Gulv og maskiner' },
            ],
        },
    ],
};

const week = {
    title: 'Uge 45',
    summary: '9 besøg · 20,5 af 25 timer · Lørdag og søndag fri',
    note: 'Ny: Vinduer hos Nordvej skal også tages tirsdag.',
    days: [
        { name: 'Mandag', date: '2. november', hours: '5,5 t', today: true, jobs: [['Hallens Butik', '06:30 · 2,5 t'], ['Solbakken Ejendomme', '10:00 · 3 t']] },
        { name: 'Tirsdag', date: '3. november', hours: '3,5 t', jobs: [['Nordvej Revision', '07:00 · 2 t'], ['Havnens Tandklinik', '10:30 · 1,5 t']] },
        { name: 'Onsdag', date: '4. november', hours: '2,5 t', jobs: [['Hallens Butik', '06:30 · 2,5 t']] },
        { name: 'Torsdag', date: '5. november', hours: '5 t', jobs: [['Nordvej Revision', '07:00 · 2 t'], ['Solbakken Ejendomme', '10:00 · 3 t']] },
        { name: 'Fredag', date: '6. november', hours: '4,5 t', jobs: [['Hallens Butik', '06:30 · 2,5 t'], ['Nordvej Revision, Køge', '09:30 · 2 t']] },
    ],
};

const timeOff = {
    daysLeft: 14,
    daysTotal: 25,
    yearEnds: 'Ferieåret slutter 31. august 2027',
    requests: [
        { dates: '21.–23. december', what: '3 dage ferie', status: 'Venter', tone: 'warn' },
        { dates: '8.–12. februar', what: '5 dage ferie', status: 'Godkendt', tone: 'ok' },
        { dates: '14. oktober', what: 'Sygedag', status: 'Registreret', tone: 'off' },
    ],
    draft: { from: 'Man 21. dec.', to: 'Ons 23. dec.', message: 'Jul hos familien i Aalborg', impact: '3 dage · 6 besøg skal dækkes', impactText: 'Der er ledige kolleger til alle 6. Det sker automatisk, når din anmodning er godkendt.' },
};

const sick = {
    visits: [
        { time: '06:30', name: 'Hallens Butik', status: 'Line overtager', tone: 'ok' },
        { time: '10:00', name: 'Solbakken Ejendomme', status: 'Planlægger finder afløser', tone: 'warn' },
    ],
};

const finishVisit = {
    customer: 'Hallens Butik',
    summary: 'Tjek ud 09:04 · 2 t 32 min af 2,5 t',
    supplies: [{ name: 'Toiletpapir, ruller', qty: 12 }, { name: 'Håndsæbe, 1 liter', qty: 0 }],
    extra: { text: 'Fjernet tyggegummi ved indgangen, 20 min', sub: 'Kontoret godkender, før det kommer på fakturaen' },
};

const employees = [
    { name: 'Anna Holm', area: 'Roskilde', hours: '06:00–14:00', week: [24, 37], drive: '2:10 t', today: 'På arbejde', tone: 'ok' },
    { name: 'Mikkel Berg', area: 'Køge', hours: '06:00–17:00', week: [22.5, 37], drive: '1:45 t', today: 'På arbejde', tone: 'ok' },
    { name: 'Fatima Al-Sayed', area: 'Roskilde', hours: '07:00–19:00', week: [21, 30], drive: '2:30 t', today: 'Syg', tone: 'warn' },
    { name: 'Jonas Lund', area: 'Roskilde', hours: '07:00–19:00', week: [14, 25], drive: '1:20 t', today: 'På arbejde', tone: 'ok' },
    { name: 'Katarzyna Nowak', area: 'Køge', hours: '06:00–14:00', week: [26, 37], drive: '2:05 t', today: 'På arbejde', tone: 'ok' },
    { name: 'Peter Friis', area: 'Ringsted', hours: '08:00–16:00', week: [9, 20], drive: '0:50 t', today: 'På arbejde', tone: 'ok' },
    { name: 'Sofie Dam', area: 'Køge', hours: '07:00–15:00', week: [0, 30], drive: '0:00 t', today: 'Ferie til 8/11', tone: 'off' },
];

const planning = {
    week: 45,
    range: '2.–8. november',
    title: 'Uge 45 mangler 5 beslutninger',
    summary: '44 af 49 besøg er fordelt automatisk efter ledighed og køretid. Resten står her.',
    decisions: [
        { day: 'Man', date: 2, title: 'Nordvej Revision', sub: '07:00 · 2 t · Fatima er syg', warn: true, who: 'Jonas Lund', why: 'Ledig, kender kunden, 18 min kørsel' },
        { day: 'Tir', date: 3, title: 'Skurvogne, Ringsted', sub: '3 t · Ny opgave', who: 'Mikkel Berg', why: 'Ledig fra 09:00, 24 min fra formiddagsjobbet' },
        { day: 'Ons', date: 4, title: 'Vinduer, Solbakken 4', sub: '2,5 t · Ny opgave', who: 'Peter Friis', why: 'Ledig hele dagen, 24 min hjemmefra' },
        { day: 'Tor', date: 5, title: 'Trapper, Algade 12', sub: '1,5 t · Ny opgave', who: 'Jonas Lund', why: 'Ledig 08:00–12:00, 9 min til næste job' },
        { day: 'Fre', date: 6, title: 'Hovedrengøring, Hallens Butik', sub: '4 t · Ny opgave', who: 'Mikkel Berg', why: 'Samme adresse som formiddagsjobbet, 0 min' },
    ],
    // Timer pr. dag: tal = timer, tekst = fravær
    hours: [
        { name: 'Anna Holm', load: '24 af 37 t', days: [5, 4.5, 5, 4.5, 5] },
        { name: 'Mikkel Berg', load: '22,5 af 37 t', days: [5.5, 2.5, 6.5, 5.5, 2.5] },
        { name: 'Fatima Al-Sayed', load: '21 af 30 t', days: ['Syg', 5, 4.5, 5, 4.5] },
        { name: 'Jonas Lund', load: '14 af 25 t', days: [2.5, 4.5, 2.5, 4.5, null] },
        { name: 'Katarzyna Nowak', load: '26 af 37 t', days: [5.5, 6, 5.5, 3, 6] },
        { name: 'Peter Friis', load: '9 af 20 t', days: [3, 3, null, 3, null] },
        { name: 'Sofie Dam', load: '0 af 30 t', days: ['Ferie', 'Ferie', 'Ferie', 'Ferie', 'Ferie'] },
    ],
    unplanned: [
        ['Skurvogne, Ringsted', 'Tir · 3 t'],
        ['Vinduer, Solbakken 4', 'Ons · 2,5 t'],
        ['Trapper, Algade 12', 'Tor · 1,5 t'],
        ['Hovedrengøring, Hallens Butik', 'Fre · 4 t'],
    ],
    boardDays: [['Man 2/11', '23,5 t'], ['Tir 3/11', '25,5 t'], ['Ons 4/11', '24 t'], ['Tor 5/11', '25,5 t'], ['Fre 6/11', '18 t']],
    board: [
        { name: 'Anna Holm', meta: '24/37 t · kørsel 2:10', days: [
            [['Roskilde Tech', '06:00 · 2 t'], ['Lindholm Stål', '09:00 · 3 t']],
            [['Roskilde Tech', '06:00 · 2 t'], ['Bryggergården', '09:00 · 2,5 t']],
            [['Roskilde Tech', '06:00 · 2 t'], ['Lindholm Stål', '09:00 · 3 t']],
            [['Roskilde Tech', '06:00 · 2 t'], ['Bryggergården', '09:00 · 2,5 t']],
            [['Roskilde Tech', '06:00 · 2 t'], ['Lindholm Stål', '09:00 · 3 t']],
        ] },
        { name: 'Mikkel Berg', meta: '22,5/37 t · kørsel 1:45', days: [
            [['Hallens Butik', '06:30 · 2,5 t'], ['Solbakken Ejendomme', '10:00 · 3 t']],
            [['Hallens Butik', '06:30 · 2,5 t'], { suggest: '09:00 · 24 min kørsel' }],
            [['Hallens Butik', '06:30 · 2,5 t'], ['Lindholm Stål', '10:00 · 4 t']],
            [['Hallens Butik', '06:30 · 2,5 t'], ['Solbakken Ejendomme', '10:00 · 3 t']],
            [['Hallens Butik', '06:30 · 2,5 t']],
        ], highlight: 1 },
        { name: 'Fatima Al-Sayed', meta: '21/30 t · kørsel 2:30', days: [
            [{ warn: ['Nordvej Revision', '07:00 · Syg, skal dækkes'] }],
            [['Nordvej Revision', '07:00 · 2 t'], ['Køge Tandklinik', '10:00 · 3 t']],
            [['Nordvej Revision', '07:00 · 2 t'], ['Børnehuset Mælkebøtten', '16:00 · 2,5 t']],
            [['Nordvej Revision', '07:00 · 2 t'], ['Køge Tandklinik', '10:00 · 3 t']],
            [['Nordvej Revision', '07:00 · 2 t'], ['Børnehuset Mælkebøtten', '16:00 · 2,5 t']],
        ] },
        { name: 'Jonas Lund', meta: '14/25 t · kørsel 1:20', days: [
            [['Byens Apotek', '16:30 · 2,5 t']],
            [['Fjordhus A/S', '12:00 · 2 t'], ['Byens Apotek', '16:30 · 2,5 t']],
            [['Byens Apotek', '16:30 · 2,5 t']],
            [['Fjordhus A/S', '12:00 · 2 t'], ['Byens Apotek', '16:30 · 2,5 t']],
            [],
        ] },
        { name: 'Katarzyna Nowak', meta: '26/37 t · kørsel 2:05', days: [
            [['Fjord Skole', '06:00 · 3 t'], ['Køge Tandklinik', '10:00 · 2,5 t']],
            [['Fjord Skole', '06:00 · 3 t'], ['Fjordhus A/S', '10:00 · 3 t']],
            [['Fjord Skole', '06:00 · 3 t'], ['Køge Tandklinik', '10:00 · 2,5 t']],
            [['Fjord Skole', '06:00 · 3 t']],
            [['Fjord Skole', '06:00 · 3 t'], ['Fjordhus A/S', '10:00 · 3 t']],
        ] },
        { name: 'Peter Friis', meta: '9/20 t · kørsel 0:50', days: [
            [['Bryggergården', '08:00 · 3 t']],
            [['Bryggergården', '08:00 · 3 t'], { suggest: '11:00 · 31 min kørsel' }],
            [],
            [['Bryggergården', '08:00 · 3 t']],
            [],
        ], highlight: 1 },
        { name: 'Sofie Dam', meta: '0/30 t · kørsel 0:00', off: 'Ferie hele ugen' },
    ],
};

const invoices = {
    month: 'oktober',
    summary: '4 er klar. 1 mangler en godkendelse, før den kan sendes.',
    tabs: [['Til afsendelse', 5], ['Sendt', 38], ['Forfaldne', 2], ['Betalt', 214]],
    rows: [
        { customer: 'Nordvej Revision', sub: '2 bygninger, samlet faktura', content: 'Fast pris + 3 ekstra linjer', via: 'PDF på mail', amount: '15.627,88 kr.', status: 'Klar', tone: 'ok' },
        { customer: 'Køge Kommune', sub: 'Solgården', content: 'Fast pris', via: 'EAN 5798 000 123456', amount: '11.740,00 kr.', status: 'Klar', tone: 'ok' },
        { customer: 'Solbakken Ejendomme', sub: 'Solbakken 4', content: 'Fast pris + 1 ekstra linje', via: 'PDF på mail', amount: '8.412,00 kr.', status: 'Klar', tone: 'ok' },
        { customer: 'Havnens Tandklinik', sub: 'Havnegade 3', content: 'Fast pris', via: 'PDF på mail', amount: '3.136,50 kr.', status: 'Klar', tone: 'ok' },
        { customer: 'Hallens Butik', sub: 'Torvet 5', content: 'Fast pris + 20 min ekstra arbejde', via: 'PDF på mail', amount: '4.280,00 kr.', status: 'Ekstra venter på godkendelse', tone: 'warn' },
    ],
    total: '43.196,38 kr.',
};

const invoice = {
    customer: 'Nordvej Revision',
    number: '10482',
    customerNumber: '10024817',
    date: '2. november 2026',
    period: 'Oktober 2026',
    address: ['Erhvervsvej 12', '4000 Roskilde'],
    cvr: '37 21 80 44',
    att: 'Lise Pedersen',
    email: 'faktura@nordvej-revision.dk',
    buildings: [
        { name: 'Hovedkontor', address: 'Erhvervsvej 12, 4000 Roskilde', lines: [
            { text: 'Rengøring, oktober', kind: 'Fast pris', qty: '1 md.', price: '10.270,00', amount: '10.270,00' },
            { text: 'Gruppe-rabat 8 %', amount: '-821,60' },
            { text: 'Drift- og miljøtillæg 2 %', amount: '188,97' },
            { text: 'Vinduespolering, udvendig', tag: 'Ad hoc', qty: '1', price: '1.240,00', amount: '1.240,00' },
        ] },
        { name: 'Lager, Køge', address: 'Industrivej 8, 4600 Køge', lines: [
            { text: 'Rengøring, oktober', kind: 'Fast pris', qty: '1 md.', price: '4.180,00', amount: '4.180,00' },
            { text: 'Gruppe-rabat 8 %', amount: '-334,40' },
            { text: 'Drift- og miljøtillæg 2 %', amount: '76,91' },
            { text: 'Toiletpapir', tag: 'Fra besøg', qty: '12', price: '38,00', amount: '456,00' },
            { text: 'Håndsæbe, 1 liter', tag: 'Fra besøg', qty: '6', price: '62,00', amount: '372,00' },
        ] },
    ],
    exVat: '15.627,88',
    vat: '3.906,97',
    total: '19.534,85',
    payment: 'Netto 14 dage',
    due: '16. november 2026',
};

const customerGroup = {
    name: 'Nordvej Revision',
    meta: 'Kundegruppe · Kundenr. 10024817 · CVR 37 21 80 44 · Lise Pedersen, 46 35 12 80',
    stats: [['Pris pr. måned', '23.169 kr.'], ['Aktive bygninger', '2 af 4'], ['Timer pr. uge', '13,2 t'], ['Betaling', 'Netto 14 dage']],
    buildings: [
        { name: 'Hovedkontor', address: 'Erhvervsvej 12, 4000 Roskilde', status: 'Aktiv', tone: 'ok', base: '10.270 kr.', monthly: '9.637 kr.', next: 'Se plan', link: true, without: '9.951,63 kr.', withDiscount: '9.637,37 kr.', diff: '-314,26 kr.', effect: 'Ny pris næste måned, kunden får brev' },
        { name: 'Lager, Køge', address: 'Industrivej 8, 4600 Køge', status: 'Aktiv', tone: 'ok', base: '4.180 kr.', monthly: '3.923 kr.', next: 'Se plan', link: true, without: '4.263,60 kr.', withDiscount: '3.922,51 kr.', diff: '-341,09 kr.', effect: 'Ny pris næste måned, kunden får brev' },
        { name: 'Afdeling Næstved', address: 'Axeltorv 3, 4700 Næstved', status: 'Tilbud sendt', tone: 'warn', base: '6.340 kr.', monthly: '5.949 kr.', next: 'Rykker om 2 dage', without: '6.466,80 kr.', withDiscount: '5.949,46 kr.', diff: '-517,34 kr.', effect: 'Tilbuddet sendes igen', schedule: 'Man, ons, fre · 7 lokaler', offerPrice: '5.949,46 kr.', offerWithout: '6.466,80 kr.' },
        { name: 'Afdeling Ringsted', address: 'Nørregade 19, 4100 Ringsted', status: 'Tilbud sendt', tone: 'warn', base: '3.900 kr.', monthly: '3.660 kr.', next: 'Rykker om 5 dage', without: '3.978,00 kr.', withDiscount: '3.659,76 kr.', diff: '-318,24 kr.', effect: 'Tilbuddet sendes igen', schedule: 'Tir, tor · 4 lokaler', offerPrice: '3.659,76 kr.', offerWithout: '3.978,00 kr.' },
    ],
    discount: { rate: 8, saving: '1.491 kr.' },
    rates: [
        { rate: 0, monthly: '24.660 kr./md.', diff: 'Ingen rabat' },
        { rate: 5, monthly: '23.925 kr./md.', diff: '-735 kr.' },
        { rate: 8, monthly: '23.169 kr./md.', diff: '-1.491 kr.', current: true },
        { rate: 10, monthly: '22.665 kr./md.', diff: '-1.995 kr.' },
    ],
    totals: { without: '24.660,03 kr.', withDiscount: '23.169,10 kr.', diff: '-1.490,93 kr.', yearly: '-17.891 kr. om året' },
    offer: {
        sent: '28. oktober', validTo: '27. november', total: '9.609,22 kr.', payment: 'Netto 14 dage', notice: '3 måneder',
        sentTo: 'lp@nordvej-revision.dk', sentAt: '28. okt. kl. 10.14', link: 'sds-drift.dk/offers/6721.../accept',
    },
};

const company = {
    name: 'Service Division Sjælland',
    address: 'Maglemølle 25, 4700 Næstved',
    phone: '72 41 10 01',
};

module.exports = {
    cleaner,
    today,
    week,
    timeOff,
    sick,
    finishVisit,
    employees,
    planning,
    invoices,
    invoice,
    customerGroup,
    company,
};
