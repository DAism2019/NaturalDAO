import i18next from 'i18next'
import {initReactI18next} from 'react-i18next'
import XHR from 'i18next-xhr-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
//这里是临时处理了，估计和放在二级子目录有关，并且可能有.htaccess里没有对json重新定向的原因
import { getPathBase } from './utils'
//注意:这里在浏览器里有时会得到zh而不是zh-CN
i18next.use(XHR).use(LanguageDetector).use(initReactI18next).init({
    backend: {
        loadPath: getPathBase() + '/locales/{{lng}}.json'
    },
    react: {
        useSuspense: true
    },
    // lng: 'en',
    fallbackLng: 'en',
    preload: [
        'en', 'zh','zh-CN'
    ],
    keySeparator: false,
    interpolation: {
        escapeValue: false
    }
})



export default i18next
