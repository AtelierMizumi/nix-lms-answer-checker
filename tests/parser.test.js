/**
 * Unit tests for Parser module
 * Tests answer extraction from API responses
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Parser } from '../src/parser.js';
import {
    type7SingleChoiceResponse,
    type7TextInputResponse,
    type3OrderingResponse,
    standardMultipleChoiceResponse,
    type5MatchingResponse
} from './fixtures/responses.js';

describe('Parser', () => {
    describe('cleanHtml', () => {
        it('should strip HTML tags and return plain text', () => {
            const result = Parser.cleanHtml('<p>Hello <strong>World</strong></p>');
            expect(result).toBe('Hello World');
        });

        it('should handle empty input', () => {
            expect(Parser.cleanHtml('')).toBe('');
            expect(Parser.cleanHtml(null)).toBe('');
            expect(Parser.cleanHtml(undefined)).toBe('');
        });

        it('should trim whitespace', () => {
            const result = Parser.cleanHtml('  <p>  Text  </p>  ');
            expect(result).toBe('Text');
        });
    });

    describe('processQuestion - Type 7 Single Choice', () => {
        it('should extract correct answer from single-choice dropdown', () => {
            const { question, expectedAnswer } = type7SingleChoiceResponse;
            const result = Parser.processQuestion(question);

            expect(result).not.toBeNull();
            expect(result.type).toBe(7);
            expect(result.answers).toHaveLength(1);
            expect(result.answers[0].content).toBe(expectedAnswer.content);
            expect(result.answers[0].type).toBe('dropdown-choice');
            expect(result.answers[0].correctIndex).toBe(expectedAnswer.correctIndex);
        });

        it('should include all options for reference', () => {
            const { question } = type7SingleChoiceResponse;
            const result = Parser.processQuestion(question);

            expect(result.answers[0].allOptions).toHaveLength(10);
            expect(result.answers[0].allOptions[0]).toBe(
                '見えにくい問題や必要な項目をすべて調べてリストアップすること。'
            );
        });
    });

    describe('processQuestion - Type 7 Text Input', () => {
        it('should extract text answers for fill-in-the-blank', () => {
            const { question, expectedAnswers } = type7TextInputResponse;
            const result = Parser.processQuestion(question);

            expect(result).not.toBeNull();
            expect(result.type).toBe(7);
            expect(result.answers).toHaveLength(2);
            expect(result.answers[0].content).toBe(expectedAnswers[0].content);
            expect(result.answers[0].type).toBe('text');
            expect(result.answers[1].content).toBe(expectedAnswers[1].content);
        });
    });

    describe('processQuestion - Type 3 Ordering', () => {
        it('should extract ordering answers with target indices', () => {
            const { question, expectedAnswers } = type3OrderingResponse;
            const result = Parser.processQuestion(question);

            expect(result).not.toBeNull();
            expect(result.type).toBe(3);
            expect(result.answers).toHaveLength(5);

            expectedAnswers.forEach((expected, i) => {
                expect(result.answers[i].content).toBe(expected.content);
                expect(result.answers[i].targetIndex).toBe(expected.targetIndex);
            });
        });
    });

    describe('processQuestion - Standard Multiple Choice', () => {
        it('should extract only correct answers', () => {
            const { question, expectedAnswer } = standardMultipleChoiceResponse;
            const result = Parser.processQuestion(question);

            expect(result).not.toBeNull();
            expect(result.type).toBe(1);
            expect(result.answers).toHaveLength(1);
            expect(result.answers[0].content).toBe(expectedAnswer.content);
            expect(result.answers[0].type).toBe('choice');
        });

        it('should not include incorrect answers', () => {
            const { question } = standardMultipleChoiceResponse;
            const result = Parser.processQuestion(question);

            const incorrectOptions = ['Option A', 'Option C', 'Option D'];
            result.answers.forEach(ans => {
                expect(incorrectOptions).not.toContain(ans.content);
            });
        });
    });

    describe('processQuestion - Type 5 Matching', () => {
        it('should extract question-answer pairs', () => {
            const { question, expectedAnswers } = type5MatchingResponse;
            const result = Parser.processQuestion(question);

            expect(result).not.toBeNull();
            expect(result.type).toBe(5);
            expect(result.answers).toHaveLength(3);

            expectedAnswers.forEach((expected, i) => {
                expect(result.answers[i].question).toBe(expected.question);
                expect(result.answers[i].answer).toBe(expected.answer);
            });
        });
    });

    describe('parseResponse', () => {
        it('should process multiple questions', () => {
            const mockResponse = {
                questions: [standardMultipleChoiceResponse.question, type7SingleChoiceResponse.question]
            };

            const results = Parser.parseResponse(mockResponse);

            expect(results).toHaveLength(2);
            expect(results[0].type).toBe(1);
            expect(results[1].type).toBe(7);
        });

        it('should filter out questions with no answers', () => {
            const mockResponse = {
                questions: [
                    { id: 1, type: 1, order: 1, title: 'Empty', answers: [] },
                    standardMultipleChoiceResponse.question
                ]
            };

            const results = Parser.parseResponse(mockResponse);

            expect(results).toHaveLength(1);
        });

        it('should handle empty response', () => {
            expect(Parser.parseResponse(null)).toEqual([]);
            expect(Parser.parseResponse({})).toEqual([]);
            expect(Parser.parseResponse({ questions: [] })).toEqual([]);
        });
    });
});
