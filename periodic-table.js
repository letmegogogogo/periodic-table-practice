const PeriodicTable=(()=>{
  let holes=[],pool=[],mode='find',target=null,correct=0,wrong=0,locked=false;
  const table=()=>document.getElementById('periodicTable');
  const categories=['惰性氣體','鹼金屬','鹼土金屬','鹵素','過渡金屬','非金屬','類金屬'];

  function generate(nextPool=elements){
    pool=nextPool.length?[...nextPool]:elements.slice(0,20);correct=0;wrong=0;
    setMode('find');updateScore();
  }
  function setMode(next){
    mode=next;locked=false;document.getElementById('tableView').className='view table-view active '+(mode==='fill'?'mode-fill':'mode-play');
    document.querySelectorAll('[data-table-mode]').forEach(b=>b.classList.toggle('active',b.dataset.tableMode===mode));
    document.getElementById('tableInfoCard').hidden=true;document.getElementById('tableResult').hidden=true;
    if(mode==='fill'){newFill();return}
    if(mode==='explore'){target=null;setPrompt('自由探索','點擊任一元素，查看它的名稱、注音、分類與用途。','滑鼠移到格子可預覽名稱，手機直接點選。');render();return}
    nextQuestion();
  }
  function nextQuestion(){
    locked=false;clearFlashes();
    if(mode==='find'){
      target=pool[Math.floor(Math.random()*pool.length)];
      const forms=[`請點出「${target.name}」`,`請點出元素符號「${target.symbol}」`,`請找出第 ${target.number} 號元素`];
      setPrompt('找元素',forms[Math.floor(Math.random()*forms.length)],'直接在週期表上點選；不確定時可以顯示提示。');
    }else if(mode==='category'){
      const available=categories.filter(c=>pool.some(e=>e.category===c));target=available[Math.floor(Math.random()*available.length)]||'非金屬';
      setPrompt('分類挑戰',`請點出一個「${target}」元素`,'每答對一格就會自動出下一題。');
    }
    render();
  }
  function setPrompt(label,title,sub){document.getElementById('tableMissionLabel').textContent=label;document.getElementById('tablePrompt').textContent=title;document.getElementById('tableSubPrompt').textContent=sub}
  function render(showAll=false){
    table().innerHTML='';
    elements.forEach(e=>{
      const cell=document.createElement(mode==='fill'?'div':'button');cell.className='element-cell';cell.style.gridColumn=e.group;cell.style.gridRow=e.period;cell.dataset.number=e.number;
      const isHole=holes.includes(e.number);
      if(mode==='fill'&&isHole&&!showAll){cell.classList.add('hole');cell.innerHTML=`<small>${e.number}</small><input aria-label="原子序 ${e.number} 的答案" data-number="${e.number}" autocomplete="off">`}
      else{cell.innerHTML=`<small>${e.number}</small><strong>${e.symbol}</strong><span>${e.name}</span>`;if(mode!=='fill'){cell.classList.add('clickable');cell.type='button';cell.title=`${e.name}（${e.zhuyin}）｜${e.category}`;cell.setAttribute('aria-label',`${e.name}，元素符號 ${e.symbol}，原子序 ${e.number}`);cell.onclick=()=>choose(e,cell)}}
      table().appendChild(cell);
    });
    [['鑭系',8,2],['錒系',9,2]].forEach(([t,r,c])=>{const d=document.createElement('div');d.className='element-cell series-label';d.style.gridRow=r;d.style.gridColumn=c;d.textContent=t;table().appendChild(d)});
  }
  function choose(e,cell){
    showInfo(e);
    if(mode==='explore'||locked)return;
    const ok=mode==='find'?e.number===target.number:e.category===target;
    cell.classList.add(ok?'flash-correct':'flash-wrong');
    if(ok){correct++;locked=true;document.getElementById('tableSubPrompt').textContent=`答對了！${e.name}是 ${e.symbol}，原子序 ${e.number}。`;setTimeout(nextQuestion,900)}
    else{wrong++;document.getElementById('tableSubPrompt').textContent=`再找找看，${e.name}不是這題的答案。`;addMistake(e,'tableClick')}
    updateScore();updateMistakeUI();
  }
  function showInfo(e){const card=document.getElementById('tableInfoCard');card.hidden=false;card.innerHTML=`<div class="info-head"><div class="info-symbol">${e.symbol}</div><div><h3>${e.name} <small>${e.zhuyin}</small></h3><p>原子序 ${e.number} · ${e.category}</p></div></div><div class="element-info-grid"><span><b>元素符號</b><br>${e.symbol}</span><span><b>週期位置</b><br>第 ${e.period>7?e.period-2:e.period} 週期 · 第 ${e.group} 族</span><span><b>常見用途</b><br>${e.use}</span></div>`;card.scrollIntoView({behavior:'smooth',block:'nearest'})}
  function hint(){
    if(mode==='explore'){document.getElementById('tableSubPrompt').textContent='試著點一格看看，每個元素都有自己的資訊卡！';return}
    if(mode==='fill'){render(true);return}
    if(mode==='find')document.getElementById('tableSubPrompt').textContent=`提示：它的原子序是 ${target.number}，位於第 ${target.period>7?target.period-2:target.period} 週期、第 ${target.group} 族。`;
    else{const example=pool.find(e=>e.category===target);document.getElementById('tableSubPrompt').textContent=`提示：${example?example.symbol+'（'+example.name+'）是其中一個答案。':'觀察相同顏色與位置。'}`}
  }
  function skip(){if(mode==='explore')return;wrong++;updateScore();nextQuestion()}
  function updateScore(){document.getElementById('tableCorrect').textContent=correct;document.getElementById('tableWrong').textContent=wrong}
  function clearFlashes(){document.querySelectorAll('.element-cell').forEach(c=>c.classList.remove('flash-correct','flash-wrong'))}
  function newFill(){holes=shuffle([...pool]).slice(0,Math.min(Math.max(8,Math.round(pool.length*.28)),32)).map(x=>x.number);render(false);document.getElementById('tableResult').hidden=true}
  function check(){let good=0,total=holes.length;document.querySelectorAll('#periodicTable input').forEach(input=>{const e=elements[input.dataset.number-1],ok=normalize(input.value)===normalize(e.symbol)||normalize(input.value)===normalize(e.name);input.parentElement.classList.toggle('is-correct',ok);input.parentElement.classList.toggle('is-wrong',!ok);if(ok)good++;else addMistake(e,'table')});const box=document.getElementById('tableResult');box.hidden=false;box.textContent=`本次答對 ${good} / ${total} 格，正確率 ${Math.round(good/total*100)}%`;updateMistakeUI()}
  function clear(){document.querySelectorAll('#periodicTable input').forEach(i=>{i.value='';i.parentElement.classList.remove('is-correct','is-wrong')});document.getElementById('tableResult').hidden=true}
  document.querySelectorAll('[data-table-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.tableMode)));
  document.getElementById('tableHint').addEventListener('click',hint);document.getElementById('skipTable').addEventListener('click',skip);
  return{generate,render,check,clear,setMode};
})();
