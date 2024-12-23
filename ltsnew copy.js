const globalData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      name: "schilder Hoorn: T.H.A schilderwerk & vastgoedonderhoud",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Kieftentuin 1",
        addressLocality: "Zwaag",
        addressRegion: "Noord-Holland",
        postalCode: "1689 LH",
        addressCountry: "NL",
      },
      telephone: "+31 630075013",
      email: "contact@tha-diensten.nl",
      description:
        "Specialist in schilder-, spuit- en onderhoudswerkzaamheden met meer dan 8 jaar ervaring in Noord-Holland, Almere en de omliggende gebieden. Als u op zoek bent naar een betrouwbare schilder in Hoorn, Almere, Noord-Holland of Flevoland, is T.H.A Vastgoedonderhoud uw vertrouwde keuze. Wij bieden professionele schilderdiensten aan in Hoorn, schilder inhuren in Almere, schilder inhuren in Noord-Holland en schilder inhuren in Flevoland.",
      image:
        "https://static.tildacdn.net/tild3266-6463-4663-a364-356436363732/My_project_1_1_0_2.webp",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: 4.9,
        ratingCount: 29,
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "08:00",
        closes: "20:00",
      },
      areaServed: [
        "Noord-Holland",
        "Almere",
        "Hoorn",
        "Flevoland",
        {
          "@type": "City",
          name: "Hoorn",
          sameAs: "https://tha-diensten.nl/schildersbedrijf-hoorn",
        },
        {
          "@type": "City",
          name: "Almere",
          sameAs: "https://tha-diensten.nl",
        },
        {
          "@type": "GeoCircle",
          address: {
            "@type": "PostalAddress",
            streetAddress: "2566 Dow St",
            addressLocality: "Ottawa",
            addressRegion: "ON",
            postalCode: "K0A2P0",
            addressCountry: "CA",
          },
          geoRadius: "25000",
        },
        {
          "@type": "GeoCircle",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Hoorn",
            addressRegion: "Noord-Holland",
            addressCountry: "NL",
          },
          geoRadius: "25000",
        },
        {
          "@type": "GeoCircle",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Almere",
            addressRegion: "Flevoland",
            addressCountry: "NL",
          },
          geoRadius: "25000",
        },
      ],
      founder: "Thierry Henrich",
      foundingDate: "2016-03-31",
      paymentAccepted: "Cash, Credit Card",
      url: "https://tha-diensten.nl/",
      sameAs: [
        "https://www.facebook.com/schilder.hoorn/",
        "https://www.linkedin.com/company/schildersbedrijf-hoorn",
        "https://www.instagram.com/tha_vastgoed_schilderwerk/",
        "https://www.youtube.com/channel/UC2IUNRqPVnA3koX3Ax03Elw",
        "https://nl.pinterest.com/pin/tha-schilderwerk--884816658010898265/",
        "https://g.page/schilder-hoorn?share",
        "https://goo.gl/maps/KNcdhkwFqtZ2Pe3ZA",
        "https://schilder-hoorn.nl",
        "https://www.schildersbedrijf.blog",
        "https://www.tha-diensten.com",
      ],
      location: [
        {
          "@type": "Place",
          name: "schilder Hoorn: T.H.A Schilderwerk & Vastgoedonderhoud",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Florijn 81",
            addressLocality: "Hoorn",
            addressRegion: "Noord-Holland",
            postalCode: "1628 RM",
            addressCountry: "NL",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: 52.6486489,
            longitude: 5.0918381,
          },
        },
        {
          "@type": "Place",
          name: "T.H.A schilderwerk & vastgoedonderhoud",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Kieftentuin 1",
            addressLocality: "Zwaag",
            addressRegion: "Noord-Holland",
            postalCode: "1689 LH",
            addressCountry: "NL",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: 52.6691294,
            longitude: 5.0537294,
          },
        },
        {
          "@type": "Place",
          name: "T.H.A schilderwerken en vastgoedonderhoud Almere",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Almere",
            addressRegion: "Flevoland",
            addressCountry: "NL",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: 52.350785,
            longitude: 5.264702,
          },
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "T.H.A schilderwerk & vastgoedonderhoud",
      alternateName: "schilder Hoorn: T.H.A schilderwerk & vastgoedonderhoud",
      url: "https://tha-diensten.nl/",
      logo: "https://static.tildacdn.net/tild3266-6463-4663-a364-356436363732/My_project_1_1_0_2.webp",
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: "+31 630075013",
          contactType: "technical support",
          areaServed: ["Noord-Holland", "Almere", "Hoorn", "Flevoland"],
        },
        {
          "@type": "ContactPoint",
          telephone: "+31 630075013",
          contactType: "billing support",
        },
      ],
      sameAs: [
        "https://www.facebook.com/schilder.hoorn/",
        "https://www.linkedin.com/company/schildersbedrijf-hoorn",
        "https://www.instagram.com/tha_vastgoed_schilderwerk/",
        "https://www.youtube.com/channel/UC2IUNRqPVnA3koX3Ax03Elw",
        "https://nl.pinterest.com/pin/tha-schilderwerk--884816658010898265/",
        "https://g.page/schilder-hoorn?share",
        "https://goo.gl/maps/KNcdhkwFqtZ2Pe3ZA",
      ],
      reviews: [
        {
          "@type": "Review",
          author: {
            "@type": "Person",
            name: "Rinie Cassteele-Koedijk",
          },
          datePublished: "2023-08-04",
          reviewBody:
            "Hele vriendelijke service en harde werkers die bereid zijn om met je mee te denken.",
        },
        {
          "@type": "Review",
          author: {
            "@type": "Person",
            name: "Sjoewiie Delis",
          },
          datePublished: "2023-01-23",
          reviewBody:
            "Voor mijn bedrijf heb ik de mannen van T.H.A schilderwerk en vastgoed op 2 vestigingen renovatie binnenwerk laten uitvoeren. De communicatie verliep uitermate goed, zowel voor als tijdens het uitvoeren van het werk. Ze waren heel flexibel bij onvoorzien werk en omstandigheden. Zeer tevreden met geleverd schilderwerk.",
        },
        {
          "@type": "Review",
          author: {
            "@type": "Person",
            name: "Alida S.",
          },
          datePublished: "2021-04-16",
          reviewBody:
            "Tevreden over het geleverde schilderwerk. De buitenkant van het huis is erg opgeknapt! De schilders zijn erg vriendelijk en werken heel netjes en vlot. Communicatie verloopt ook goed, er is snel reactie op de mail en alles wordt overlegd. Kortom echt een aanrader!",
        },
        {
          "@type": "Review",
          author: {
            "@type": "Person",
            name: "TP19091979",
          },
          datePublished: "2021-09-10",
          reviewBody:
            "Mijn broertje en ik hadden Thierry ingehuurd voor het buitenschilderwerk voor twee huizen. Mijn ervaring was enkel positief. Thierry was zeer kundig en een voorbeeldig professional. Communicatie was helder, duidelijk en transparant. Het werk was secuur en van hoge kwaliteit, ben erg tevreden met het eindresultaat.",
        },
        {
          "@type": "Review",
          author: {
            "@type": "Person",
            name: "A Person",
          },
          datePublished: "2019-11-10",
          reviewBody:
            "Onlangs is deze geweldige schilder uit hoorn bij ons thuis geweest voor het schilderwerk in de huiskamer. Prachtig geworden. Hij vroeg naar onze wensen, kreeg al vlot een nette offerte. Erg klantvriendelijk ook. Het viel me op dat de schilder echt vlot, maar toch netjes te werk gaat. Kan deze schilder zeker aan raden. Topper! Zo blij met het resultaat.",
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://tha-diensten.nl/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Schildersbedrijf Hoorn",
          item: "https://tha-diensten.nl/schildersbedrijf-hoorn",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Buitenschilderwerk",
          item: "https://tha-diensten.nl/buitenschilderwerk",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Binnenschilderwerk",
          item: "https://tha-diensten.nl/binnenschilderwerk",
        },
        {
          "@type": "ListItem",
          position: 5,
          name: "Reiniging",
          item: "https://tha-diensten.nl/reiniging",
        },
        {
          "@type": "ListItem",
          position: 6,
          name: "Zonnepaneel",
          item: "https://tha-diensten.nl/zonnepaneel",
        },
        {
          "@type": "ListItem",
          position: 7,
          name: "Houtwerken & Beglazing",
          item: "https://tha-diensten.nl/houtwerkenbeglazing",
        },
        {
          "@type": "ListItem",
          position: 8,
          name: "Spuitwerken",
          item: "https://tha-diensten.nl/spuitwerken",
        },
        {
          "@type": "ListItem",
          position: 9,
          name: "Wie Zijn Wij",
          item: "https://tha-diensten.nl/wiezijnwij",
        },
        {
          "@type": "ListItem",
          position: 10,
          name: "Zakelijk",
          item: "https://tha-diensten.nl/zakelijk",
        },
        {
          "@type": "ListItem",
          position: 11,
          name: "Behangen",
          item: "https://tha-diensten.nl/behangen",
        },
        {
          "@type": "ListItem",
          position: 12,
          name: "Dakreiniging",
          item: "https://tha-diensten.nl/dakreiniging",
        },
        {
          "@type": "ListItem",
          position: 13,
          name: "Tarieven",
          item: "https://tha-diensten.nl/tarieven",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Biedt T.H.A. Vastgoedonderhoud diensten aan in Hoorn?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ja, wij zijn uw vertrouwde schilder in Hoorn en staan klaar om al uw schilderbehoeften te vervullen.",
          },
        },
        {
          "@type": "Question",
          name: "Is T.H.A. Vastgoedonderhoud actief als schilder in Almere?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Absoluut! Wij bieden uitgebreide schilderdiensten aan in Almere en omliggende gebieden.",
          },
        },
        {
          "@type": "Question",
          name: "Wat zijn de regio's van operatie voor T.H.A. Vastgoedonderhoud?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Wij zijn actief in diverse regio's waaronder Noord-Holland en Flevoland, met specifieke diensten in steden zoals Hoorn en Almere.",
          },
        },
        {
          "@type": "Question",
          name: "Hoe kan ik een schilder inhuren bij T.H.A. Vastgoedonderhoud voor mijn project in Noord-Holland?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "U kunt ons direct benaderen via telefoon of e-mail voor het inhuren van onze schilderdiensten in Noord-Holland.",
          },
        },
        {
          "@type": "Question",
          name: "Hoe vraag ik een offerte aan voor schilderwerk in Flevoland?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Neem contact op met T.H.A. Vastgoedonderhoud via telefoon of e-mail om een offerte aan te vragen voor schilderwerk in Flevoland.",
          },
        },
        {
          "@type": "Question",
          name: "Welke diensten biedt T.H.A. Vastgoedonderhoud aan in Almere?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "In Almere bieden we een breed scala aan schilder- en onderhoudsdiensten aan. Contacteer ons voor specifieke diensten en offertes.",
          },
        },
        {
          "@type": "Question",
          name: "Zijn er specifieke voordelen bij het inhuren van T.H.A. Vastgoedonderhoud voor schilderwerk in Hoorn?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Bij het inhuren van ons voor uw schilderwerk in Hoorn profiteert u van jarenlange ervaring, kwaliteit, en een betrouwbare service.",
          },
        },
        {
          "@type": "Question",
          name: "Hoe verschillen de schilderdiensten van T.H.A. Vastgoedonderhoud in Noord-Holland van die in Flevoland?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Onze diensten zijn consistent in kwaliteit en professionaliteit, ongeacht de regio. Echter, locatie-specifieke diensten of aanbiedingen kunnen variëren tussen Noord-Holland en Flevoland.",
          },
        },
        {
          "@type": "Question",
          name: "Wat is de wachttijd voor schilderdiensten in Almere?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "De wachttijd kan variëren afhankelijk van het seizoen en de huidige boekingen. Neem contact op voor actuele wachttijden in Almere.",
          },
        },
        {
          "@type": "Question",
          name: "Bieden jullie garanties op schilderwerk in Hoorn?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ja, wij bieden garanties op ons schilderwerk, inclusief onze projecten in Hoorn. Voor details kunt u contact met ons opnemen.",
          },
        },
        {
          "@type": "Question",
          name: "Is er een mogelijkheid voor een spoedklus als schilder in Flevoland?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ja, afhankelijk van onze huidige planning kunnen wij spoedklussen accepteren in Flevoland. Neem direct contact op voor beschikbaarheid.",
          },
        },
        {
          "@type": "Question",
          name: "Wat zijn de kosten van het inhuren van een schilder in Noord-Holland?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "De kosten kunnen variëren afhankelijk van het project en de specifieke eisen. Voor een nauwkeurige offerte in Noord-Holland, neem contact met ons op.",
          },
        },
        {
          "@type": "Question",
          name: "Kan ik referenties krijgen van eerdere schilderprojecten in Almere?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Zeker! Wij kunnen referenties verstrekken van eerdere tevreden klanten uit Almere en andere locaties.",
          },
        },
        {
          "@type": "Question",
          name: "Hoe lang duurt een gemiddeld schilderproject in Hoorn?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "De duur van een schilderproject kan variëren afhankelijk van de omvang en complexiteit. Neem contact op voor een geschatte tijdsduur voor uw project in Hoorn.",
          },
        },
        {
          "@type": "Question",
          name: "Werken jullie met milieuvriendelijke verfproducten in Flevoland?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ja, wij geven prioriteit aan het gebruik van milieuvriendelijke en duurzame verfproducten, ook in Flevoland.",
          },
        },
        {
          "@type": "Question",
          name: "Bieden jullie onderhoudscontracten aan voor langetermijnprojecten in Noord-Holland?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ja, wij bieden onderhoudscontracten aan voor klanten die op zoek zijn naar langetermijn schilder- en onderhoudsdiensten in Noord-Holland.",
          },
        },
        {
          "@type": "Question",
          name: "Kan ik ook binnenschilderwerk laten doen door T.H.A. Vastgoedonderhoud in Almere?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Absoluut! Naast buitenschilderwerk zijn wij ook gespecialiseerd in binnenschilderwerk in Almere en andere regio's.",
          },
        },
        {
          "@type": "Question",
          name: "Hoe gaan jullie te werk bij slecht weer tijdens een schilderproject in Hoorn?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Bij slecht weer nemen we alle noodzakelijke voorzorgsmaatregelen om de kwaliteit van het werk te waarborgen en eventuele vertragingen tot een minimum te beperken.",
          },
        },
        {
          "@type": "Question",
          name: "Is er een verschil in prijs voor schilderdiensten tussen Flevoland en Noord-Holland?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Hoewel onze prijzen over het algemeen consistent zijn, kunnen er locatiespecifieke variaties zijn tussen Flevoland en Noord-Holland. We adviseren u om een offerte aan te vragen voor exacte prijzen.",
          },
        },
        {
          "@type": "Question",
          name: "Hoe kan ik feedback geven over een recent uitgevoerd schilderproject in Almere?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We waarderen feedback van onze klanten. U kunt contact met ons opnemen via telefoon of e-mail om uw ervaringen te delen.",
          },
        },
        {
          "@type": "Question",
          name: "Zijn er speciale aanbiedingen voor terugkerende klanten in Hoorn?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ja, we waarderen de loyaliteit van onze klanten en bieden vaak speciale aanbiedingen of kortingen aan voor terugkerende klanten in Hoorn en andere regio's.",
          },
        },
        {
          "@type": "Question",
          name: "Kan ik kleuradvies krijgen voor mijn schilderproject in Flevoland?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ja, wij bieden professioneel kleuradvies om ervoor te zorgen dat uw schilderproject in Flevoland er perfect uitziet.",
          },
        },
        {
          "@type": "Question",
          name: "Welke soorten verfmerken gebruikt T.H.A. Vastgoedonderhoud in Noord-Holland?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Wij gebruiken diverse gerenommeerde verfmerken om de beste resultaten te garanderen voor onze klanten in Noord-Holland.",
          },
        },
        {
          "@type": "Question",
          name: "Hebben jullie ervaring met zowel residentiële als commerciële schilderprojecten in Almere?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ja, T.H.A. Vastgoedonderhoud heeft ruime ervaring met zowel residentiële als commerciële schilderprojecten in Almere en andere locaties.",
          },
        },
      ],
    },

    {
      "@context": "https://schema.org/",
      "@type": "WebSite",
      name: "THA schilderwerk & vastgoedonderhoud",
      url: "https://tha-diensten.nl/",
      potentialAction: {
        "@type": "SearchAction",
        target:
          "https://tha-diensten.nl/{search_term_string}#offerte-aanvragen",
        "query-input": "required name=search_term_string",
      },
    },
    [
      {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: "T.H.A Vastgoedonderhoud",
        description:
          "T.H.A schilderwerk & vastgoedonderhoud\nvraag nu een vrijblijvende offerte aan \nhttps://tha-diensten.nl/",
        thumbnailUrl: [
          "https://i.ytimg.com/vi/jMak8UxW9D4/default.webp",
          "https://i.ytimg.com/vi/jMak8UxW9D4/mqdefault.webp",
          "https://i.ytimg.com/vi/jMak8UxW9D4/hqdefault.webp",
          "https://i.ytimg.com/vi/jMak8UxW9D4/sddefault.webp",
          "https://i.ytimg.com/vi/jMak8UxW9D4/maxresdefault.webp",
        ],
        uploadDate: "2022-07-21T20:54:25Z",
        contentUrl: "https://youtu.be/jMak8UxW9D4",
      },
      {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: "T.H.A schilderwerk: spuitwerk",
        description:
          "T.H.A schilderwerk & vastgoedonderhoud is ook zeer vakkundig in het uitvoeren van spuitwerk \nOns werkgebied is tot 35km rondom Hoorn \nvraag nu een vrijblijvende offerte aan \nhttps://tha-diensten.nl/spuitwerk.html",
        thumbnailUrl: [
          "https://i.ytimg.com/vi/qiR18pWKaTg/default.webp",
          "https://i.ytimg.com/vi/qiR18pWKaTg/mqdefault.webp",
          "https://i.ytimg.com/vi/qiR18pWKaTg/hqdefault.webp",
          "https://i.ytimg.com/vi/qiR18pWKaTg/sddefault.webp",
          "https://i.ytimg.com/vi/qiR18pWKaTg/maxresdefault.webp",
        ],
        uploadDate: "2022-07-21T20:52:15Z",
        contentUrl: "https://youtu.be/qiR18pWKaTg",
      },
      {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: "T.H.A schilderwerk: Binnenschilderwerk",
        description:
          "T.H.A schilderwerk & vastgoedonderhoud is ook zeer vakkundig in het uitvoeren van binnenschilderwerk. \nOns werkgebied is tot 35km rondom Hoorn \nvraag nu een vrijblijvende offerte aan \nhttps://tha-diensten.nl/binnenschilderwerk.html",
        thumbnailUrl: [
          "https://i.ytimg.com/vi/XBNHzlwIzRg/default.webp",
          "https://i.ytimg.com/vi/XBNHzlwIzRg/mqdefault.webp",
          "https://i.ytimg.com/vi/XBNHzlwIzRg/hqdefault.webp",
          "https://i.ytimg.com/vi/XBNHzlwIzRg/sddefault.webp",
          "https://i.ytimg.com/vi/XBNHzlwIzRg/maxresdefault.webp",
        ],
        uploadDate: "2021-10-29T11:28:31Z",
        contentUrl: "https://youtu.be/XBNHzlwIzRg",
      },
      {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: "T.H.A schilderwerk: Buitenschilderwerk",
        description:
          "T.H.A schilderwerk & vastgoedonderhoud is ook zeer vakkundig in het uitvoeren van Buitenschilderwerk",
        thumbnailUrl: [
          "https://i.ytimg.com/vi/9F9GcZDRPTY/default.webp",
          "https://i.ytimg.com/vi/9F9GcZDRPTY/mqdefault.webp",
          "https://i.ytimg.com/vi/9F9GcZDRPTY/hqdefault.webp",
          "https://i.ytimg.com/vi/9F9GcZDRPTY/sddefault.webp",
          "https://i.ytimg.com/vi/9F9GcZDRPTY/maxresdefault.webp",
        ],
        uploadDate: "2022-07-21T20:49:38Z",
        contentUrl: "https://youtu.be/9F9GcZDRPTY",
      },
    ],
  ],
};
