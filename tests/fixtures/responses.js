/**
 * Test fixtures for Type 7 Single-Choice (Dropdown/Radio) questions
 * Based on actual API responses from NIX LMS
 */
export const type7SingleChoiceResponse = {
    question: {
        id: 12345,
        type: 7,
        order: 35,
        title: '[U4P3] - Chọn định nghĩa đúng với từ nghe được 5',
        answers: [
            {
                id: 100,
                content: JSON.stringify({
                    type: 'single-choice',
                    correctAnswerIndex: 0,
                    child_answers: [
                        { content: '見えにくい問題や必要な項目をすべて調べてリストアップすること。' },
                        { content: 'システムなどで基準となる、基本的な情報データのこと。' },
                        { content: '画面や紙などに情報を見えるように出すこと。' },
                        { content: '相手を信頼して、後払いなどの取引を行うこと' },
                        { content: '２つ以上のものを同じにすること。' },
                        { content: 'システムや作業で必要な条件や内容。' },
                        { content: 'ある限られた広さの限界' },
                        { content: '製品やサービスの設計、機能、性能、構造、利用方法などを具体的に使用される。' },
                        { content: 'システムや製品が持っている働き・役割。' },
                        { content: '２つの情報を比べて確認すること。' }
                    ]
                })
            }
        ]
    },
    expectedAnswer: {
        content: '見えにくい問題や必要な項目をすべて調べてリストアップすること。',
        type: 'dropdown-choice',
        correctIndex: 0
    }
};

/**
 * Type 7 with text input (fill in the blank)
 */
export const type7TextInputResponse = {
    question: {
        id: 12346,
        type: 7,
        order: 10,
        title: 'Điền từ vào chỗ trống',
        answers: [
            {
                id: 101,
                content: JSON.stringify({
                    child_answers: [{ content: '東京' }, { content: '大阪' }]
                })
            }
        ]
    },
    expectedAnswers: [
        { content: '東京', order: 1, type: 'text' },
        { content: '大阪', order: 1, type: 'text' }
    ]
};

/**
 * Type 3 - Drag and Drop ordering
 */
export const type3OrderingResponse = {
    question: {
        id: 12347,
        type: 3,
        order: 5,
        title: 'Sắp xếp đúng thứ tự',
        answers: [
            {
                id: 102,
                content: JSON.stringify({
                    child_answers: [
                        { content: '田中さん', target_index: 1 },
                        { content: 'は', target_index: 2 },
                        { content: '会社', target_index: 3 },
                        { content: 'に', target_index: 4 },
                        { content: '行きます', target_index: 5 }
                    ]
                })
            }
        ]
    },
    expectedAnswers: [
        { content: '田中さん', targetIndex: 1 },
        { content: 'は', targetIndex: 2 },
        { content: '会社', targetIndex: 3 },
        { content: 'に', targetIndex: 4 },
        { content: '行きます', targetIndex: 5 }
    ]
};

/**
 * Standard multiple choice question
 */
export const standardMultipleChoiceResponse = {
    question: {
        id: 12348,
        type: 1,
        order: 1,
        title: 'Chọn đáp án đúng:',
        answers: [
            { id: 200, content: '<p>Option A</p>', correct: 0 },
            { id: 201, content: '<p>Option B</p>', correct: 1 },
            { id: 202, content: '<p>Option C</p>', correct: 0 },
            { id: 203, content: '<p>Option D</p>', correct: 0 }
        ]
    },
    expectedAnswer: {
        content: 'Option B',
        type: 'choice'
    }
};

/**
 * Type 5 - Matching questions
 */
export const type5MatchingResponse = {
    question: {
        id: 12349,
        type: 5,
        order: 15,
        title: 'Nối cột A với cột B',
        answers: [
            {
                id: 103,
                content: '<p>おはよう</p>',
                target_answer: '<p>Good morning</p>'
            },
            {
                id: 104,
                content: '<p>こんにちは</p>',
                target_answer: '<p>Hello</p>'
            },
            {
                id: 105,
                content: '<p>さようなら</p>',
                target_answer: '<p>Goodbye</p>'
            }
        ]
    },
    expectedAnswers: [
        { question: 'おはよう', answer: 'Good morning' },
        { question: 'こんにちは', answer: 'Hello' },
        { question: 'さようなら', answer: 'Goodbye' }
    ]
};
