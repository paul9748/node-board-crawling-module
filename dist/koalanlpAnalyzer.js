const { EUNJEON, OKT } = require('koalanlp/API.js');
const { Tagger, SentenceSplitter } = require('koalanlp/proc.js');
const { initialize } = require('koalanlp/Util.js');

let initialized = false;

const initializeKoalaNLP = async () => {
    if (!initialized) {
        await initialize({ packages: { OKT: '2.1.4' } });
        initialized = true;
    }
};

const analyzeSentence = async (texts) => {
    await initializeKoalaNLP();
    let datas = [];

    for (const text of texts) {
        let splitter = new SentenceSplitter(OKT);
        const data = await splitter(text);
        datas.push(data);
    }
    return datas;
};

module.exports = { analyzeSentence };
