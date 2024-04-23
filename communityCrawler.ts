import { crawlCommunityPosts } from './crawler';
import { processCommunityPosts } from './siteProcessors';
import { analyzeSentence } from './koalanlpAnalyzer';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { CommunityPost, CrawlOptions, ProcessingOptions } from './types';

async function analyzePosts(posts: CommunityPost[], options: ProcessingOptions): Promise<{ processedData: CommunityPost[], analyzePostData: any[] }> {
    const processedData = processCommunityPosts(posts, options);
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
            options: {
                timestamp: /(\d{4})\.(\d{2})\.(\d{2}) \((\d{2}):(\d{2}):(\d{2})\)/,
                views: /조회\s+(\d+)/,
            },
            referenceTime: date,
        };
        const posts = await crawlCommunityPosts(options);
        const { processedData, analyzePostData } = await analyzePosts(posts, options.options);
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
