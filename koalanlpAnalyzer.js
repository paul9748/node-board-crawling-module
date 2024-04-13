import { EUNJEON, OKT } from 'koalanlp/API.js';
import { Tagger, SentenceSplitter } from 'koalanlp/proc.js';
import { initialize } from 'koalanlp/Util.js';



let initialized = false; // 초기화 추적을 위한 플래그

// KoalaNLP가 아직 초기화되지 않았다면 초기화하는 함수
const initializeKoalaNLP = async () => {
    if (!initialized) {
        await initialize({ packages: { OKT: '2.1.4' } });
        //verbose: true
        initialized = true;
    }
};

// 문자열을 형태소로 분석하는 함수
const analyzeSentence = async (texts) => {
    await initializeKoalaNLP(); // KoalaNLP가 초기화되었는지 확인
    let datas = [];
    // const tagger = new Tagger(EUNJEON);

    for (const text of texts) {
        // const tagged = await tagger(text);
        // let data = [];
        // for (const sent of tagged) {
        //     data.push(sent.surfaceString(' '));
        //     // console.log(sent.surfaceString(" "));
        //     // for (const word of sent) {
        //     //     for (const morphemes of word) {
        //     //         data = data + " " + morphemes.getSurface().toString();
        //     //     }
        //     // data.push(word.getSurface().toString());
        //     // }

        // }

        let splitter = new SentenceSplitter(OKT);
        const data = await splitter(text);
        datas.push(data);
    }
    return datas;
};

export { analyzeSentence };
