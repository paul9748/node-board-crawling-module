import { crawlCommunityPosts } from './crawler';
import { processForRuliweb } from './siteProcessors';
import { analyzeMorphemes } from './koalanlpAnalyzer';
async function main() {
    const text = "안녕하세요. 눈이 오는 설날 아침입니다.";
    const morphemes = await analyzeMorphemes(text);
    console.log(morphemes);
    crawlCommunityPosts({
        postListUrl: 'https://bbs.ruliweb.com/best/humor_only/',
        pageQueryParam: 'page',
        selectors: {
            title: '.subject_inner_text',
            postLink: '.title_wrapper',
            author: '.user_view,.nick',
            views: '.user_view ,.user_info',
            upvotes: '.user_view,.like',
            content: '[itemprop="articleBody"]',
            commentCount: '.reply_count',
            timestamp: '.regdate',
        },
        referenceTime: new Date('2024-03-29T07:10:00Z')
    })
        .then(posts => {

            console.log(processForRuliweb(posts));
        })
        .catch(error => {
            console.error('Error occurred during crawling:', error);
        });

}
main();