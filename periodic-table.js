const PeriodicTable = (()=>{
  let holes=[];
  const el=()=>document.getElementById('periodicTable');
  function generate(pool=elements){
    const count=Math.min(Math.max(8,Math.round(pool.length*.28)),32);
    holes=shuffle([...pool]).slice(0,count).map(x=>x.number);
    render(false);
    document.getElementById('tableResult').hidden=true;
  }
  function render(showAll=false){
    el().innerHTML='';
    elements.forEach(e=>{
      const cell=document.createElement('div');
      cell.className='element-cell'; cell.style.gridColumn=e.group; cell.style.gridRow=e.period;
      const isHole=holes.includes(e.number);
      if(isHole&&!showAll){cell.classList.add('hole');cell.innerHTML=`<small>${e.number}</small><input aria-label="原子序 ${e.number} 的答案" data-number="${e.number}" autocomplete="off">`;}
      else cell.innerHTML=`<small>${e.number}</small><strong>${e.symbol}</strong><span>${e.name}</span>`;
      el().appendChild(cell);
    });
    [['鑭系',8,2],['錒系',9,2]].forEach(([t,r,c])=>{const d=document.createElement('div');d.className='element-cell series-label';d.style.gridRow=r;d.style.gridColumn=c;d.textContent=t;el().appendChild(d)});
  }
  function check(){
    let correct=0,total=holes.length;
    document.querySelectorAll('#periodicTable input').forEach(input=>{const e=elements[input.dataset.number-1],ok=normalize(input.value)===normalize(e.symbol)||normalize(input.value)===normalize(e.name);input.parentElement.classList.toggle('is-correct',ok);input.parentElement.classList.toggle('is-wrong',!ok);if(ok)correct++;else addMistake(e,'table');});
    const box=document.getElementById('tableResult');box.hidden=false;box.textContent=`本次答對 ${correct} / ${total} 格，正確率 ${Math.round(correct/total*100)}%`;
    updateMistakeUI();
  }
  function clear(){document.querySelectorAll('#periodicTable input').forEach(i=>{i.value='';i.parentElement.classList.remove('is-correct','is-wrong')});document.getElementById('tableResult').hidden=true}
  return{generate,render,check,clear};
})();
