import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                // Browser globals
                window: "readonly",
                document: "readonly",
                console: "readonly",
                navigator: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                Promise: "readonly",
                Event: "readonly",
                MouseEvent: "readonly",
                DragEvent: "readonly",
                DataTransfer: "readonly",
                MutationObserver: "readonly",
                XMLHttpRequest: "readonly",
                Request: "readonly",
                alert: "readonly",
                prompt: "readonly",

                // jQuery (optional)
                "$": "readonly",
                "jQuery": "readonly",

                // Tampermonkey globals
                "GM_setClipboard": "readonly",
                "GM_notification": "readonly",
                "GM_getValue": "readonly",
                "GM_setValue": "readonly",
                "GM_xmlhttpRequest": "readonly"
            }
        },
        rules: {
            // Relaxed rules for userscript development
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }],
            "no-console": "off",
            "semi": ["error", "always"],
            "quotes": ["warn", "single", { "avoidEscape": true }],
            "indent": ["warn", 4, { "SwitchCase": 1 }],
            "no-trailing-spaces": "warn",
            "eol-last": ["warn", "always"],
            "comma-dangle": ["warn", "never"],
            "no-multiple-empty-lines": ["warn", { "max": 2 }],
            "no-var": "warn",
            "prefer-const": "warn"
        }
    },
    {
        ignores: [
            "node_modules/**",
            "dist/**",
            ".git/**"
        ]
    }
];
