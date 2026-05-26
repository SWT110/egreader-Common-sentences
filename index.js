const fs = require('fs');
const path = require('path');

const SOURCE_CSV = path.join(__dirname, 'en_top_sentences.csv');
const STATIC_TSV = path.join(__dirname, 'data', 'common_sentences_zh.tsv');
const WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)?/g;
const PROFANITY = /\b(fuck|fucking|fucker|motherfucker|shit|bullshit|bitch|bastard|asshole|goddamn|dammit|damn|crap|dick|piss|whore|slut|cunt|hell)\b/i;
const ARTIFACT = /(==|sync,|corrected by|https?:|www\.|@|©|™|<[^>]+>|\[[^\]]+\]|\{[^}]+\})/i;

const PERSON_NAMES = new Set('john mary michael david james robert william richard charles thomas christopher daniel paul mark george steven edward brian kevin jason matthew frank scott eric andrew raymond gregory joshua jerry dennis walter patrick peter harry henry ryan roger joe jack albert justin terry keith samuel bruce adam fred wayne billy steve louis jeremy aaron randy bobby victor martin phillip todd jesse craig alan shawn sean chris johnny jimmy tom tony jim bob tommy andy simon mike pete max nick ben alex sam will danny eddie sarah emma kate rachel claire amy lucy alice rose emily lisa jane maria anna anne annie julia laura susan linda barbara elizabeth jennifer patricia nancy karen betty helen sandra donna carol sharon michelle nicole samantha victoria olivia sophia mia abigail madison'.split(' '));

const WORD_ZH = Object.freeze({
  i:'我',me:'我',my:'我的',mine:'我的',you:'你',your:'你的',he:'他',him:'他',his:'他的',she:'她',her:'她的',it:'它',its:'它的',we:'我们',us:'我们',our:'我们的',they:'他们',them:'他们',their:'他们的',
  this:'这',that:'那',these:'这些',those:'那些',here:'这里',there:'那里',now:'现在',then:'然后',today:'今天',tomorrow:'明天',tonight:'今晚',morning:'早上',afternoon:'下午',evening:'晚上',night:'晚上',
  please:'请',yes:'是',no:'不',not:'不',okay:'好',ok:'好',yeah:'是啊',yep:'是的',sure:'当然',maybe:'也许',really:'真的',right:'对',wrong:'错',fine:'好',good:'好',great:'很好',bad:'糟糕',nice:'好',perfect:'完美',beautiful:'漂亮',sorry:'抱歉',thanks:'谢谢',thank:'谢谢',welcome:'欢迎',hello:'你好',hi:'嗨',hey:'嘿',bye:'再见',goodbye:'再见',
  sir:'先生',maam:'女士',madam:'女士',man:'伙计',guys:'大家',friend:'朋友',friends:'朋友们',dad:'爸爸',mom:'妈妈',mother:'母亲',father:'父亲',brother:'兄弟',sister:'姐妹',son:'儿子',honey:'亲爱的',baby:'宝贝',doctor:'医生',captain:'队长',chief:'长官',boss:'老板',police:'警察',professor:'教授',president:'总统',
  what:'什么',who:'谁',where:'哪里',when:'什么时候',why:'为什么',how:'怎么',which:'哪一个',can:'能',could:'可以',may:'可以',would:'会',should:'应该',shall:'要',will:'会',do:'做',does:'做',did:'做了',done:'完成',doing:'正在做',am:'是',is:'是',are:'是',was:'是',were:'是',be:'是',been:'一直是',have:'有',has:'有',had:'有',
  get:'得到',got:'得到',go:'去',going:'去',went:'去了',come:'来',coming:'来了',look:'看',see:'看见',watch:'看',listen:'听',hear:'听见',heard:'听见了',say:'说',said:'说了',tell:'告诉',told:'告诉了',talk:'说话',ask:'问',answer:'回答',think:'想',know:'知道',understand:'明白',mean:'意思是',believe:'相信',guess:'猜',remember:'记得',forget:'忘记',promise:'保证',swear:'发誓',love:'爱',like:'喜欢',hate:'讨厌',want:'想要',need:'需要',help:'帮助',try:'试试',find:'找到',wait:'等',stop:'停',start:'开始',move:'动',stay:'待着',leave:'离开',run:'跑',walk:'走',sit:'坐',stand:'站',turn:'转',open:'打开',close:'关闭',put:'放',take:'拿',give:'给',bring:'带来',keep:'保持',hold:'拿着',let:'让',make:'做',work:'工作',call:'打电话',care:'关心',touch:'碰',drive:'开车',eat:'吃',drink:'喝',sleep:'睡觉',
  home:'家',house:'房子',room:'房间',door:'门',car:'车',phone:'电话',money:'钱',time:'时间',day:'天',way:'路',hand:'手',eyes:'眼睛',head:'头',name:'名字',idea:'主意',problem:'问题',fault:'错',truth:'真相',place:'地方',thing:'东西',something:'某事',anything:'任何事',nothing:'没什么',everything:'一切',someone:'某人',anyone:'任何人',everyone:'每个人',all:'全部',much:'很多',many:'很多',more:'更多',one:'一个',two:'两个',three:'三个',four:'四个',five:'五个',six:'六个',seven:'七个',eight:'八个',ten:'十个',first:'第一',last:'最后',next:'下一个',
  back:'回来',away:'离开',out:'出去',in:'进来',up:'向上',down:'向下',off:'离开',on:'开启',over:'结束',again:'再一次',alone:'独自',together:'一起',very:'非常',so:'这么',too:'也',just:'只是',only:'只是',never:'从不',always:'总是',still:'仍然',already:'已经',soon:'很快',later:'稍后',enough:'够了',actually:'其实',probably:'可能',absolutely:'绝对',exactly:'正是',certainly:'当然',definitely:'当然',
  careful:'小心',quiet:'安静',ready:'准备好',serious:'认真',crazy:'疯狂',funny:'好笑',afraid:'害怕',scared:'害怕',hungry:'饿',tired:'累',dead:'死了',alive:'活着',safe:'安全',late:'晚了',important:'重要',true:'真实',cool:'酷',amazing:'惊人',wonderful:'精彩',fantastic:'太棒',incredible:'难以置信',impossible:'不可能',ridiculous:'荒唐',excellent:'优秀',lovely:'可爱',clear:'清楚',easy:'容易',hard:'困难',quick:'快',fast:'快',slow:'慢',big:'大',little:'小',old:'老',new:'新',better:'更好',best:'最好',happy:'开心',sad:'难过',angry:'生气',
  for:'为了',to:'到',from:'从',of:'的',with:'和',without:'没有',about:'关于',at:'在',by:'通过',into:'进入',as:'作为',if:'如果',because:'因为',but:'但是',and:'和',or:'或者',than:'比',a:'一个',an:'一个',the:'这个'
});

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') quoted = !(quoted && line[i + 1] === '"') || (cur += '"', i += 1, false);
    else if (ch === ',' && !quoted) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function normalizeEnglish(value) {
  return String(value || '')
    .toLowerCase().replace(/[’]/g, "'")
    .replace(/\b(what|who|where|how|there|here|that|it)'s\b/g, '$1 is')
    .replace(/\bi'm\b/g, 'i am').replace(/\byou're\b/g, 'you are').replace(/\bhe's\b/g, 'he is').replace(/\bshe's\b/g, 'she is').replace(/\bwe're\b/g, 'we are').replace(/\bthey're\b/g, 'they are')
    .replace(/\bi've\b/g, 'i have').replace(/\bi'll\b/g, 'i will').replace(/\bdon't\b/g, 'do not').replace(/\bdoesn't\b/g, 'does not').replace(/\bdidn't\b/g, 'did not')
    .replace(/\bcan't\b/g, 'can not').replace(/\bcannot\b/g, 'can not').replace(/\bwon't\b/g, 'will not').replace(/\bisn't\b/g, 'is not').replace(/\baren't\b/g, 'are not')
    .replace(/\blet's\b/g, 'let us').replace(/\bgonna\b/g, 'going to').replace(/\bgotta\b/g, 'got to').replace(/\bwanna\b/g, 'want to')
    .replace(/[^a-z0-9'\s]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(sentence) {
  return (String(sentence || '').match(WORD_RE) || []).length;
}

function isPureName(sentence) {
  const words = (String(sentence || '').match(WORD_RE) || []).map((w) => w.toLowerCase());
  return words.length > 1 && words.every((w) => PERSON_NAMES.has(w));
}

function shouldKeep(sentence) {
  const s = String(sentence || '').trim();
  const count = wordCount(s);
  return count >= 2 && count <= 8 && !PROFANITY.test(s) && !ARTIFACT.test(s) && !isPureName(s) && /[A-Za-z]/.test(s);
}

function loadManualTranslations() {
  const map = new Map();
  if (!fs.existsSync(STATIC_TSV)) return map;
  const lines = fs.readFileSync(STATIC_TSV, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const header = lines.shift().split('\t');
  for (const line of lines) {
    const values = line.split('\t');
    const row = Object.fromEntries(header.map((key, i) => [key, values[i] || '']));
    if (row.en && row.zh) map.set(normalizeEnglish(row.en), row.zh);
  }
  return map;
}

function translateTokens(text) {
  return text.split(/\s+/).filter(Boolean).map((token) => WORD_ZH[token] || token).join('');
}

function withPunctuation(zh, en) {
  const core = String(zh || '').replace(/[。！？?!.]*$/, '');
  const end = String(en || '').trim().slice(-1);
  return core + (end === '?' ? '？' : end === '!' ? '！' : '。');
}

function translateSentence(sentence, manual = loadManualTranslations()) {
  const n = normalizeEnglish(sentence);
  if (manual.has(n)) return manual.get(n);
  let m;
  if ((m = n.match(/^what (?:is|are) (.+)$/))) return withPunctuation(`${translateTokens(m[1])}是什么`, sentence);
  if ((m = n.match(/^where (?:is|are) (.+)$/))) return withPunctuation(`${translateTokens(m[1])}在哪里`, sentence);
  if ((m = n.match(/^who (?:is|are) (.+)$/))) return withPunctuation(`${translateTokens(m[1])}是谁`, sentence);
  if ((m = n.match(/^why (.+)$/))) return withPunctuation(`为什么${translateTokens(m[1])}`, sentence);
  if ((m = n.match(/^how (.+)$/))) return withPunctuation(`怎么${translateTokens(m[1])}`, sentence);
  if ((m = n.match(/^do you (.+)$/))) return withPunctuation(`你${translateTokens(m[1])}吗`, sentence);
  if ((m = n.match(/^did you (.+)$/))) return withPunctuation(`你${translateTokens(m[1])}了吗`, sentence);
  if ((m = n.match(/^are you (.+)$/))) return withPunctuation(`你${translateTokens(m[1])}吗`, sentence);
  if ((m = n.match(/^can you (.+)$/))) return withPunctuation(`你能${translateTokens(m[1])}吗`, sentence);
  if ((m = n.match(/^can i (.+)$/))) return withPunctuation(`我可以${translateTokens(m[1])}吗`, sentence);
  if ((m = n.match(/^i am (.+)$/))) return withPunctuation(`我${translateTokens(m[1])}`, sentence);
  if ((m = n.match(/^i do not (.+)$/))) return withPunctuation(`我不${translateTokens(m[1])}`, sentence);
  if ((m = n.match(/^i can not (.+)$/))) return withPunctuation(`我不能${translateTokens(m[1])}`, sentence);
  if ((m = n.match(/^i need (.+)$/))) return withPunctuation(`我需要${translateTokens(m[1])}`, sentence);
  if ((m = n.match(/^i want (.+)$/))) return withPunctuation(`我想要${translateTokens(m[1])}`, sentence);
  if ((m = n.match(/^you are (.+)$/))) return withPunctuation(`你${translateTokens(m[1])}`, sentence);
  if ((m = n.match(/^do not (.+)$/))) return withPunctuation(`不要${translateTokens(m[1])}`, sentence);
  if ((m = n.match(/^let me (.+)$/))) return withPunctuation(`让我${translateTokens(m[1])}`, sentence);
  if ((m = n.match(/^let us (.+)$/))) return withPunctuation(`我们${translateTokens(m[1])}吧`, sentence);
  return withPunctuation(translateTokens(n), sentence);
}

function classify(sentence) {
  const n = normalizeEnglish(sentence);
  if (/\?$/.test(sentence.trim())) return 'question';
  if (/\b(hello|hi|hey|bye|goodbye|morning|good night|good evening|see you|nice to meet you|happy birthday|merry christmas)\b/.test(n)) return 'greeting';
  if (/^(please|let|come|go|get|give|take|look|listen|wait|hold|stay|stop|sit|stand|open|close|turn|move|help|tell|call|watch|keep|try|do not|be careful|trust me|follow me|excuse me)/.test(n)) return 'request';
  if (/!$/.test(sentence.trim()) || /\b(wow|whoa|ouch|oh|ah|yay|bravo|unbelievable|amazing|incredible)\b/.test(n)) return 'emotion';
  if (/\b(yes|no|yeah|yep|okay|ok|sure|thanks|thank|sorry|right|fine|good|got it|i know|i understand|of course|no problem)\b/.test(n)) return 'response';
  return 'common';
}

function categoryZh(category) {
  return ({ question: '疑问句', greeting: '寒暄句', request: '请求句', response: '回应句', emotion: '情绪反应句', common: '日常句' })[category] || '日常句';
}

function loadCommonSentences() {
  if (!fs.existsSync(SOURCE_CSV)) return [];
  const manual = loadManualTranslations();
  const lines = fs.readFileSync(SOURCE_CSV, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const rows = [];
  const seen = new Set();
  for (let i = 1; i < lines.length; i += 1) {
    const [rawSentence, rawCount] = parseCsvLine(lines[i]);
    const en = String(rawSentence || '').trim();
    if (!shouldKeep(en)) continue;
    const key = normalizeEnglish(en);
    if (seen.has(key)) continue;
    seen.add(key);
    const category = classify(en);
    rows.push({
      id: `ecs_${String(rows.length + 1).padStart(5, '0')}`,
      en,
      zh: translateSentence(en, manual),
      category,
      categoryZh: categoryZh(category),
      wordCount: wordCount(en),
      frequency: Number(rawCount) || 0,
      source: 'en_top_sentences.csv',
      sourceLine: i + 1,
    });
  }
  return rows;
}

const commonSentences = loadCommonSentences();

function normalizeSearchText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9'\s\u4e00-\u9fff]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function searchCommonSentences(query = '', options = {}) {
  const q = normalizeSearchText(query);
  const limit = Number.isInteger(options.limit) ? options.limit : 20;
  const category = options.category || null;
  return commonSentences
    .filter((item) => {
      if (category && item.category !== category && item.categoryZh !== category) return false;
      if (!q) return true;
      return normalizeSearchText(item.en).includes(q) || normalizeSearchText(item.zh).includes(q);
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
}

function getSentenceById(id) {
  return commonSentences.find((item) => item.id === id) || null;
}

function getSentencesByCategory(category, limit = 50) {
  return searchCommonSentences('', { category, limit });
}

function toTsv(rows = commonSentences) {
  const header = ['id', 'en', 'zh', 'category', 'categoryZh', 'wordCount', 'frequency', 'source', 'sourceLine'];
  const esc = (value) => String(value ?? '').replace(/[\t\r\n]/g, ' ');
  return [header.join('\t'), ...rows.map((row) => header.map((key) => esc(row[key])).join('\t'))].join('\n') + '\n';
}

function writeStaticData(filePath = STATIC_TSV) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, toTsv(), 'utf8');
  return { filePath, count: commonSentences.length };
}

module.exports = {
  commonSentences,
  searchCommonSentences,
  getSentenceById,
  getSentencesByCategory,
  loadCommonSentences,
  shouldKeep,
  wordCount,
  translateSentence,
  toTsv,
  writeStaticData,
};
