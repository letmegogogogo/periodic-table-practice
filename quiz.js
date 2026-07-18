const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const normalize=s=>String(s||'').trim().toLowerCase().replace(/臺/g,'台');
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const STORE_KEY='elementExplorerMistakesV1';
let state={mode:'nameToSymbol',questions:[],index:0,correct:0,wrong:0,answered:false};
let lastMode='nameToSymbol';

function getMistakes(){try{return JSON.parse(localStorage.getItem(STORE_KEY)||'[]')}catch{return[]}}
function addMistake(element,type){const list=getMistakes(),key=element.number+'-'+type;const old=list.find(x=>x.key===key);if(old)old.times=(old.times||1)+1;else list.push({key,number:element.number,type,times:1});localStorage.setItem(STORE_KEY,JSON.stringify(list.slice(-100)))}
function removeMistake(number,type){const list=getMistakes().filter(x=>!(x.number===number&&x.type===type));localStorage.setItem(STORE_KEY,JSON.stringify(list))}
function updateMistakeUI(){const n=getMistakes().length;$('#headerStats strong').textContent=n;$('#mistakeText').textContent=n?`有 ${n} 個重點等待你再次挑戰。`:'目前沒有錯題，繼續保持！'}
function selectedCount(){return +($('input[name="count"]:checked')?.value||10)}
function getPool(){const v=$('#rangeSelect').value;if(v==='first20')return elements.slice(0,20);if(v==='metal')return elements.filter(e=>METAL_CATEGORIES.includes(e.category));if(v==='nonmetal')return elements.filter(e=>['非金屬','鹵素','類金屬'].includes(e.category));if(v==='noble')return elements.filter(e=>e.category==='惰性氣體');if(v==='all')return elements;if(v==='custom'){const ids=$$('#customElements input:checked').map(x=>+x.value);return elements.filter(e=>ids.includes(e.number))}return elements.filter(e=>JUNIOR_NUMBERS.includes(e.number))}
function showView(id){$$('.view').forEach(v=>v.classList.remove('active'));$('#'+id).classList.add('active');scrollTo({top:0,behavior:'smooth'})}

const conceptBank=[
 {q:'原子序主要代表原子中的哪一項數量？',a:'質子數',o:['質子數','中子數','電子層數','原子核大小'],why:'同一元素的原子都有相同的質子數；原子序就是質子數。'},
 {q:'元素符號的第一個英文字母應該如何書寫？',a:'大寫',o:['大寫','小寫','斜體','沒有規定'],why:'元素符號的第一個字母一定大寫，第二個字母若有則小寫。'},
 {q:'下列何者屬於惰性氣體？',a:'氖（Ne）',o:['氖（Ne）','氯（Cl）','氧（O）','氮（N）'],why:'氖位於週期表第 18 族，是惰性氣體。'},
 {q:'下列哪一組元素在常溫常壓下都是氣體？',a:'氫、氮、氧',o:['氫、氮、氧','鐵、銅、鋁','碳、硫、磷','鈉、鎂、鈣'],why:'氫、氮與氧在常溫常壓下皆為氣體。'},
 {q:'同一族的元素在週期表上如何排列？',a:'同一直行',o:['同一直行','同一橫列','同一斜線','依中文筆畫'],why:'週期表的直行稱為族，橫列稱為週期。'},
 {q:'同一週期的元素在週期表上如何排列？',a:'同一橫列',o:['同一橫列','同一直行','同一顏色','相同原子序'],why:'週期表的橫列稱為週期。'},
 {q:'下列何者是元素，而不是化合物？',a:'氧氣',o:['氧氣','水','食鹽','二氧化碳'],why:'氧氣只由氧元素組成；其餘選項都含兩種以上元素。'},
 {q:'元素與化合物的主要差異是什麼？',a:'元素只含一種原子，化合物含兩種以上元素',o:['元素只含一種原子，化合物含兩種以上元素','元素一定是固體','化合物不能分解','元素一定能導電'],why:'元素由同種原子組成，化合物由不同元素以固定比例結合。'},
 {q:'製造電線時，常利用銅的哪一項性質？',a:'良好導電性',o:['良好導電性','容易碎裂','不會傳熱','常溫為氣體'],why:'銅有良好的導電性與延展性，適合製成電線。'},
 {q:'鋁常被製成鋁罐，主要因為它具有什麼特性？',a:'質量輕且易加工',o:['質量輕且易加工','常溫為液體','完全不導熱','是惰性氣體'],why:'鋁密度小、容易加工，表面氧化膜也能提供保護。'},
 {q:'人體呼吸最直接需要下列哪一種元素？',a:'氧',o:['氧','氖','金','矽'],why:'細胞呼吸需要氧氣釋放能量。'},
 {q:'下列哪一個元素符號的大小寫正確？',a:'Na',o:['Na','NA','na','nA'],why:'第一個字母大寫，第二個字母小寫，所以鈉是 Na。'}
];

function makeElementQuestion(e,mode){
 if(mode==='nameToSymbol')return{element:e,type:mode,q:`「${e.name}」的元素符號是什麼？`,a:e.symbol};
 if(mode==='symbolToName')return{element:e,type:mode,q:`元素符號「${e.symbol}」的中文名稱是什麼？`,a:e.name};
 const answer=e.symbol,others=shuffle(elements.filter(x=>x.number!==e.number)).slice(0,3).map(x=>x.symbol);
 return{element:e,type:'choiceElement',q:`下列哪一個是「${e.name}」的元素符號？`,a:answer,o:shuffle([answer,...others]),why:`${e.name}的元素符號是 ${e.symbol}，原子序為 ${e.number}。`};
}
function makeQuestions(mode,pool,count){
 if(mode==='choice'){const generated=pool.map(e=>makeElementQuestion(e,'choice')),concepts=conceptBank.map(q=>({...q,type:'concept'})),bank=[...generated,...concepts];return Array.from({length:count},(_,i)=>({...bank[i%bank.length],o:shuffle([...(bank[i%bank.length].o||[])])})).sort(()=>Math.random()-.5)}
 return Array.from({length:count},(_,i)=>makeElementQuestion(pool[i%pool.length],mode));
}
function startMode(mode){
 if(mode==='table'){lastMode=mode;showView('tableView');PeriodicTable.generate(getPool().length?getPool():elements.slice(0,20));return}
 let pool=getPool();
 if(mode==='mistakes'){const saved=getMistakes();if(!saved.length){alert('錯題本目前是空的，先去完成幾題練習吧！');return}pool=saved.map(x=>elements[x.number-1]).filter(Boolean);mode='mistakes'}
 if(!pool.length){alert('請至少選擇一個元素。');return}
 lastMode=mode;state={mode,questions:mode==='mistakes'?shuffle(getMistakes().map(m=>makeElementQuestion(elements[m.number-1],m.type==='symbolToName'?'symbolToName':'nameToSymbol'))).slice(0,selectedCount()):shuffle(makeQuestions(mode,pool,selectedCount())),index:0,correct:0,wrong:0,answered:false};
 if(!state.questions.length)return;showView('quizView');renderQuestion();
}
function renderQuestion(){
 const q=state.questions[state.index];state.answered=false;$('#feedback').hidden=true;$('#checkBtn').hidden=false;$('#nextBtn').hidden=true;
 const labels={nameToSymbol:'名稱 → 符號',symbolToName:'符號 → 名稱',choice:'國中自然選擇題',mistakes:'錯題重新練習'};$('#quizModeLabel').textContent=labels[state.mode]||'元素練習';$('#questionTag').textContent=q.type==='concept'?'觀念題':q.type?.includes('choice')?'選擇題':q.type==='symbolToName'?'元素名稱':'元素符號';$('#questionText').textContent=q.q;
 $('#progressText').textContent=`第 ${state.index+1} / ${state.questions.length} 題`;$('#scoreText').textContent=`正確 ${state.correct}　錯誤 ${state.wrong}`;$('#progressBar').style.width=`${(state.index+1)/state.questions.length*100}%`;
 const area=$('#answerArea');
 if(q.o){area.innerHTML=`<div class="choice-list">${q.o.map((o,i)=>`<button class="choice-option" data-answer="${o.replace(/"/g,'&quot;')}"><b>${String.fromCharCode(65+i)}.</b> ${o}</button>`).join('')}</div>`;$$('.choice-option').forEach(b=>b.onclick=()=>{if(state.answered)return;$$('.choice-option').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')})}
 else{area.innerHTML='<input class="answer-input" id="answerInput" autocomplete="off" aria-label="輸入答案" placeholder="在這裡輸入答案">';$('#answerInput').focus();$('#answerInput').onkeydown=e=>{if(e.key==='Enter')state.answered?nextQuestion():checkAnswer()}}
}
function checkAnswer(){
 if(state.answered)return;const q=state.questions[state.index];const chosen=q.o?$('.choice-option.selected')?.dataset.answer:$('#answerInput')?.value;if(!chosen){alert('請先選擇或輸入答案。');return}
 const ok=normalize(chosen)===normalize(q.a);state.answered=true;ok?state.correct++:state.wrong++;
 if(q.o)$$('.choice-option').forEach(b=>{if(normalize(b.dataset.answer)===normalize(q.a))b.classList.add('correct');else if(b.classList.contains('selected'))b.classList.add('wrong')});
 const f=$('#feedback');f.hidden=false;f.className='feedback '+(ok?'correct':'wrong');
 const e=q.element;f.innerHTML=`<strong>${ok?'✓ 回答正確！':'✕ 回答錯誤，正確答案是 '+q.a}</strong>${e?`<div class="detail"><span>元素名稱：${e.name}（${e.zhuyin}）</span><span>原子序：${e.number}</span><span>分類：${e.category}</span><span>常見用途：${e.use}</span></div>`:q.why?`<div class="detail"><span>${q.why}</span></div>`:''}`;
 if(e){if(ok&&state.mode==='mistakes')removeMistake(e.number,q.type);if(!ok)addMistake(e,q.type)}
 $('#scoreText').textContent=`正確 ${state.correct}　錯誤 ${state.wrong}`;$('#checkBtn').hidden=true;$('#nextBtn').hidden=false;$('#nextBtn').textContent=state.index===state.questions.length-1?'查看結果 →':'下一題 →';updateMistakeUI();
}
function nextQuestion(){if(!state.answered)return;if(++state.index>=state.questions.length)return showResult();renderQuestion()}
function showResult(){const total=state.correct+state.wrong,rate=total?Math.round(state.correct/total*100):0;$('#resultRate').textContent=rate+'%';$('#resultCorrect').textContent=state.correct;$('#resultWrong').textContent=state.wrong;$('#resultTitle').textContent=rate>=90?'元素高手，太厲害了！':rate>=70?'表現不錯，再接再厲！':'完成挑戰，複習後再試！';showView('resultView')}

function initCustom(){const box=$('#customElements');box.innerHTML=elements.map(e=>`<label><input type="checkbox" value="${e.number}" ${JUNIOR_NUMBERS.includes(e.number)?'checked':''}><span>${e.symbol} ${e.name}</span></label>`).join('')}
$$('[data-go-home]').forEach(b=>b.onclick=()=>showView('homeView'));$$('[data-go-mistakes]').forEach(b=>b.onclick=()=>startMode('mistakes'));$$('[data-mode]').forEach(b=>b.onclick=()=>startMode(b.dataset.mode));
$('#rangeSelect').onchange=e=>$('#customPanel').hidden=e.target.value!=='custom';$('#toggleCustom').onclick=()=>{const boxes=$$('#customElements input'),all=boxes.every(x=>x.checked);boxes.forEach(x=>x.checked=!all)};
$('#checkBtn').onclick=checkAnswer;$('#nextBtn').onclick=nextQuestion;$('#retryBtn').onclick=()=>startMode(lastMode);
$('#clearTable').onclick=PeriodicTable.clear;$('#showTable').onclick=()=>PeriodicTable.render(true);$('#newTable').onclick=()=>PeriodicTable.generate(getPool().length?getPool():elements.slice(0,20));$('#checkTable').onclick=PeriodicTable.check;
initCustom();updateMistakeUI();
