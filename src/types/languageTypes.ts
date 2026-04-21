export type NestedTranslations = {
  [key: string]: string | NestedTranslations
};

export type Translations = {
  en: NestedTranslations
  es: NestedTranslations
}
