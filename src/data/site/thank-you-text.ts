/**
 * Copy for the post-inquiry confirmation page.
 *
 * The page is `noindex, follow` and only reached after a successful
 * submission, so it carries no search value. Graduated languages get a
 * translated confirmation; the remaining locale routes fall back to English
 * (they are already whole-site noindex, see src/config/seo-suppress.json).
 */
export interface ThankYouCopy {
  title: string;
  intro: string;
  nextTitle: string;
  step1: string;
  step2: string;
  step3: string;
  ctaPrimary: string;
  ctaSecondary: string;
  help: string;
}

const EN: ThankYouCopy = {
  title: 'Thank you — your inquiry has been received',
  intro:
    'Our sales team has your details. We review every inquiry and reply within one business day, usually much sooner.',
  nextTitle: 'What happens next',
  step1: 'A sales engineer reviews your requirements and confirms the specifications.',
  step2: 'We reply by email with pricing, MOQ and lead time — or ask a clarifying question.',
  step3: 'If the project fits, we arrange samples, artwork proofs and a formal quotation.',
  ctaPrimary: 'Browse inflatable pools',
  ctaSecondary: 'Back to home',
  help: 'Need to add something? Reply to our email or contact us at',
};

export const THANK_YOU: Record<string, ThankYouCopy> = {
  en: EN,
  de: {
    title: 'Vielen Dank — Ihre Anfrage ist eingegangen',
    intro:
      'Unser Vertriebsteam hat Ihre Angaben erhalten. Wir prüfen jede Anfrage und antworten innerhalb eines Werktags, meist deutlich schneller.',
    nextTitle: 'Wie es weitergeht',
    step1: 'Ein Vertriebsingenieur prüft Ihre Anforderungen und bestätigt die Spezifikationen.',
    step2: 'Wir antworten per E-Mail mit Preis, Mindestbestellmenge und Lieferzeit — oder stellen eine Rückfrage.',
    step3: 'Wenn das Projekt passt, organisieren wir Muster, Designfreigaben und ein formelles Angebot.',
    ctaPrimary: 'Aufblasbare Pools ansehen',
    ctaSecondary: 'Zur Startseite',
    help: 'Möchten Sie etwas ergänzen? Antworten Sie auf unsere E-Mail oder kontaktieren Sie uns unter',
  },
  fr: {
    title: 'Merci — votre demande a bien été reçue',
    intro:
      'Notre équipe commerciale a reçu vos informations. Nous examinons chaque demande et répondons sous un jour ouvré, souvent bien plus rapidement.',
    nextTitle: 'Les prochaines étapes',
    step1: 'Un ingénieur commercial examine vos besoins et confirme les spécifications.',
    step2:
      'Nous répondons par e-mail avec le prix, la quantité minimale et le délai — ou une question de précision.',
    step3: 'Si le projet correspond, nous organisons des échantillons, des BAT et un devis formel.',
    ctaPrimary: 'Voir les piscines gonflables',
    ctaSecondary: "Retour à l'accueil",
    help: "Besoin d'ajouter une information ? Répondez à notre e-mail ou contactez-nous à",
  },
  es: {
    title: 'Gracias — hemos recibido su consulta',
    intro:
      'Nuestro equipo comercial tiene sus datos. Revisamos cada consulta y respondemos en un día hábil, normalmente antes.',
    nextTitle: 'Qué ocurre a continuación',
    step1: 'Un ingeniero comercial revisa sus requisitos y confirma las especificaciones.',
    step2:
      'Respondemos por correo con precio, pedido mínimo y plazo de entrega, o con una pregunta de aclaración.',
    step3: 'Si el proyecto encaja, organizamos muestras, pruebas de arte y una cotización formal.',
    ctaPrimary: 'Ver piscinas inflables',
    ctaSecondary: 'Volver al inicio',
    help: '¿Necesita añadir algo? Responda a nuestro correo o contáctenos en',
  },
  pt: {
    title: 'Obrigado — recebemos a sua consulta',
    intro:
      'A nossa equipa comercial tem os seus dados. Analisamos cada consulta e respondemos no prazo de um dia útil, normalmente antes.',
    nextTitle: 'O que acontece a seguir',
    step1: 'Um engenheiro comercial analisa os seus requisitos e confirma as especificações.',
    step2:
      'Respondemos por e-mail com preço, quantidade mínima e prazo de entrega — ou com uma pergunta de esclarecimento.',
    step3: 'Se o projeto se adequar, organizamos amostras, provas de arte e uma cotação formal.',
    ctaPrimary: 'Ver piscinas insufláveis',
    ctaSecondary: 'Voltar ao início',
    help: 'Precisa de acrescentar algo? Responda ao nosso e-mail ou contacte-nos em',
  },
  it: {
    title: 'Grazie — abbiamo ricevuto la tua richiesta',
    intro:
      'Il nostro team commerciale ha i tuoi dati. Esaminiamo ogni richiesta e rispondiamo entro un giorno lavorativo, di solito prima.',
    nextTitle: 'Cosa succede ora',
    step1: 'Un ingegnere commerciale esamina i requisiti e conferma le specifiche.',
    step2:
      'Rispondiamo via e-mail con prezzo, quantità minima e tempi di consegna — o con una domanda di chiarimento.',
    step3: 'Se il progetto è adatto, organizziamo campioni, bozze grafiche e un preventivo formale.',
    ctaPrimary: 'Scopri le piscine gonfiabili',
    ctaSecondary: 'Torna alla home',
    help: 'Devi aggiungere qualcosa? Rispondi alla nostra e-mail o contattaci a',
  },
  nl: {
    title: 'Bedankt — uw aanvraag is ontvangen',
    intro:
      'Ons salesteam heeft uw gegevens. We beoordelen elke aanvraag en reageren binnen één werkdag, meestal sneller.',
    nextTitle: 'Wat gebeurt er nu',
    step1: 'Een sales engineer bekijkt uw eisen en bevestigt de specificaties.',
    step2:
      'We reageren per e-mail met prijs, minimale afname en levertijd — of met een verduidelijkende vraag.',
    step3: 'Als het project past, regelen we samples, artworkproeven en een formele offerte.',
    ctaPrimary: 'Bekijk opblaasbare zwembaden',
    ctaSecondary: 'Terug naar home',
    help: 'Wilt u iets toevoegen? Antwoord op onze e-mail of neem contact op via',
  },
  sv: {
    title: 'Tack — vi har tagit emot din förfrågan',
    intro:
      'Vårt säljteam har dina uppgifter. Vi granskar varje förfrågan och svarar inom en arbetsdag, oftast snabbare.',
    nextTitle: 'Vad händer nu',
    step1: 'En säljingenjör granskar dina krav och bekräftar specifikationerna.',
    step2: 'Vi svarar via e-post med pris, minsta orderkvantitet och ledtid — eller en förtydligande fråga.',
    step3: 'Om projektet passar ordnar vi prover, artwork-proofs och en formell offert.',
    ctaPrimary: 'Se uppblåsbara pooler',
    ctaSecondary: 'Tillbaka till startsidan',
    help: 'Behöver du lägga till något? Svara på vårt e-postmeddelande eller kontakta oss på',
  },
  no: {
    title: 'Takk — vi har mottatt forespørselen din',
    intro:
      'Salgsteamet vårt har opplysningene dine. Vi gjennomgår hver forespørsel og svarer innen én arbeidsdag, vanligvis raskere.',
    nextTitle: 'Hva skjer videre',
    step1: 'En salgsingeniør gjennomgår kravene dine og bekrefter spesifikasjonene.',
    step2:
      'Vi svarer på e-post med pris, minste bestillingsmengde og ledetid — eller et avklarende spørsmål.',
    step3: 'Hvis prosjektet passer, ordner vi prøver, artwork-godkjenning og et formelt tilbud.',
    ctaPrimary: 'Se oppblåsbare bassenger',
    ctaSecondary: 'Tilbake til forsiden',
    help: 'Trenger du å legge til noe? Svar på e-posten vår eller kontakt oss på',
  },
  da: {
    title: 'Tak — vi har modtaget din forespørgsel',
    intro:
      'Vores salgsteam har dine oplysninger. Vi gennemgår hver forespørgsel og svarer inden for én arbejdsdag, oftest hurtigere.',
    nextTitle: 'Hvad sker der nu',
    step1: 'En salgsingeniør gennemgår dine krav og bekræfter specifikationerne.',
    step2:
      'Vi svarer pr. e-mail med pris, mindste ordremængde og leveringstid — eller et afklarende spørgsmål.',
    step3: 'Hvis projektet passer, arrangerer vi prøver, artwork-godkendelse og et formelt tilbud.',
    ctaPrimary: 'Se oppustelige pools',
    ctaSecondary: 'Tilbage til forsiden',
    help: 'Skal du tilføje noget? Svar på vores e-mail eller kontakt os på',
  },
  fi: {
    title: 'Kiitos — tiedustelusi on vastaanotettu',
    intro:
      'Myyntitiimimme on saanut tietosi. Käymme jokaisen tiedustelun läpi ja vastaamme yhden arkipäivän kuluessa, yleensä nopeammin.',
    nextTitle: 'Mitä seuraavaksi',
    step1: 'Myynti-insinööri tarkistaa vaatimuksesi ja vahvistaa tekniset tiedot.',
    step2:
      'Vastaamme sähköpostilla hinnan, vähimmäistilausmäärän ja toimitusajan — tai esitämme tarkentavan kysymyksen.',
    step3: 'Jos projekti sopii, järjestämme näytteet, painovedokset ja virallisen tarjouksen.',
    ctaPrimary: 'Katso puhallettavat altaat',
    ctaSecondary: 'Takaisin etusivulle',
    help: 'Haluatko lisätä jotain? Vastaa sähköpostiimme tai ota yhteyttä osoitteessa',
  },
  pl: {
    title: 'Dziękujemy — otrzymaliśmy Twoje zapytanie',
    intro:
      'Nasz zespół sprzedaży otrzymał Twoje dane. Analizujemy każde zapytanie i odpowiadamy w ciągu jednego dnia roboczego, zwykle szybciej.',
    nextTitle: 'Co dalej',
    step1: 'Inżynier sprzedaży analizuje wymagania i potwierdza specyfikację.',
    step2:
      'Odpowiadamy e-mailem, podając cenę, minimalne zamówienie i termin realizacji — lub zadając pytanie doprecyzowujące.',
    step3: 'Jeśli projekt pasuje, organizujemy próbki, zatwierdzenie projektów graficznych i formalną ofertę.',
    ctaPrimary: 'Zobacz baseny dmuchane',
    ctaSecondary: 'Powrót do strony głównej',
    help: 'Chcesz coś dodać? Odpowiedz na nasz e-mail lub skontaktuj się z nami pod adresem',
  },
  cs: {
    title: 'Děkujeme — vaše poptávka byla přijata',
    intro:
      'Náš obchodní tým obdržel vaše údaje. Každou poptávku posuzujeme a odpovídáme do jednoho pracovního dne, obvykle dříve.',
    nextTitle: 'Co bude následovat',
    step1: 'Obchodní inženýr posoudí vaše požadavky a potvrdí specifikace.',
    step2: 'Odpovíme e-mailem s cenou, minimálním odběrem a dodací lhůtou — nebo s doplňujícím dotazem.',
    step3: 'Pokud se projekt hodí, zajistíme vzorky, náhledy grafiky a formální nabídku.',
    ctaPrimary: 'Prohlédnout nafukovací bazény',
    ctaSecondary: 'Zpět na úvod',
    help: 'Potřebujete něco doplnit? Odpovězte na náš e-mail nebo nás kontaktujte na',
  },
  el: {
    title: 'Ευχαριστούμε — λάβαμε το αίτημά σας',
    intro:
      'Η ομάδα πωλήσεών μας έχει τα στοιχεία σας. Εξετάζουμε κάθε αίτημα και απαντάμε εντός μίας εργάσιμης ημέρας, συνήθως νωρίτερα.',
    nextTitle: 'Τι ακολουθεί',
    step1: 'Ένας μηχανικός πωλήσεων εξετάζει τις απαιτήσεις σας και επιβεβαιώνει τις προδιαγραφές.',
    step2:
      'Απαντάμε μέσω email με τιμή, ελάχιστη ποσότητα παραγγελίας και χρόνο παράδοσης — ή με διευκρινιστική ερώτηση.',
    step3: 'Εάν το έργο ταιριάζει, οργανώνουμε δείγματα, εγκρίσεις σχεδίων και επίσημη προσφορά.',
    ctaPrimary: 'Δείτε φουσκωτές πισίνες',
    ctaSecondary: 'Επιστροφή στην αρχική',
    help: 'Θέλετε να προσθέσετε κάτι; Απαντήστε στο email μας ή επικοινωνήστε μαζί μας στο',
  },
  ru: {
    title: 'Спасибо — ваш запрос получен',
    intro:
      'Наша команда продаж получила ваши данные. Мы рассматриваем каждый запрос и отвечаем в течение одного рабочего дня, обычно быстрее.',
    nextTitle: 'Что будет дальше',
    step1: 'Инженер по продажам изучит ваши требования и подтвердит спецификацию.',
    step2:
      'Мы ответим по электронной почте с ценой, минимальным заказом и сроком производства — или зададим уточняющий вопрос.',
    step3: 'Если проект подходит, мы организуем образцы, утверждение макетов и официальное коммерческое предложение.',
    ctaPrimary: 'Смотреть надувные бассейны',
    ctaSecondary: 'На главную',
    help: 'Нужно что-то добавить? Ответьте на наше письмо или свяжитесь с нами по адресу',
  },
  ar: {
    title: 'شكرًا — تم استلام استفسارك',
    intro:
      'لدى فريق المبيعات بياناتك. نراجع كل استفسار ونرد خلال يوم عمل واحد، وغالبًا في وقت أقرب.',
    nextTitle: 'ماذا يحدث بعد ذلك',
    step1: 'يراجع مهندس المبيعات متطلباتك ويؤكد المواصفات.',
    step2: 'نرد عبر البريد الإلكتروني بالسعر والحد الأدنى للطلب ومدة التسليم — أو بسؤال توضيحي.',
    step3: 'إذا كان المشروع مناسبًا، نرتب العينات وموافقات التصميم وعرض سعر رسمي.',
    ctaPrimary: 'تصفح المسابح القابلة للنفخ',
    ctaSecondary: 'العودة إلى الرئيسية',
    help: 'هل تحتاج إلى إضافة شيء؟ رد على بريدنا الإلكتروني أو تواصل معنا على',
  },
};

export function getThankYouCopy(lang?: string): ThankYouCopy {
  return (lang && THANK_YOU[lang]) || EN;
}
