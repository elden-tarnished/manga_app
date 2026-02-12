import path from "path";
import util from "util";
import fs from "fs";
import stripAnsi from "strip-ansi";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __logDir = path.resolve(__dirname, '../../logs');

const __logPath = path.join(__logDir, `log.log`);
const __errorPath = path.join(__logDir, `error.log`);

fs.mkdirSync(__logDir, {recursive: true})

const logStream = fs.createWriteStream(__logPath, {flags: 'a'});
const errorStream = fs.createWriteStream(__errorPath, {flags: 'a'})

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

export function log(...args) {
    const now = new Date().toUTCString();
    const message = stripAnsi(util.format(...args));
    logStream.write(`[LOG] ${message} - date: ${now}\n`);
    originalConsoleLog.apply(console, args);
};

export function errorLogger(...args) {
    const now = new Date().toUTCString();
    const message = stripAnsi(util.format(...args));
    errorStream.write(`[ERROR] ${message} - date: ${now}\n`);
    originalConsoleError.apply(console, args);
};

export function fixDate (date) {
    if (!date) {
        return null;
    } else if (/^\d{4}-\d{2}$/.test(date)) {
        return date + '-01';
    } else if (/^\d{4}$/.test(date)) {
        return date+'-01-01';
    }else {
        return date;
    }
};

export async function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms) )
};