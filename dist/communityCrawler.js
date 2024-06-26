"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Crawler = void 0;
const crawler_1 = require("./crawler");
const siteProcessors_1 = require("./siteProcessors");
const koalanlpAnalyzer_1 = require("./koalanlpAnalyzer");
const child_process_1 = require("child_process");
async function analyzePosts(posts, options) {
    const processedData = (0, siteProcessors_1.processCommunityPosts)(posts, options);
    const postData = processedData.map(post => post.data[0]);
    const analyzePostData = await (0, koalanlpAnalyzer_1.analyzeSentence)(postData);
    return { processedData, analyzePostData };
}
function runPythonScript(data) {
    return new Promise((resolve, reject) => {
        const pythonProcess = (0, child_process_1.spawn)('python', [__dirname + '\\sentiment_analysis.py'], { stdio: ['pipe', 'pipe', 'pipe'] });
        pythonProcess.stdin.write(JSON.stringify(data));
        pythonProcess.stdin.end();
        let stdoutHandled = false;
        pythonProcess.stdout.setEncoding('utf-8');
        pythonProcess.stdout.on('data', (data) => {
            if (!stdoutHandled) {
                const decodedStdout = data.toString('utf-8');
                const results = JSON.parse(decodedStdout);
                resolve(results);
                stdoutHandled = true;
            }
        });
        pythonProcess.stderr.on('data', (data) => {
            reject(new Error(`stderr: ${data}`));
        });
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`child process exited with code ${code}`));
            }
        });
    });
}
async function Crawler(options) {
    try {
        const posts = await (0, crawler_1.crawlCommunityPosts)(options);
        const { processedData, analyzePostData } = await analyzePosts(posts, options.options);
        const results = await runPythonScript(analyzePostData);
        processedData.forEach((post, index) => {
            post.data2 = results[index];
        });
        return processedData;
    }
    catch (error) {
        console.error('Error occurred during crawling:', error);
        throw error;
    }
}
exports.Crawler = Crawler;
//# sourceMappingURL=communityCrawler.js.map