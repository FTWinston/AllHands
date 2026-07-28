export function getIndefiniteArticle(word: string): 'a' | 'an' {
    return ['a', 'e', 'i', 'o', 'u'].includes(word[0].toLowerCase()) ? 'an' : 'a';
}
