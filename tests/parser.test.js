/**
 * Unit tests for Parser module
 * Tests answer extraction from API responses
 */
import { describe, it, expect } from 'vitest';
import { Parser } from '../src/parser.js';
import {
    type7SingleChoiceResponse,
    type7TextInputResponse,
    type3OrderingResponse,
    type3DraggableResponse,
    type4DragPositionResponse,
    standardMultipleChoiceResponse,
    multipleCorrectResponse,
    imageAnswerResponse,
    type5MatchingResponse,
    type5MatchingAnswersResponse,
    emptyResponse,
    noAnswersResponse
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

        it('should handle nested HTML tags', () => {
            const result = Parser.cleanHtml('<div><span><b>Deep</b> <i>nesting</i></span></div>');
            expect(result).toBe('Deep nesting');
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
        it('should extract ordering answers with target indices (JSON format)', () => {
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

        it('should extract ordering answers with draggable_answer format', () => {
            const { question, expectedAnswers } = type3DraggableResponse;
            const result = Parser.processQuestion(question);

            expect(result).not.toBeNull();
            expect(result.type).toBe(3);
            expect(result.answers).toHaveLength(4);

            expectedAnswers.forEach((expected, i) => {
                expect(result.answers[i].content).toBe(expected.content);
                expect(result.answers[i].targetIndex).toBe(expected.targetIndex);
            });
        });

        it('should have drag-order type for Type 3 answers', () => {
            const { question } = type3OrderingResponse;
            const result = Parser.processQuestion(question);

            result.answers.forEach(ans => {
                expect(ans.type).toBe('drag-order');
            });
        });
    });

    describe('processQuestion - Type 4 Drag Position', () => {
        it('should extract coordinates from drag position questions', () => {
            const { wrapper, expectedAnswers } = type4DragPositionResponse;
            const result = Parser.processQuestion(wrapper.question, wrapper, 0);

            expect(result).not.toBeNull();
            expect(result.type).toBe(4);
            expect(result.answers).toHaveLength(3);

            expectedAnswers.forEach((expected, i) => {
                expect(result.answers[i].content).toBe(expected.content);
                expect(result.answers[i].coordinates.x).toBe(expected.coordinates.x);
                expect(result.answers[i].coordinates.y).toBe(expected.coordinates.y);
                expect(result.answers[i].order).toBe(expected.order);
            });
        });

        it('should have drag-position type for Type 4 answers', () => {
            const { wrapper } = type4DragPositionResponse;
            const result = Parser.processQuestion(wrapper.question, wrapper, 0);

            result.answers.forEach(ans => {
                expect(ans.type).toBe('drag-position');
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

        it('should include rawHtml and answerId for matching', () => {
            const { question } = standardMultipleChoiceResponse;
            const result = Parser.processQuestion(question);

            expect(result.answers[0].rawHtml).toBe('<p>Option B</p>');
            expect(result.answers[0].answerId).toBe(201);
        });
    });

    describe('processQuestion - Multiple Correct Answers', () => {
        it('should extract all correct answers for checkbox questions', () => {
            const { question, expectedAnswers } = multipleCorrectResponse;
            const result = Parser.processQuestion(question);

            expect(result).not.toBeNull();
            expect(result.type).toBe(2);
            expect(result.answers).toHaveLength(3);

            const contents = result.answers.map(a => a.content);
            expectedAnswers.forEach(expected => {
                expect(contents).toContain(expected);
            });
        });
    });

    describe('processQuestion - Image Answers', () => {
        it('should detect image-based answers', () => {
            const { question, expectedAnswer } = imageAnswerResponse;
            const result = Parser.processQuestion(question);

            expect(result).not.toBeNull();
            expect(result.answers).toHaveLength(1);
            expect(result.answers[0].isImage).toBe(expectedAnswer.isImage);
            expect(result.answers[0].correctIndex).toBe(expectedAnswer.correctIndex);
        });

        it('should preserve rawHtml for image matching', () => {
            const { question } = imageAnswerResponse;
            const result = Parser.processQuestion(question);

            expect(result.answers[0].rawHtml).toContain('<img');
            expect(result.answers[0].rawHtml).toContain('b.png');
        });
    });

    describe('processQuestion - Type 5 Matching', () => {
        it('should extract question-answer pairs (simple format)', () => {
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

        it('should extract question-answer pairs (matching_answers format)', () => {
            const { question, expectedAnswers } = type5MatchingAnswersResponse;
            const result = Parser.processQuestion(question);

            expect(result).not.toBeNull();
            expect(result.type).toBe(5);
            expect(result.answers).toHaveLength(3);

            expectedAnswers.forEach((expected, i) => {
                expect(result.answers[i].question).toBe(expected.question);
                expect(result.answers[i].answer).toBe(expected.answer);
            });
        });

        it('should have match type for Type 5 answers', () => {
            const { question } = type5MatchingResponse;
            const result = Parser.processQuestion(question);

            result.answers.forEach(ans => {
                expect(ans.type).toBe('match');
            });
        });
    });

    describe('parse - Full API Response', () => {
        it('should parse complete API response with questions wrapper', () => {
            const apiResponse = {
                questions: [
                    { question: standardMultipleChoiceResponse.question },
                    { question: type7SingleChoiceResponse.question }
                ]
            };

            const results = Parser.parse(apiResponse);

            expect(results).toHaveLength(2);
            expect(results[0].type).toBe(1);
            expect(results[1].type).toBe(7);
        });

        it('should handle JSON string input', () => {
            const apiResponse = {
                questions: [{ question: standardMultipleChoiceResponse.question }]
            };

            const results = Parser.parse(JSON.stringify(apiResponse));

            expect(results).toHaveLength(1);
        });

        it('should assign correct order based on index when question has no order', () => {
            const questionWithoutOrder = {
                id: 1,
                type: 1,
                title: 'Test',
                answers: [{ content: 'A', correct: 1 }]
            };
            const apiResponse = {
                questions: [{ question: questionWithoutOrder }, { question: { ...questionWithoutOrder, id: 2 } }]
            };

            const results = Parser.parse(apiResponse);

            expect(results[0].order).toBe(1);
            expect(results[1].order).toBe(2);
        });

        it('should use question order if provided', () => {
            const apiResponse = {
                questions: [
                    { question: standardMultipleChoiceResponse.question }, // order: 1
                    { question: type7SingleChoiceResponse.question } // order: 35
                ]
            };

            const results = Parser.parse(apiResponse);

            expect(results[0].order).toBe(1);
            expect(results[1].order).toBe(35);
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
                questions: [noAnswersResponse.question, standardMultipleChoiceResponse.question]
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

    describe('Edge Cases', () => {
        it('should return null for question with no valid answers', () => {
            const result = Parser.processQuestion(noAnswersResponse.question);
            expect(result).toBeNull();
        });

        it('should handle malformed JSON content gracefully', () => {
            const malformedQuestion = {
                id: 1,
                type: 7,
                order: 1,
                title: 'Test',
                answers: [{ id: 1, content: 'not valid json' }]
            };

            const result = Parser.processQuestion(malformedQuestion);
            expect(result).toBeNull();
        });

        it('should handle missing fields gracefully', () => {
            const minimalQuestion = {
                id: 1,
                type: 1,
                answers: [{ content: '<p>Answer</p>', correct: 1 }]
            };

            const result = Parser.processQuestion(minimalQuestion);
            expect(result).not.toBeNull();
            expect(result.title).toBe('');
        });

        it('should return empty array for invalid JSON string in parse', () => {
            const result = Parser.parse('not valid json');
            expect(result).toEqual([]);
        });
    });
});
