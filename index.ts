import { crawlCommunityPosts } from './crawler.ts';
import { processForRuliweb } from './siteProcessors.ts';
import { analyzeSentence } from './koalanlpAnalyzer.js';
import { CommunityPost } from './types.ts';
import { exit } from 'process';
import { exec, execFile, spawn } from 'child_process';
async function main() {
    // let text = "안녕하세요. 눈이 오는 설날 아침입니다. 좋습니다.";
    // let morphemes = await analyzeMorphemes([text]);
    // console.log(morphemes);
    // text = "안녕하세요. 두번째 테스트 입니다. 좋습니다.";
    // morphemes = await analyzeMorphemes([text]);
    // console.log(morphemes);
    crawlCommunityPosts({
        postListUrl: 'https://bbs.ruliweb.com/best/humor_only/',
        pageQueryParam: 'page',
        selectors: {
            title: '.subject_inner_text',
            postLink: '.title_wrapper',
            author: '.user_view,.nick',
            views: '.user_view ,.user_info',
            upvotes: '.user_view,.like',
            content: '.view_content.autolink',
            commentCount: '.num_txt,.reply_count',
            timestamp: '.user_info,.regdate',
        },
        referenceTime: new Date('2024-04-11T08:21:32.000Z')
    })
        .then(async posts => {
            let processedData = processForRuliweb(posts);
            // 배열의 각 요소에 대해 analyzeMorphemes를 실행하여 data 속성에 결과를 추가
            const postData = processedData.map(post => post.data[0]);
            const analyzePostData = await analyzeSentence(postData);
            // console.log(analyzePostData);
            // console.log("analyzePostData:", JSON.stringify(analyzePostData));

            console.log(analyzePostData)
            const pythonProcess = spawn('python', ['sentiment_analysis.py'], { stdio: ['pipe', 'pipe', 'pipe'] });
            pythonProcess.stdin.write(JSON.stringify(analyzePostData));
            pythonProcess.stdin.end();

            let stdoutHandled = false; // stdout 이벤트 핸들러 실행 여부를 나타내는 플래그 변수
            pythonProcess.stdout.setEncoding('utf-8');
            pythonProcess.stdout.on('data', (data) => {
                if (!stdoutHandled) { // 이벤트 핸들러가 실행되지 않은 경우에만 실행
                    const decodedStdout = data.toString('utf-8');
                    const results = JSON.parse(decodedStdout);
                    // console.log(`stdout: ${JSON.stringify(results)}`);
                    processedData.forEach((post, index) => {
                        post.data2 = (results[index]);
                    });
                    console.log(processedData);
                    stdoutHandled = true; // 플래그 변수를 true로 설정하여 이후 이벤트 핸들러 실행을 방지
                }
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error(`stderr: ${data}`);
            });

            pythonProcess.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
            });


            // Python 스크립트의 출력(JSON)을 파싱
            // const results = JSON.parse(stdout);
            // console.log("results: " + results);
            // // 각 결과를 해당 CommunityPost의 data2에 저장

        })
        .catch(error => {
            console.error('Error occurred during crawling:', error);
        });

}
main();
// exit();
