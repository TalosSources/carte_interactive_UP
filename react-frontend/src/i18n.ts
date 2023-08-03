import i18next, { t } from "i18next";
import I18nextBrowserLanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { Initiative, Region, RegionPage } from "./KesApi";

const translations : {[code:string] : {translation :
    {
        ui : {
            allInitiatives : string,
            proposeInitiative : string,
            becomeVolunteer : string,
            startAThing : string,
            onlyOnTheMap : string,
            hideGlobal : string,
            sortByDist : string,
            sortAlpha : string,
            supportTheMap : {
                headline : string,
                firstSentence : string,
                body : string,
                button : string,
            },
            unpublishedWarning: string,
            searchPlaceholder: string,
            loadMoreCards: string,
        }
    }}} = 
{
            en: {
                translation:{
                    ui: {
                        allInitiatives: "All initiatives",
                        proposeInitiative: "Propose an initiative",
                        becomeVolunteer : "Become volunteer",
                        startAThing : "Start a thing",
                        onlyOnTheMap: "Only initiatives on the map",
                        hideGlobal: "Hide global initiatives",
                        sortByDist: "Sort by distance",
                        sortAlpha: "Sort by alphabetically",
                        unpublishedWarning: "Warning! You are viewing unpublished content. Information might be inaccurate.",
                        supportTheMap : {
                            headline : "Support the map!",
                            firstSentence : "Become a backer today!",
                            body : "We are an idealistic community that develops Smartakartan all over Sweden; and needs your help!",
                            button : "Help us grow",
                        },
                        searchPlaceholder: "Search something you want to rent, swap, borrow, share, give or receive ...",
                        loadMoreCards: "Load more cards",
                    },
                },
            },
            sv: {
                translation:{
                    ui: {
                        allInitiatives:"Alla verksamheter",
                        proposeInitiative: "Föreslå en verksamhet",
                        becomeVolunteer : "Bli volontär",
                        startAThing : "Starta en grej",
                        onlyOnTheMap: "Bara verksamheter på kartan",
                        hideGlobal: "Dölj globala verksamheter",
                        sortByDist: "Sortera efter avstånd",
                        sortAlpha: "Sortera i alfabetisk ordning",
                        unpublishedWarning: "Obs! Du tittar på icke-publicerat innehåll. Information might be inaccurate.",
                        supportTheMap : {
                            headline : "Supporta kartan!",
                            firstSentence : "Bli månadsgivare idag!",
                            body : "Vi är en ideell förening som utvecklar Smarta Kartan över hela Sverige, och vi behöver din hjälp!",
                            button : "Hjälp oss att växa",
                        },
                        searchPlaceholder: "Sök på något du vill hyra, byta, låna, dela, ge eller få...",
                        loadMoreCards: "Ladda fler kort",
                    },
                }
            },
        }

i18next
    .use(initReactI18next) // passes i18n down to react-i18next
    .use(I18nextBrowserLanguageDetector)
    .init({
        resources: translations,
        fallbackLng: ['en', 'sv'],
        debug:true,
        nonExplicitSupportedLngs: true, //support language variation
        interpolation: {
            escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
        },
    });

export function registerInitiativeTranslations(i : Initiative) {
        function registerTranslation(code : string,
                                     trans : {
                                        title: string;
                                        short_description: string;
                                        description: string;
                                     }) {
            const key =  'initiatives.'+i.slug+'.'
            i18next.addResource(code,'translation', key + 'title', trans.title);
            i18next.addResource(code,'translation', key + 'short_description', trans.short_description);
            i18next.addResource(code,'translation', key + 'description', trans.description);
        }
        for (const code in i.initiative_translations) {
            registerTranslation(i.initiative_translations[code].language, i.initiative_translations[code]);
        }
    }

export function registerRegionPageDescription(rp : RegionPage, region:string, page:string) {
    for (const translation of rp.rp_translations) {
        i18next.addResource(
            translation.language,
            'translation',
            'region.'+region+'.'+page+'.description',
            translation.description)
    }
}

export function registerRegionPageTitles(r : Region) {
    for (const page of r.properties.rp_region) {
        for (const translation of page.rp_translations) {
            i18next.addResource(
                translation.language,
                'translation',
                'region.'+r.properties.slug+'.'+page.slug+'.title',
                translation.title)
        }
    }
}

export function getTitle(initiative : Initiative) {
    return t(('initiatives.'+initiative.slug+'.title'))
}
export function getShortDescription(initiative : Initiative) {
    return t(('initiatives.'+initiative.slug+'.short_description'))
}
export function getDescription(initiative : Initiative) {
    return t(('initiatives.'+initiative.slug+'.description'))
}

export default i18next;