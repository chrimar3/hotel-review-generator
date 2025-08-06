/**
 * Text Quality Enhancement Service
 * Professional grammar, spelling, and readability improvements
 * Helps improve the quality of genuine guest feedback and hotel communications
 */

export class TextQualityService {
    constructor(errorMonitor) {
        this.errorMonitor = errorMonitor;
        this.grammarChecker = new GrammarEnhancer();
        this.spellChecker = new SpellChecker();
        this.readabilityAnalyzer = new ReadabilityAnalyzer();
        
        if (typeof console !== 'undefined') {
            console.log('[TextQuality] Text quality enhancement service initialized');
        }
    }

    // Main text enhancement method
    enhanceText(text, options = {}) {
        if (!text || typeof text !== 'string') {
            return { originalText: text, enhancedText: text, improvements: [] };
        }

        const improvements = [];
        let enhancedText = text;

        // Apply grammar corrections
        if (options.grammar !== false) {
            const grammarResult = this.grammarChecker.enhance(enhancedText);
            if (grammarResult.text !== enhancedText) {
                improvements.push({
                    type: 'grammar',
                    description: 'Grammar and punctuation improvements',
                    changes: grammarResult.corrections
                });
                enhancedText = grammarResult.text;
            }
        }

        // Apply spell checking
        if (options.spelling !== false) {
            const spellResult = this.spellChecker.check(enhancedText);
            if (spellResult.corrections.length > 0) {
                improvements.push({
                    type: 'spelling',
                    description: 'Spelling corrections',
                    changes: spellResult.corrections
                });
                enhancedText = spellResult.correctedText;
            }
        }

        // Improve readability
        if (options.readability !== false) {
            const readabilityResult = this.improveReadability(enhancedText);
            if (readabilityResult.improved) {
                improvements.push({
                    type: 'readability',
                    description: 'Readability improvements',
                    changes: readabilityResult.changes
                });
                enhancedText = readabilityResult.text;
            }
        }

        // Generate quality metrics
        const qualityMetrics = this.analyzeQuality(text, enhancedText);

        return {
            originalText: text,
            enhancedText,
            improvements,
            qualityMetrics
        };
    }

    // Grammar and style improvement
    improveReadability(text) {
        const changes = [];
        let improvedText = text;

        // Split into sentences for analysis
        const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim());
        const improvedSentences = [];

        for (let sentence of sentences) {
            let improved = sentence;
            
            // Fix common readability issues
            const readabilityFixes = [
                // Remove excessive adjectives
                {
                    pattern: /\b(very|really|quite|extremely|incredibly)\s+(very|really|quite|extremely|incredibly)\s+/gi,
                    replacement: '$1 ',
                    description: 'Removed redundant intensifiers'
                },
                // Simplify wordy phrases
                {
                    pattern: /\bin order to\b/gi,
                    replacement: 'to',
                    description: 'Simplified wordy phrase'
                },
                {
                    pattern: /\bdue to the fact that\b/gi,
                    replacement: 'because',
                    description: 'Simplified wordy phrase'
                },
                // Fix spacing issues
                {
                    pattern: /\s{2,}/g,
                    replacement: ' ',
                    description: 'Fixed extra spaces'
                }
            ];

            for (const fix of readabilityFixes) {
                if (fix.pattern.test(improved)) {
                    const before = improved;
                    improved = improved.replace(fix.pattern, fix.replacement);
                    if (improved !== before) {
                        changes.push({
                            before: sentence,
                            after: improved,
                            reason: fix.description
                        });
                    }
                }
            }

            improvedSentences.push(improved);
        }

        const finalText = improvedSentences.join(' ').trim();
        
        return {
            text: finalText,
            improved: finalText !== text,
            changes
        };
    }

    // Quality analysis
    analyzeQuality(originalText, enhancedText) {
        return {
            original: this.calculateTextMetrics(originalText),
            enhanced: this.calculateTextMetrics(enhancedText),
            improvement: this.calculateImprovement(originalText, enhancedText)
        };
    }

    calculateTextMetrics(text) {
        return {
            wordCount: this.countWords(text),
            sentenceCount: this.countSentences(text),
            readabilityScore: this.readabilityAnalyzer.calculateScore(text),
            averageWordsPerSentence: this.calculateAverageWordsPerSentence(text),
            complexWords: this.countComplexWords(text)
        };
    }

    calculateImprovement(original, enhanced) {
        const originalMetrics = this.calculateTextMetrics(original);
        const enhancedMetrics = this.calculateTextMetrics(enhanced);

        return {
            readabilityImprovement: enhancedMetrics.readabilityScore - originalMetrics.readabilityScore,
            clarityScore: this.calculateClarityImprovement(original, enhanced),
            overallScore: this.calculateOverallImprovement(originalMetrics, enhancedMetrics)
        };
    }

    calculateClarityImprovement(original, enhanced) {
        // Simple clarity scoring based on sentence length and word complexity
        const originalComplexity = this.calculateComplexity(original);
        const enhancedComplexity = this.calculateComplexity(enhanced);
        
        return Math.max(0, originalComplexity - enhancedComplexity) * 10;
    }

    calculateComplexity(text) {
        const avgWordsPerSentence = this.calculateAverageWordsPerSentence(text);
        const complexWordRatio = this.countComplexWords(text) / this.countWords(text);
        
        return (avgWordsPerSentence / 20) + (complexWordRatio * 2);
    }

    calculateOverallImprovement(original, enhanced) {
        const readabilityWeight = 0.4;
        const clarityWeight = 0.3;
        const conciseWeight = 0.3;
        
        const readabilityImprovement = Math.max(0, enhanced.readabilityScore - original.readabilityScore) / 10;
        const clarityImprovement = this.calculateClarityImprovement(
            { wordCount: original.wordCount, sentenceCount: original.sentenceCount },
            { wordCount: enhanced.wordCount, sentenceCount: enhanced.sentenceCount }
        ) / 10;
        const conciseImprovement = original.wordCount > enhanced.wordCount ? 
            ((original.wordCount - enhanced.wordCount) / original.wordCount) * 10 : 0;
        
        return (readabilityImprovement * readabilityWeight) + 
               (clarityImprovement * clarityWeight) + 
               (conciseImprovement * conciseWeight);
    }

    // Text analysis utilities
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    countSentences(text) {
        return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    }

    calculateAverageWordsPerSentence(text) {
        const wordCount = this.countWords(text);
        const sentenceCount = this.countSentences(text);
        return sentenceCount > 0 ? wordCount / sentenceCount : 0;
    }

    countComplexWords(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        return words.filter(word => this.isComplexWord(word)).length;
    }

    isComplexWord(word) {
        // Simple heuristic: words with 3+ syllables are considered complex
        return this.countSyllables(word) >= 3;
    }

    countSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        
        const vowels = 'aeiouy';
        let syllableCount = 0;
        let previousWasVowel = false;
        
        for (let i = 0; i < word.length; i++) {
            const isVowel = vowels.includes(word[i]);
            if (isVowel && !previousWasVowel) {
                syllableCount++;
            }
            previousWasVowel = isVowel;
        }
        
        // Adjust for silent e
        if (word.endsWith('e') && syllableCount > 1) {
            syllableCount--;
        }
        
        return Math.max(1, syllableCount);
    }

    // Public API methods
    checkGrammar(text) {
        return this.grammarChecker.check(text);
    }

    checkSpelling(text) {
        return this.spellChecker.check(text);
    }

    analyzeReadability(text) {
        return this.readabilityAnalyzer.analyze(text);
    }

    suggestImprovements(text) {
        const analysis = this.enhanceText(text);
        const suggestions = [];

        // Add specific suggestions based on analysis
        if (analysis.qualityMetrics.original.averageWordsPerSentence > 25) {
            suggestions.push({
                type: 'sentence_length',
                message: 'Consider breaking up long sentences for better readability',
                priority: 'medium'
            });
        }

        if (analysis.qualityMetrics.original.readabilityScore < 60) {
            suggestions.push({
                type: 'readability',
                message: 'Text could be simplified for better understanding',
                priority: 'high'
            });
        }

        if (analysis.improvements.some(imp => imp.type === 'spelling')) {
            suggestions.push({
                type: 'spelling',
                message: 'Spelling errors detected and can be corrected',
                priority: 'high'
            });
        }

        return {
            suggestions,
            enhancedText: analysis.enhancedText,
            metrics: analysis.qualityMetrics
        };
    }
}

// Helper classes for text quality analysis

class GrammarEnhancer {
    enhance(text) {
        const corrections = [];
        let enhanced = text;

        // Basic grammar corrections
        const grammarRules = [
            // Fix spacing around punctuation
            {
                pattern: /\s+([,.!?;:])/g,
                replacement: '$1',
                description: 'Fixed spacing before punctuation'
            },
            {
                pattern: /([,.!?;:])\s*(\S)/g,
                replacement: '$1 $2',
                description: 'Added space after punctuation'
            },
            // Fix capitalization
            {
                pattern: /^\s*([a-z])/,
                replacement: (match, letter) => match.replace(letter, letter.toUpperCase()),
                description: 'Capitalized first letter'
            },
            {
                pattern: /([.!?]\s+)([a-z])/g,
                replacement: (match, punct, letter) => punct + letter.toUpperCase(),
                description: 'Capitalized after sentence end'
            },
            // Fix double spaces
            {
                pattern: /\s{2,}/g,
                replacement: ' ',
                description: 'Fixed multiple spaces'
            }
        ];

        grammarRules.forEach(rule => {
            if (rule.pattern.test(enhanced)) {
                const before = enhanced;
                enhanced = enhanced.replace(rule.pattern, rule.replacement);
                if (enhanced !== before) {
                    corrections.push({
                        rule: rule.description,
                        applied: true
                    });
                }
            }
        });

        return {
            text: enhanced.trim(),
            corrections
        };
    }

    check(text) {
        // Return grammar analysis without making changes
        const issues = [];
        
        // Check for common grammar issues
        if (/\s+[,.!?;:]/.test(text)) {
            issues.push({ type: 'punctuation_spacing', message: 'Extra space before punctuation' });
        }
        
        if (/^[a-z]/.test(text.trim())) {
            issues.push({ type: 'capitalization', message: 'Text should start with capital letter' });
        }
        
        return { issues, hasIssues: issues.length > 0 };
    }
}

class SpellChecker {
    constructor() {
        // Simple word list for basic spell checking
        this.commonWords = new Set([
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
            'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
            'but', 'his', 'by', 'from', 'they', 'she', 'or', 'an', 'will', 'my',
            'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
            'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make',
            'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people',
            'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
            'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
            'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
            'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give',
            'day', 'most', 'us'
        ]);
    }

    check(text) {
        const words = text.match(/\b\w+\b/g) || [];
        const corrections = [];
        const misspelled = [];
        
        words.forEach(word => {
            const lowerWord = word.toLowerCase();
            if (word.length > 2 && !this.commonWords.has(lowerWord) && !this.isProperNoun(word)) {
                const suggestion = this.suggest(lowerWord);
                if (suggestion && suggestion !== lowerWord) {
                    corrections.push({
                        original: word,
                        suggestion: this.preserveCase(word, suggestion),
                        confidence: 0.7
                    });
                    misspelled.push(word);
                }
            }
        });

        let correctedText = text;
        corrections.forEach(correction => {
            const regex = new RegExp(`\\b${correction.original}\\b`, 'g');
            correctedText = correctedText.replace(regex, correction.suggestion);
        });

        return {
            correctedText,
            corrections,
            misspelledWords: misspelled
        };
    }

    suggest(word) {
        // Simple suggestion algorithm - in production would use more sophisticated methods
        const suggestions = {
            'teh': 'the',
            'recieve': 'receive',
            'seperate': 'separate',
            'definately': 'definitely',
            'occured': 'occurred',
            'accomodate': 'accommodate'
        };
        
        return suggestions[word] || null;
    }

    isProperNoun(word) {
        return /^[A-Z][a-z]/.test(word);
    }

    preserveCase(original, suggestion) {
        if (original === original.toUpperCase()) {
            return suggestion.toUpperCase();
        }
        if (original[0] === original[0].toUpperCase()) {
            return suggestion.charAt(0).toUpperCase() + suggestion.slice(1).toLowerCase();
        }
        return suggestion.toLowerCase();
    }
}

class ReadabilityAnalyzer {
    calculateScore(text) {
        // Simplified Flesch Reading Ease score
        const words = text.split(/\s+/).length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
        const syllables = this.countTotalSyllables(text);
        
        if (sentences === 0 || words === 0) return 0;
        
        const avgWordsPerSentence = words / sentences;
        const avgSyllablesPerWord = syllables / words;
        
        const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    analyze(text) {
        const score = this.calculateScore(text);
        let level, description;
        
        if (score >= 90) {
            level = 'very_easy';
            description = 'Very easy to read';
        } else if (score >= 80) {
            level = 'easy';
            description = 'Easy to read';
        } else if (score >= 70) {
            level = 'fairly_easy';
            description = 'Fairly easy to read';
        } else if (score >= 60) {
            level = 'standard';
            description = 'Standard reading level';
        } else if (score >= 50) {
            level = 'fairly_difficult';
            description = 'Fairly difficult to read';
        } else if (score >= 30) {
            level = 'difficult';
            description = 'Difficult to read';
        } else {
            level = 'very_difficult';
            description = 'Very difficult to read';
        }
        
        return {
            score,
            level,
            description,
            metrics: {
                words: text.split(/\s+/).length,
                sentences: text.split(/[.!?]+/).filter(s => s.trim()).length,
                syllables: this.countTotalSyllables(text)
            }
        };
    }

    countTotalSyllables(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        return words.reduce((total, word) => total + this.countWordSyllables(word), 0);
    }

    countWordSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        
        const vowels = 'aeiouy';
        let syllableCount = 0;
        let previousWasVowel = false;
        
        for (let i = 0; i < word.length; i++) {
            const isVowel = vowels.includes(word[i]);
            if (isVowel && !previousWasVowel) {
                syllableCount++;
            }
            previousWasVowel = isVowel;
        }
        
        if (word.endsWith('e') && syllableCount > 1) {
            syllableCount--;
        }
        
        return Math.max(1, syllableCount);
    }
}