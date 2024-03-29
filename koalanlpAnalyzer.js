const { KMR, KKMA } = require('koalanlp/API');
const { initialize } = require('koalanlp/Util');
const { Tagger, Parser } = require('koalanlp/proc');

// 문자열을 형태소로 분석하는 함수
async function analyzeMorphemes(text) {
    await initialize({ packages: { KMR: '2.0.4', KKMA: '2.0.4' }, verbose: true });

    let tagger = new Tagger(KKMA);
    let tagged = await tagger(text);
    // for (const sent of tagged) {
    //     console.log(sent.toString());
    // }

    // let parser = new Parser(KKMA);
    // let parsed = await parser(text);
    // for (const sent of parsed) {
    //     console.log(sent.toString());
    //     for (const dep of sent.dependencies) {
    //         console.log(dep.toString());
    //     }
    // }
    const data = [];
    for (const sent of tagged) {
        for (const word of sent) {
            for (const morphemes of word) {
                data.push(morphemes.getSurface().toString());
            }
        }
    }

    return data;
}

module.exports = { analyzeMorphemes };
