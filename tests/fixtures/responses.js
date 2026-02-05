/**
 * Test fixtures for all question types
 * Based on actual API responses from NIX LMS
 */

/**
 * Type 7 Single-Choice (Dropdown/Radio) questions
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
 * Type 3 - Drag and Drop ordering (JSON content format)
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
 * Type 3 - Drag and Drop ordering (draggable_answer format with placeholders)
 */
export const type3DraggableResponse = {
    question: {
        id: 12350,
        type: 3,
        order: 6,
        title: 'Sắp xếp câu',
        content: '[[1]] [[2]] [[3]] [[4]]',
        answers: [
            {
                id: 201,
                content: '<p>私は</p>',
                draggable_answer: { correct_index: 1, reusable: 0 }
            },
            {
                id: 202,
                content: '<p>学校に</p>',
                draggable_answer: { correct_index: 2, reusable: 0 }
            },
            {
                id: 203,
                content: '<p>毎日</p>',
                draggable_answer: { correct_index: 3, reusable: 0 }
            },
            {
                id: 204,
                content: '<p>行きます</p>',
                draggable_answer: { correct_index: 4, reusable: 0 }
            }
        ]
    },
    expectedAnswers: [
        { content: '私は', targetIndex: 1 },
        { content: '学校に', targetIndex: 2 },
        { content: '毎日', targetIndex: 3 },
        { content: '行きます', targetIndex: 4 }
    ]
};

/**
 * Type 4 - Drag and Drop with coordinates
 */
export const type4DragPositionResponse = {
    wrapper: {
        question: {
            id: 1002,
            type: 4,
            title: 'Kéo các thành phần vào đúng vị trí trên hình',
            content: '<p>Đặt các nhãn vào đúng vị trí trên sơ đồ:</p>',
            answers: [
                {
                    id: 3001,
                    content: 'CPU',
                    draggable_answer: {
                        correct_index: null,
                        reusable: 0,
                        coordinates: [{ x: 150, y: 80 }]
                    }
                },
                {
                    id: 3002,
                    content: 'RAM',
                    draggable_answer: {
                        correct_index: null,
                        reusable: 0,
                        coordinates: [{ x: 280, y: 120 }]
                    }
                },
                {
                    id: 3003,
                    content: 'Hard Drive',
                    draggable_answer: {
                        correct_index: null,
                        reusable: 0,
                        coordinates: [{ x: 200, y: 200 }]
                    }
                }
            ]
        },
        answer_display: '[3001, 3002, 3003]'
    },
    expectedAnswers: [
        { content: 'CPU', coordinates: { x: 150, y: 80 }, order: 0 },
        { content: 'RAM', coordinates: { x: 280, y: 120 }, order: 1 },
        { content: 'Hard Drive', coordinates: { x: 200, y: 200 }, order: 2 }
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
 * Multiple choice with multiple correct answers (checkbox)
 */
export const multipleCorrectResponse = {
    question: {
        id: 12351,
        type: 2,
        order: 2,
        title: 'Chọn tất cả đáp án đúng:',
        answers: [
            { id: 300, content: '<p>HTML</p>', correct: 1 },
            { id: 301, content: '<p>CSS</p>', correct: 1 },
            { id: 302, content: '<p>Photoshop</p>', correct: 0 },
            { id: 303, content: '<p>JavaScript</p>', correct: 1 }
        ]
    },
    expectedAnswers: ['HTML', 'CSS', 'JavaScript']
};

/**
 * Multiple choice with image answer
 */
export const imageAnswerResponse = {
    question: {
        id: 12352,
        type: 1,
        order: 3,
        title: 'Chọn hình đúng:',
        answers: [
            { id: 400, content: '<img src="/images/a.png" alt="A">', correct: 0 },
            { id: 401, content: '<img src="/images/b.png" alt="B">', correct: 1 },
            { id: 402, content: '<img src="/images/c.png" alt="C">', correct: 0 }
        ]
    },
    expectedAnswer: {
        content: '',
        isImage: true,
        correctIndex: 1
    }
};

/**
 * Type 5 - Matching questions (simple format)
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

/**
 * Type 5 - Matching questions (matching_answers format)
 */
export const type5MatchingAnswersResponse = {
    question: {
        id: 12353,
        type: 5,
        order: 16,
        title: 'Nối từ với định nghĩa',
        answers: [
            { id: 500, content: '<p>Dog</p>' },
            { id: 501, content: '<p>Cat</p>' },
            { id: 502, content: '<p>Bird</p>' }
        ],
        matching_answers: [
            { answer_id: 500, answer_matching: 'A loyal pet' },
            { answer_id: 501, answer_matching: 'An independent pet' },
            { answer_id: 502, answer_matching: 'A flying animal' }
        ]
    },
    expectedAnswers: [
        { question: 'Dog', answer: 'A loyal pet' },
        { question: 'Cat', answer: 'An independent pet' },
        { question: 'Bird', answer: 'A flying animal' }
    ]
};

/**
 * Empty/Invalid responses for edge case testing
 */
export const emptyResponse = {
    questions: []
};

export const nullResponse = null;

export const invalidJsonResponse = 'not a valid json';

export const noAnswersResponse = {
    question: {
        id: 99999,
        type: 1,
        order: 1,
        title: 'Question with no answers',
        answers: []
    }
};
