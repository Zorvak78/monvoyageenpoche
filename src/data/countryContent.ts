/**
 * Contenu éditorial par pays — utilisé par les pages SEO /pays/[country].
 * Séparé des données pratiques (countriesData) qui restent dans affiliates.ts.
 */

export interface CountryContent {
  slug: string;
  name: string;
  tagline: string;
  shortDescription: string; // ~ 160 caractères (méta description)
  longDescription: string;  // ~ 400-500 mots (article SEO body)
  heroImage: string;
  bestPeriod: string;
  budgetRange: string;
  visaInfo: string;
  language: string;
  currency: string;
  timeZone: string;
}

export const countryContent: Record<string, CountryContent> = {
  namibie: {
    slug: 'namibie',
    name: 'Namibie',
    tagline: 'Dunes rouges, savane et océan sauvage',
    shortDescription:
      "Découvre la Namibie : 14 lieux emblématiques (Sossusvlei, Etosha, Skeleton Coast), 3 itinéraires testés, conseils transport et budget. Construis ton voyage en autonomie.",
    longDescription: `La Namibie est un pays d'Afrique australe deux fois plus grand que la France pour seulement 2,5 millions d'habitants. C'est l'une des destinations les plus dépaysantes au monde, taillée pour le road trip et les amoureux des grands espaces.

Le voyage classique forme une boucle d'environ deux semaines au départ de Windhoek, la capitale. On rejoint d'abord le désert du Namib avec Sossusvlei et ses dunes rouges culminant à 380 mètres, puis Deadvlei et son cimetière d'arbres millénaires. La côte atlantique offre Swakopmund pour le sandboarding, Sandwich Harbour pour les dunes plongeant dans l'océan et la Skeleton Coast pour ses épaves. Plus au nord, le Damaraland abrite les rares éléphants du désert et les rhinocéros noirs. Le parc national d'Etosha couronne le voyage : safari aux points d'eau éclairés où convergent éléphants, lions et girafes.

**Quand y aller** ? La meilleure période s'étend d'**avril à octobre**, pendant la saison sèche : les journées sont claires, les nuits fraîches, et la faune se concentre aux points d'eau. Juillet et août sont les mois les plus prisés (mais aussi les plus chers et les plus fréquentés). Évite la saison des pluies (novembre à mars) qui rend certaines pistes impraticables.

**Comment s'y rendre** ? Il n'existe pas de vol direct depuis la France. Compte 12 à 18 heures via Francfort, Doha ou Addis-Abeba selon les compagnies. Réserve idéalement 2 à 3 mois à l'avance pour les meilleurs tarifs (compter 900 à 1200 € aller-retour). Aucun visa n'est requis pour un séjour de moins de 90 jours avec un passeport français.

**Comment circuler** ? Le **4x4 est indispensable**. Les distances sont énormes (souvent 300 à 500 km entre étapes), les routes goudronnées rares, les pistes en tôle ondulée fréquentes. Privilégie un Toyota Hilux ou équivalent avec deux roues de secours et un jerrycan de carburant. La tente de toit est une option appréciée pour les nuits en pleine nature. Permis international requis, conduite à gauche.

**Budget** : compter environ **2500 à 3500 € par personne** pour 14 jours, vol inclus. Les lodges sont chers (100 à 200 € la nuit) mais leur emplacement justifie le tarif. Les campings sont une alternative à 30-50 €.

**À savoir avant de partir** : altitudes importantes par endroits, prévoir lunettes de soleil et crème solaire à très haut indice, trousse à pharmacie complète, vêtements chauds pour les nuits (les écarts thermiques sont énormes en hiver austral).`,
    heroImage: '/images/inspiration/sossusvlei.jpg',
    bestPeriod: 'Avril à octobre (saison sèche)',
    budgetRange: '2500 – 3500 € / personne / 14 jours',
    visaInfo: 'Pas de visa requis pour les Français (< 90 jours)',
    language: 'Anglais (officiel), allemand, afrikaans',
    currency: 'Dollar namibien (NAD), parité avec le rand',
    timeZone: 'UTC+2 (été, comme la France en hiver)',
  },

  italie: {
    slug: 'italie',
    name: 'Italie',
    tagline: "Art de vivre, gastronomie et 3000 ans d'histoire",
    shortDescription:
      "Visite l'Italie : 55 lieux dans 19 régions, 3 itinéraires (classique, Toscane, côte amalfitaine), conseils transport et budget. Construis ton voyage idéal.",
    longDescription: `L'Italie est l'une des destinations les plus visitées au monde, et pour cause : aucun autre pays ne concentre autant de patrimoine UNESCO, de variations culturelles et culinaires sur un territoire aussi accessible. Du nord alpin au sud méditerranéen, chaque région est presque un pays en soi.

Trois grands axes de voyage se dessinent. Le **trio classique** Rome, Florence, Venise reste le meilleur point d'entrée : trois capitales de l'art reliées par train rapide en 1h30 chacune. Côté **Toscane**, Florence sert de base pour explorer Sienne, Pise et les villages perchés (San Gimignano, Volterra). Pour la **Méditerranée**, la Campanie (Naples, Pompéi, côte amalfitaine, Capri) puis la Sicile (Palerme, Etna, Syracuse) offrent des couleurs, une cuisine et une énergie incomparables. Les Pouilles, la Sardaigne, les Cinque Terre méritent aussi le détour.

**Quand y aller** ? Les périodes idéales sont **mai-juin** et **septembre-octobre** : températures agréables, foule modérée, lumière magnifique. Évite août : tout est bondé, cher, et la chaleur est étouffante au sud. L'hiver convient pour Rome et le nord culturel, mais la côte amalfitaine se vit en été.

**Comment s'y rendre** ? Vols directs quotidiens depuis Paris vers Rome (Fiumicino), Milan (Malpensa), Venise, Naples, Florence, Catane et Palerme. Compter **80 à 250 €** aller-retour selon la saison et la compagnie (Vueling, Ryanair, Air France, ITA). Aucun visa requis (espace Schengen).

**Comment circuler** ? Le **train est ultra-efficace** : le Frecciarossa relie Rome à Milan en 2h50, Rome à Florence en 1h30, Florence à Venise en 2h. Privilégie le train pour les grandes villes. La voiture devient utile en Toscane, dans les Pouilles ou en Sicile pour rayonner dans la campagne. À Rome, Venise, Florence : voiture inutile, oublie-la.

**Budget** : pour un voyage de **10 jours**, compter **1200 à 2500 € par personne** vol inclus. Les hôtels 3 étoiles dans les centres historiques tournent autour de 100-150 € la nuit, les Airbnb sont une bonne alternative en région. Les repas restent abordables : trattoria à 25-40 €, vrai expresso à 1,50 € au comptoir.

**À savoir** : réserve les billets pour le Colisée et les Offices à l'avance pour éviter les files d'attente. Les transports publics sont souvent en grève — vérifie avant un déplacement crucial. Apprends quelques mots d'italien, c'est très apprécié.`,
    heroImage: '/images/placeholder.svg',
    bestPeriod: 'Mai-juin et septembre-octobre',
    budgetRange: '1200 – 2500 € / personne / 10 jours',
    visaInfo: 'Pas de visa (espace Schengen)',
    language: 'Italien',
    currency: 'Euro (€)',
    timeZone: 'UTC+1 (même que la France)',
  },

  japon: {
    slug: 'japon',
    name: 'Japon',
    tagline: 'Tradition millénaire et modernité ultime',
    shortDescription:
      "Voyage au Japon : 58 lieux à travers 12 régions, 3 itinéraires (essentiel, tradition, Kyūshū), conseils transport et JR Pass. Planifie ton voyage en autonomie.",
    longDescription: `Le Japon offre l'une des expériences de voyage les plus contrastées au monde. La mégapole tokyoïte côtoie les temples millénaires de Kyoto, les onsen volcaniques de Beppu, les villages classés UNESCO de Shirakawa-go et les plages tropicales d'Okinawa. Aucun pays ne combine aussi bien tradition impériale et hyper-modernité.

Trois itinéraires types se dessinent. Le **Japon essentiel** (12-14 jours) couvre Tokyo, Hakone face au Mont Fuji, Kyoto, Nara et Osaka : le condensé incontournable pour un premier voyage. La **tradition et nature** (14 jours) ajoute Nikkō, les Alpes japonaises (Takayama, Shirakawa-go, Kanazawa). Le **Japon hors sentiers** explore Kyūshū au sud avec ses volcans actifs (Mont Aso, Sakurajima), Hokkaidō au nord pour ses paysages sauvages et son ski, ou Okinawa pour les plages.

**Quand y aller** ? Deux saisons sont mythiques : **mars-mai** pour les cerisiers en fleurs (sakura), surtout fin mars à Tokyo et début avril à Kyoto. **Octobre-novembre** pour le momiji, les érables rouges, et la météo douce. Évite juin (saison des pluies) et le pic de juillet-août (chaleur extrême et humidité).

**Comment s'y rendre** ? Plusieurs vols directs Paris-Tokyo quotidiens (Air France, ANA, JAL), entre 12 et 14 heures. L'aéroport d'**Haneda** est plus proche du centre que **Narita**. Compter **700 à 1100 €** aller-retour selon la saison. Aucun visa requis pour les Français (< 90 jours).

**Comment circuler** ? Le **Shinkansen** (TGV japonais) est l'épine dorsale du voyage. Le **JR Pass** (achat obligatoire avant le départ pour le tarif touriste) est rentable dès 4-5 longs trajets : 7 jours = 250 €, 14 jours = 400 €. Pour Tokyo, Kyoto, Osaka : métros et trains locaux suffisent (cartes Suica/Pasmo rechargeables). La voiture n'a d'intérêt que pour Hokkaidō rural, Kyūshū ou Shikoku.

**Budget** : voyage de **14 jours** : compter **2500 à 4000 € par personne** vol inclus. Les hôtels business standards tournent autour de 80-150 € la nuit, les ryokan traditionnels avec onsen 200-400 €. La cuisine est étonnamment abordable : repas type 800-2000 yens (5-15 €), même dans les bonnes adresses.

**À savoir** : prévois du cash (beaucoup d'endroits n'acceptent pas la CB hors grandes villes). Loue un poket-WiFi ou prends une eSIM. Respecte les codes : silence dans le métro, pas de pourboire, chaussures à enlever dans les ryokan. Les Japonais sont d'une serviabilité légendaire — n'hésite pas à demander.`,
    heroImage: '/images/placeholder.svg',
    bestPeriod: 'Mars-mai (cerisiers) et octobre-novembre',
    budgetRange: '2500 – 4000 € / personne / 14 jours',
    visaInfo: 'Pas de visa pour les Français (< 90 jours)',
    language: 'Japonais',
    currency: 'Yen (¥)',
    timeZone: 'UTC+9 (+7h par rapport à la France en été)',
  },

  perou: {
    slug: 'perou',
    name: 'Pérou',
    tagline: 'Civilisation Inca, Amazonie et désert pacifique',
    shortDescription:
      "Pars au Pérou : 15 lieux (Cusco, Machu Picchu, Titicaca, Arequipa), 3 itinéraires (essentiel, Amazonie, côte). Conseils altitude, transport et budget.",
    longDescription: `Le Pérou est un pays-monde où se condensent trois univers radicalement différents : la côte Pacifique aride (Lima, Paracas, Huacachina), la Cordillère des Andes avec son héritage Inca (Cusco, Machu Picchu, Lac Titicaca), et l'Amazonie luxuriante (Iquitos, Puerto Maldonado). Cette diversité fait du Pérou l'une des destinations sud-américaines les plus complètes.

Trois itinéraires types. **L'essentiel péruvien** (12 jours) part de Lima, monte à Cusco et au Machu Picchu, traverse le Lac Titicaca à 3800 m d'altitude, et redescend par Arequipa la ville blanche et son canyon du Colca aux condors. La version **Pérou & Amazonie** (14 jours) ajoute 3-4 jours en lodge fluvial à Tambopata (jaguars, aras, singes). **Côte et désert** (7 jours, sans altitude) reste à basse altitude : Lima, réserve de Paracas, oasis de Huacachina avec ses dunes géantes, sites archéologiques de Trujillo. Pratique si tu veux éviter le mal des montagnes.

**Quand y aller** ? La saison sèche dans les Andes s'étend d'**avril à octobre** : ciel bleu, randonnée idéale. Évite la saison des pluies (novembre-mars) qui peut compliquer les treks et fermer le Camino Inca. Pour la côte : la nuit est fraîche toute l'année, jour ensoleillé. L'Amazonie est humide et chaude toute l'année.

**Comment s'y rendre** ? Aucun vol direct depuis la France. Escale via **Madrid, Amsterdam, Bogotá ou São Paulo**. Compter **850 à 1100 €** aller-retour, 15-20 heures de voyage total. Aucun visa requis (< 90 jours).

**Comment circuler** ? Les distances sont énormes (1500 km entre Lima et Cusco). Les **vols intérieurs** (LATAM, Sky, JetSmart) sont quasi indispensables : Lima-Cusco 1h pour 80-150 €. Les **bus longue distance** premium (Cruz del Sur, Oltursa, PeruHop) sont confortables et fiables pour les budgets serrés. Le train **PeruRail** est obligatoire pour atteindre le Machu Picchu (Ollantaytambo → Aguas Calientes). Voiture peu pertinente sauf Vallée Sacrée.

**Budget** : voyage de **12 jours** : compter **2000 à 3500 € par personne** vol inclus. Les hôtels milieu de gamme à Cusco/Arequipa 50-100 € la nuit. Les repas typiques restent économiques : menu del día à 8-15 €, ceviche dans une cevicheria à 10 €.

**À savoir absolument** : prévois **1 à 2 jours d'acclimatation à l'altitude** avant tout effort à Cusco (3400 m), Puno (3800 m) ou les treks. Bois de l'eau, mange léger, repos. Le mate de coca aide. Évite l'alcool les premiers jours. Achète tes billets pour le Machu Picchu plusieurs semaines à l'avance, les places sont limitées.`,
    heroImage: '/images/placeholder.svg',
    bestPeriod: 'Avril à octobre (saison sèche Andes)',
    budgetRange: '2000 – 3500 € / personne / 12 jours',
    visaInfo: 'Pas de visa pour les Français (< 90 jours)',
    language: 'Espagnol, quechua, aymara',
    currency: 'Sol péruvien (PEN)',
    timeZone: 'UTC-5 (-6h par rapport à la France en été)',
  },
};
