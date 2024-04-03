import { crawlCommunityPosts } from './crawler.ts';
import { processForRuliweb } from './siteProcessors.ts';
import { analyzeMorphemes } from './koalanlpAnalyzer.js';
import { CommunityPost } from './types.ts';
import { exit } from 'process';
import parser from 'node-html-parser'

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
            timestamp: '.regdate',
        },
        referenceTime: new Date('2024-04-02T08:42:00.000Z')
    })
        .then(async posts => {
            let processedData = processForRuliweb(posts);
            // 배열의 각 요소에 대해 analyzeMorphemes를 실행하여 data 속성에 결과를 추가
            for (let post of processedData) {
                let morphemes = await analyzeMorphemes([post.data]);
                post.data = morphemes[0]; // analyzeMorphemes가 문자열 배열을 반환하므로 첫 번째 요소를 사용
            }
            console.log(processedData);
        })
        .catch(error => {
            console.error('Error occurred during crawling:', error);
        });

}
main();
// exit();