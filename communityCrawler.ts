import { crawlCommunityPosts } from './crawler';
import { processForRuliweb } from './siteProcessors';
import { analyzeSentence } from './koalanlpAnalyzer';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { CommunityPost, CrawlOptions } from './types'; // 인터페이스 가져오기

async function analyzePosts(posts: CommunityPost[]): Promise<{ processedData: CommunityPost[], analyzePostData: any[] }> {
    let processedData = processForRuliweb(posts);
    const postData = processedData.map(post => post.data[0]);
    const analyzePostData = await analyzeSentence(postData);
    return { processedData, analyzePostData };
}

function runPythonScript(data: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const pythonProcess: ChildProcessWithoutNullStreams = spawn('python', [__dirname + '\\sentiment_analysis.py'], { stdio: ['pipe', 'pipe', 'pipe'] });

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

export async function ruliwebBestCrawler(date: Date): Promise<CommunityPost[]> {
    let dateMatcherForRuliweb = /(\d{4})\.(\d{2})\.(\d{2}) \((\d{2}):(\d{2}):(\d{2})\)/;
    try {
        const options: CrawlOptions = {
            postListUrl: 'https://bbs.ruliweb.com/best/humor_only/',
            pageQueryParam: 'page',
            selectors: {
                title: '.subject_inner_text',
                postLink: '.title_wrapper',
                author: '.user_view,.nick',
                views: '.user_view ,.user_info',
                upvotes: '.like_value',
                content: '.view_content.autolink',
                commentCount: '.num_txt,.reply_count',
                timestamp: '.user_info,.regdate',
            },
            referenceTime: date,
        };
        const posts = await crawlCommunityPosts(options, dateMatcherForRuliweb);

        const { processedData, analyzePostData } = await analyzePosts(posts);
        const results = await runPythonScript(analyzePostData);

        processedData.forEach((post, index) => {
            post.data2 = results[index];
        });

        return processedData;
    } catch (error) {
        console.error('Error occurred during crawling:', error);
        throw error;
    }
}

// async function main() {
//     try {
//         const date = new Date('2024-04-15T06:39:40.000Z');
//         let data = await ruliwebBestCrawler(date);
//         console.log("data :", data);
//     } catch (error) {
//         console.error('Error occurred in main:', error);
//     }
// }

// main();
