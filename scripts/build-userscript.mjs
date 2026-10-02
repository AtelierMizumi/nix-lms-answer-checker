import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourcePath = resolve(root, 'paste-to-console.js');
const outputPath = resolve(root, 'dist/nix-helper.user.js');

const metadata = `// ==UserScript==
// @name         NIX Digital LMS Answer Helper
// @namespace    https://github.com/AtelierMizumi/nix-lms-answer-checker
// @version      2.3.0
// @description  Extract and display answers from NIX Digital LMS quizzes
// @author       AtelierMizumi
// @match        *://digital.nix.edu.vn/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=nix.edu.vn
// @grant        none
// @run-at       document-idle
// @license      MIT
// @homepage     https://github.com/AtelierMizumi/nix-lms-answer-checker
// @supportURL   https://github.com/AtelierMizumi/nix-lms-answer-checker/issues
// @updateURL    https://raw.githubusercontent.com/AtelierMizumi/nix-lms-answer-checker/main/dist/nix-helper.user.js
// @downloadURL  https://raw.githubusercontent.com/AtelierMizumi/nix-lms-answer-checker/main/dist/nix-helper.user.js
// ==/UserScript==

`;

const bookmarkletPath = resolve(root, 'dist/nix-helper.bookmarklet.js');
const bookmarkletCode = `javascript:(async()=>{if(window.__NIX_LMS_HELPER_INITIALIZED__){if(!document.getElementById('nix-helper-root')&&typeof window.__NIX_LMS_HELPER_REOPEN__==='function'){window.__NIX_LMS_HELPER_REOPEN__();}return;}try{const r=await fetch('https://raw.githubusercontent.com/AtelierMizumi/nix-lms-answer-checker/main/dist/nix-helper.user.js');const t=await r.text();const s=document.createElement('script');s.textContent=t;document.documentElement.appendChild(s);s.remove();}catch(e){console.error('NIX Helper failed to load:',e);}})();\n`;

const source = await readFile(sourcePath, 'utf8');
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${metadata}${source}`, 'utf8');
await writeFile(bookmarkletPath, bookmarkletCode, 'utf8');
console.log(`Built ${outputPath}`);
console.log(`Built ${bookmarkletPath}`);
