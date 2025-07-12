import i18next, { t } from 'i18next'
import I18nextBrowserLanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next, useTranslation } from 'react-i18next'
import { type Initiative, type Region, type RegionPage } from './KesApi'
import React from 'react'

const translations: Record<string, { translation:
{
  ui: {
    allInitiatives: string
    proposeInitiative: string
    becomeVolunteer: string
    startAThing: string
    onlyOnTheMap: string
    hideGlobal: string
    sortByDist: string
    sortAlpha: string
    supportTheMap: {
      headline: string
      firstSentence: string
      body: string
      button: string
    }
    unpublishedWarning: string
    searchPlaceholder: string
    loadMoreCards: string
  }
} }> =
{
  en: {
    translation: {
      ui: {
        allInitiatives: 'All initiatives',
        proposeInitiative: 'Propose an initiative',
        becomeVolunteer: 'Become volunteer',
        startAThing: 'Start a thing',
        onlyOnTheMap: 'Only initiatives on the map',
        hideGlobal: 'Hide global initiatives',
        sortByDist: 'Sort by distance',
        sortAlpha: 'Sort alphabetically',
        unpublishedWarning: 'Warning! You are viewing unpublished content. Information might be inaccurate.',
        supportTheMap: {
          headline: 'Support the map!',
          firstSentence: 'Become a backer today!',
          body: 'We are an idealistic community that develops Smartakartan all over Sweden; and needs your help!',
          button: 'Help us grow'
        },
        searchPlaceholder: 'Search something you want to rent, swap, borrow, share, give or receive ...',
        loadMoreCards: 'Load more cards'
      }
    }
  },
  sv: {
    translation: {
      ui: {
        allInitiatives: 'Alla verksamheter',
        proposeInitiative: 'Föreslå en verksamhet',
        becomeVolunteer: 'Bli volontär',
        startAThing: 'Starta en grej',
        onlyOnTheMap: 'Bara verksamheter på kartan',
        hideGlobal: 'Dölj globala verksamheter',
        sortByDist: 'Sortera efter avstånd',
        sortAlpha: 'Sortera i alfabetisk ordning',
        unpublishedWarning: 'Obs! Du tittar på icke-publicerat innehåll. Information might be inaccurate.',
        supportTheMap: {
          headline: 'Supporta kartan!',
          firstSentence: 'Bli månadsgivare idag!',
          body: 'Vi är en ideell förening som utvecklar Smarta Kartan över hela Sverige, och vi behöver din hjälp!',
          button: 'Hjälp oss att växa'
        },
        searchPlaceholder: 'Sök på något du vill hyra, byta, låna, dela, ge eller få...',
        loadMoreCards: 'Ladda fler kort'
      }
    }
  },
  fr: {
    translation: {
      ui: {
        allInitiatives: 'Toutes les initiatives',
        proposeInitiative: 'Proposer une initiative',
        becomeVolunteer: 'Devenir bénévole',
        startAThing: 'Lancer un projet',
        onlyOnTheMap: 'Uniquement les initiatives sur la carte',
        hideGlobal: 'Masquer les initiatives globales',
        sortByDist: 'Trier par distance',
        sortAlpha: 'Trier par ordre alphabétique',
        unpublishedWarning: 'Attention ! Vous consultez du contenu non publié. Les informations peuvent être inexactes.',
        supportTheMap: {
          headline: 'Soutenez la carte !',
          firstSentence: 'Devenez un contributeur dès aujourd\'hui !',
          body: 'Nous sommes une communauté idéaliste qui développe Smartakartan partout en Suède et nous avons besoin de votre aide !',
          button: 'Aidez-nous à grandir'
        },
        searchPlaceholder: 'Recherchez quelque chose que vous voulez louer, échanger, emprunter, partager, donner ou recevoir ...',
        loadMoreCards: 'Charger plus de cartes'
      }
    }
  }
}

i18next
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(I18nextBrowserLanguageDetector)
  .init({
    resources: translations,
    fallbackLng: ['en', 'sv'],
    debug: true,
    nonExplicitSupportedLngs: true, // support language variation
    interpolation: {
      escapeValue: false // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    }
  })
  .catch(() => {
    console.log('Error while initializing i18n.')
  })

export function registerInitiativeTranslations (i: Initiative): void {
  function registerTranslation (code: string,
    trans: {
      title: string
      short_description: string
      description: string
    }): void {
    const key = `initiatives.${i.slug}.`
    i18next.addResource(code, 'translation', `${key}title`, trans.title)
    i18next.addResource(code, 'translation', `${key}short_description`, trans.short_description)
    i18next.addResource(code, 'translation', `${key}description`, trans.description)
  }
  for (const translation of i.initiative_translations) {
    registerTranslation(translation.language, translation)

    const current = translation

    current.query_tokens = {
      title: current.title.toLowerCase(),
      short_description: current.short_description.toLowerCase(),
      description: current.description.toLowerCase()
    }
  }
}

export function registerRegionPageDescription (rp: RegionPage, region: string, page: string): void {
  for (const translation of rp.rp_translations) {
    i18next.addResource(
      translation.language,
      'translation',
      'region.' + region + '.' + page + '.description',
      translation.description)
  }
}

export function registerRegionPageTitles (r: Region): void {
  for (const page of r.properties.rp_region) {
    for (const translation of page.rp_translations) {
      i18next.addResource(
        translation.language,
        'translation',
        'region.' + r.properties.slug + '.' + page.slug + '.title',
        translation.title)
    }
  }
}

export function getTitle (initiative: Initiative): string {
  // return t(('initiatives.' + initiative.slug + '.title'))
  return t((initiative.initiative_translations[0].title)) // TODO: Bad
}

export function getShortDescription (initiative: Initiative): string {
  // return t(('initiatives.' + initiative.slug + '.short_description'))
  return t((initiative.initiative_translations[0].short_description))
}

export function getDescription (initiative: Initiative): string {
  // return t(('initiatives.' + initiative.slug + '.description'))
  return t((initiative.initiative_translations[0].description))
}

export function registerRegionTranslations (r: Region): void {
  for (const translation of r.properties.r_translations) {
    i18next.addResource(
      translation.language,
      'translation',
      'regions.' + r.properties.slug + '.title',
      translation.title
    )
    i18next.addResource(
      translation.language,
      'translation',
      'regions.' + r.properties.slug + '.message',
      translation.welcome_message
    )
  }
}

export function getRegionTitle (r: Region): string {
  // return t(('regions.' + r.properties.slug + '.title'))
  return t((r.properties.r_translations[0].title))
}
export function RegionMessage (prop: { region: Region | undefined }): React.JSX.Element {
  const { t } = useTranslation()
  const r = prop.region
  if (typeof (r) === 'undefined') {
    return <></>
  }
  // const translation: string = t(('regions.' + r.properties.slug + '.message'))
  const translation: string = t((r.properties.r_translations[0].welcome_message))
  return <div dangerouslySetInnerHTML={{ __html: translation }} />
}

export default i18next
