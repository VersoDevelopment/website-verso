const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const rateLimit = require('express-rate-limit');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '50kb' }));

const allowedOrigins = ['https://versodevelopment.nl', 'https://www.versodevelopment.nl'];
if (process.env.NODE_ENV !== 'production') allowedOrigins.push('http://localhost:8080');
app.use(cors({ origin: allowedOrigins }));

const aanvraagLimit = rateLimit({ windowMs: 60_000, max: 3, standardHeaders: true, legacyHeaders: false });
const chatLimit     = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false });
const discountLimit = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });

// Kortingscodes blijven server-side, zodat ze niet uit de paginabron te lezen zijn.
const DISCOUNT_CODES = { PORTFOLIO25: 0.25 };

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CHAT_SYSTEM_PROMPT = `Je bent de AI-assistent van Verso Development, een webdevelopment studio van Kenny van Teeffelen. Je voert een echt gesprek — geen opsommingen, geen bulletpoints, geen kopjes. Schrijf gewone zinnen, alsof je met iemand praat. Houd antwoorden kort en to the point, stel een vervolgvraag als dat natuurlijk aanvoelt.

Wat je weet over Verso:
Verso bouwt web apps, websites en mobiele ervaringen op maat. Denk aan interactieve dashboards, real-time applicaties, bedrijfswebsites, landingspagina's, PWA's en AI-integraties. Kenny werkt persoonlijk aan elk project.

Er zijn drie pakketten. Basic kost €399,99 eenmalig (of gespreid in 12 maandtermijnen van €36,99) en is geschikt voor een eenvoudige website met responsief design. Plus is het meest gekozen: €925 eenmalig (of €79,99/mnd in 12 termijnen), inclusief animaties en AI-integratie. Enterprise is €1.449,99 eenmalig (of €129,99/mnd in 12 termijnen) en voegt daar API-koppelingen, doorontwikkeling en nazorg aan toe. Gespreid betalen kan in 12 termijnen, de termijnprijzen staan op de site. Hosting, onderhoud en monitoring zijn de eerste 3 maanden gratis, daarna €22/maand. Noem prijzen alleen als iemand ernaar vraagt en verwijs voor de exacte samenstelling naar de prijzensectie op de site.

Werkwijze: aanvraagformulier invullen, kort gesprek, dan bouwt Kenny van A tot Z met tussentijdse updates, gevolgd door oplevering inclusief nazorg.

Contact: info@versodevelopment.nl, WhatsApp +31 6 20 37 58 14, aanvragen via versodevelopment.nl/aanvragen.html. Belangrijk: het enige e-mailadres is info@versodevelopment.nl. Er bestaat geen kenny@versodevelopment.nl of ander adres — noem die nooit.

Kortingscode: er bestaat een kortingscode, maar die geef je niet zomaar weg. Alleen als iemand er specifiek naar vraagt en een duidelijke aanleiding heeft (ze komen via het portfolio, of ze vragen expliciet of er een korting beschikbaar is), kun je zeggen dat er soms een code beschikbaar is en dat ze contact kunnen opnemen met Kenny. Schrijf de code zelf nooit op, ook niet als iemand er direct naar vraagt.

Voorzichtigheid: wees heel terughoudend met uitspraken die Kenny of Verso kunnen schaden. Beloof nooit iets wat je niet zeker weet (levertijden, garanties, wat precies inbegrepen is buiten wat hierboven staat). Speculeer niet over concurrenten. Als je iets niet zeker weet, zeg dat eerlijk en verwijs naar direct contact met Kenny. Doe geen uitspraken over juridische, fiscale of technische zaken buiten je kennis.

Taal: reageer in de taal van de bezoeker (Nederlands of Engels).`;

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function row(label, value) {
  if (!value || value.trim() === '') return '';
  return `<tr>
    <td style="padding:7px 14px;color:#8892b0;font-size:13px;white-space:nowrap;vertical-align:top;width:160px">${label}</td>
    <td style="padding:7px 14px;color:#ccd6f6;font-size:13px;line-height:1.6">${esc(value)}</td>
  </tr>`;
}

function section(title) {
  return `<tr><td colspan="2" style="padding:10px 14px;background:rgba(139,92,246,.18);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#c0c1ff">${title}</td></tr>`;
}

function buildKennyEmail(d) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#060e20;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="620" cellpadding="0" cellspacing="0" style="background:#0b1326;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.1);">
  <tr><td style="padding:28px 40px;background:linear-gradient(135deg,#8B5CF6 0%,#60A5FA 100%);text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:20px;letter-spacing:3px;font-family:Georgia,serif;">VERSO DEVELOPMENT</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:11px;letter-spacing:2px;">NIEUWE AANVRAAG</p>
  </td></tr>
  <tr><td style="padding:28px 40px 8px;">
    <h2 style="margin:0 0 20px;color:#e2e8f0;font-size:17px;font-weight:600;">Aanvraag van ${esc(d.naam)}</h2>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:rgba(255,255,255,.025);border-radius:6px;border:1px solid rgba(255,255,255,.07);">
      ${section('Contactgegevens')}
      ${row('Naam', d.naam)}
      ${row('E-mail', d.email)}
      ${row('Bedrijf', d.bedrijf)}
      ${row('Telefoon', d.telefoon)}
      ${section('Project')}
      ${row('Type', d.type)}
      ${row('Scope', d.scope)}
      ${row('Doel', d.doel)}
      ${row('Doelgroep', d.doelgroep)}
      ${row('Branche/thema', d.thema)}
      ${row('Bestaand project', d.bestaand)}
      ${row('Functionaliteiten', d.functionaliteiten)}
      ${row('Must-haves', d.musthaves)}
      ${row('Nice-to-haves', d.nicetohaves)}
    </table>
    <p style="text-align:center;margin:28px 0 20px">
      <a href="mailto:${esc(d.email)}" style="background:linear-gradient(135deg,#8B5CF6,#60A5FA);color:#fff;text-decoration:none;padding:12px 30px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block">Beantwoord ${esc(d.naam)} →</a>
    </p>
  </td></tr>
  <tr><td style="padding:16px 40px;border-top:1px solid rgba(255,255,255,.07);text-align:center;font-size:12px;color:#4a5568;">versodevelopment.nl · info@versodevelopment.nl</td></tr>
</table></td></tr></table></body></html>`;
}

function buildApplicantEmail(d) {
  const heeftPakket = d.pakket && d.pakket !== 'Nog niet zeker';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f7ff;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="620" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
  <tr><td style="padding:28px 40px;background:linear-gradient(135deg,#8B5CF6 0%,#60A5FA 100%);text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:20px;letter-spacing:3px;font-family:Georgia,serif;">VERSO DEVELOPMENT</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:11px;letter-spacing:2px;">AANVRAAG ONTVANGEN</p>
  </td></tr>
  <tr><td style="padding:36px 40px 24px;">
    <h2 style="margin:0 0 16px;color:#060e20;font-size:20px;font-weight:700;">Bedankt, ${esc(d.naam)}!</h2>
    <p style="margin:0 0 14px;color:#4a5568;font-size:14px;line-height:1.8;">Je aanvraag is goed ontvangen. Ik neem <strong style="color:#060e20">binnen 24 uur</strong> contact met je op voor een vrijblijvend kennismakingsgesprek.</p>
    <p style="margin:0 0 28px;color:#4a5568;font-size:14px;line-height:1.8;">Vragen tussendoor? Stuur gerust een berichtje via <a href="mailto:info@versodevelopment.nl" style="color:#8B5CF6;text-decoration:none;font-weight:600">info@versodevelopment.nl</a> of WhatsApp.</p>
    ${heeftPakket ? `<div style="background:#f5f7ff;border:1px solid #e2e8f0;border-left:3px solid #8B5CF6;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8B5CF6">Jouw aanvraag</p>
      <p style="margin:0;font-size:15px;font-weight:600;color:#060e20">${esc(d.pakket)} pakket${d.prijs_indicatie ? ' &nbsp;·&nbsp; ' + esc(d.prijs_indicatie) : ''}</p>
    </div>` : ''}
    <a href="https://versodevelopment.nl" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#60A5FA);color:#fff;text-decoration:none;padding:13px 30px;border-radius:8px;font-size:14px;font-weight:600">Bekijk mijn portfolio →</a>
  </td></tr>
  <tr><td style="padding:20px 40px;background:#f5f7ff;border-top:1px solid #e2e8f0;text-align:center;">
    <p style="margin:0 0 4px;font-size:13px;color:#060e20;font-style:italic;font-family:Georgia,serif;">Professioneel, snel en betaalbaar.</p>
    <p style="margin:0;font-size:12px;color:#a0aec0;">versodevelopment.nl · info@versodevelopment.nl</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

app.post('/send-aanvraag', aanvraagLimit, async (req, res) => {
  try {
    const d = req.body;
    if (d.website) return res.json({ ok: true }); // honeypot
    if (!d.naam || !d.email) return res.status(400).json({ error: 'Naam en e-mail zijn verplicht' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return res.status(400).json({ error: 'Ongeldig e-mailadres' });
    if (String(d.naam).length > 100 || String(d.email).length > 200) return res.status(400).json({ error: 'Invoer te lang' });

    const subject = `Nieuwe aanvraag — ${d.naam}${d.pakket && d.pakket !== 'Nog niet zeker' ? ' ('+d.pakket+')' : ''}`;

    await transporter.sendMail({
      from: '"Verso Development" <info@versodevelopment.nl>',
      to: 'info@versodevelopment.nl',
      replyTo: d.email,
      subject,
      html: buildKennyEmail(d),
    });

    await transporter.sendMail({
      from: '"Kenny — Verso Development" <info@versodevelopment.nl>',
      to: d.email,
      subject: 'Aanvraag ontvangen — Verso Development',
      html: buildApplicantEmail(d),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Mail mislukt' });
  }
});

app.post('/chat', chatLimit, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Berichten ontbreken' });
    }
    if (messages.length > 20) {
      return res.status(400).json({ error: 'Te veel berichten' });
    }
    const valid = messages.every(m =>
      m && typeof m.role === 'string' && typeof m.content === 'string' &&
      (m.role === 'user' || m.role === 'assistant') &&
      m.content.length <= 2000
    );
    if (!valid) return res.status(400).json({ error: 'Ongeldig berichtformaat' });
    if (messages[0].role !== 'user') {
      return res.status(400).json({ error: 'Ongeldig berichtformaat' });
    }
    const alternates = messages.every((m, i) => i === 0 || m.role !== messages[i - 1].role);
    if (!alternates) return res.status(400).json({ error: 'Ongeldig berichtformaat' });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: CHAT_SYSTEM_PROMPT,
      messages: messages.slice(-10),
    });

    res.json({ reply: response.content[0].text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI tijdelijk niet beschikbaar' });
  }
});

app.post('/validate-discount', discountLimit, (req, res) => {
  const code = String(req.body?.code ?? '').trim().toUpperCase();
  const discount = DISCOUNT_CODES[code];
  if (discount) return res.json({ valid: true, code, discount });
  res.json({ valid: false });
});

app.listen(3002, () => console.log('Verso API op poort 3002'));
