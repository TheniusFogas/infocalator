 // Utility functions for text processing
 
 /**
  * Normalize text by removing diacritics and converting to lowercase
  * Supports Romanian, Hungarian, German, and other European languages
  */
 export const normalizeText = (text: string): string => {
   if (!text) return '';
   
   return text
     .toLowerCase()
     .normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
     .replace(/ă/g, 'a')
     .replace(/â/g, 'a')
     .replace(/î/g, 'i')
     .replace(/ș/g, 's')
     .replace(/ş/g, 's')
     .replace(/ț/g, 't')
     .replace(/ţ/g, 't')
     .replace(/ö/g, 'o')
     .replace(/ü/g, 'u')
     .replace(/ő/g, 'o')
     .replace(/ű/g, 'u')
     .replace(/ä/g, 'a')
     .replace(/ß/g, 'ss')
     .trim();
 };
 
 /**
  * Convert a Romanian name to its ASCII equivalent for search
  */
 export const toAscii = (text: string): string => {
   return normalizeText(text);
 };
 
 /**
  * Check if query matches text (diacritic-insensitive)
  */
 export const matchesQuery = (text: string, query: string): boolean => {
   return normalizeText(text).includes(normalizeText(query));
 };
 
 /**
  * Generate search-friendly version of locality name
  */
 export const generateSearchVariants = (name: string): string[] => {
   const normalized = normalizeText(name);
   const variants = [name, normalized];
   
   // Add common variations
   if (name.includes('-')) {
     variants.push(name.replace(/-/g, ' '));
     variants.push(normalized.replace(/-/g, ' '));
   }
   
   return [...new Set(variants)];
 };