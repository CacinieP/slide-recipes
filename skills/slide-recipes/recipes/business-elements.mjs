/** Composable, editable business slide elements using a recipe's grid and semantic palette. */
export function createBusinessElements({ pres, t, base, text, rect, rule, image, count }) {
  const source = (s,value) => text(s,value,.55,4.79,8.9,.2,9,t.muted);
  const requireSource = value => { if (typeof value !== 'string' || !value.trim()) throw new Error('Data elements require a source/period/unit note'); };
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  return {
    executiveSummary({ title, decision, evidence, nextStep, page }) {
      count(evidence,2,3,'Executive evidence'); const s = base({title,kicker:'EXECUTIVE SUMMARY',page});
      rect(s,.55,1.87,3.2,2.7,t.dark);
      text(s,'核心决策',.8,2.1,2.7,.3,11,t.highlight,true);
      text(s,decision,.8,2.7,2.65,1.25,24,t.light,true);
      evidence.forEach((item,i)=>{
        const y=1.88+i*.83;
        text(s,String(i+1).padStart(2,'0'),4.15,y,.5,.3,12,t.accent,true);
        text(s,item,4.9,y,4.55,.58,16);rule(s,4.9,y+.67,4.55);
      });
      source(s,nextStep);return s;
    },
    kpiDashboard({ title, items, note, page }) {
      count(items,3,4,'KPI dashboard');requireSource(note);
      const s=base({title,kicker:'BUSINESS HEALTH',page}); const w=8.9/items.length;
      items.forEach((item,i)=>{
        const x=.55+i*w;
        text(s,item.label,x,1.95,w-.2,.35,14,t.muted);
        text(s,item.value,x,2.65,w-.2,.8,34,t.accent,true);
        text(s,item.change,x,3.6,w-.2,.56,14,t.ink,true);
        text(s,item.context,x,4.24,w-.2,.32,10,t.muted);
        rule(s,x,2.46,w-.25);
      });source(s,note);return s;
    },
    processFlow({ title, steps, note='', page }) {
      count(steps,3,4,'Process'); const s=base({title,kicker:'HOW IT WORKS',page}); const w=8.9/steps.length;
      steps.forEach((item,i)=>{
        const x=.55+i*w;
        text(s,String(i+1).padStart(2,'0'),x,2.0,1.15,.65,35,t.accent,true);
        if(i<steps.length-1) text(s,'→',x+w-.56,2.12,.4,.35,19,t.accent);
        rule(s,x,2.97,w-.25);text(s,item.title,x,3.2,w-.3,.52,19,t.ink,true);
        text(s,item.body,x,3.94,w-.3,.64,14,t.muted);
      });source(s,note);return s;
    },
    funnel({ title, stages, note, page }) {
      count(stages,3,5,'Funnel');requireSource(note);
      if(stages.some((s,i)=>!finite(s.value)||s.value<0||(i&&s.value>stages[i-1].value))||stages[0].value===0) throw new Error('Funnel needs non-increasing non-negative counts and a positive first stage');
      const s=base({title,kicker:'CONVERSION FUNNEL',page});
      stages.forEach((item,i)=>{
        const y=1.88+i*.55;const w=4.6*item.value/stages[0].value;
        text(s,item.label,.55,y,2,.33,14,t.ink,true);
        if(w>0) rect(s,2.8+(4.6-w)/2,y,w,.34,t.accent);
        text(s,item.value.toLocaleString('en-US'),7.7,y,1.75,.3,14,t.ink,true,{align:'right'});
      });source(s,note+' · 横条宽度按首阶段人数比例编码');return s;
    },
    gantt({ title, periods, tasks, note='', page }) {
      count(periods,4,8,'Schedule periods');count(tasks,3,5,'Schedule tasks');
      if(tasks.some(x=>!Number.isInteger(x.start)||!Number.isInteger(x.end)||x.start<0||x.end<x.start||x.end>=periods.length)) throw new Error('Schedule indexes must be integers within periods; end is inclusive');
      const s=base({title,kicker:'DELIVERY PLAN',page});const w=6.2/periods.length;
      periods.forEach((p,i)=>text(s,p,3.25+i*w,1.84,w-.06,.32,11,t.muted,false,{align:'center'}));
      tasks.forEach((task,i)=>{
        const y=2.37+i*.43;rule(s,3.25,y+.37,6.2);
        text(s,task.label,.55,y,2.45,.28,13,t.ink,true);
        rect(s,3.25+task.start*w,y+.035,(task.end-task.start+1)*w-.06,.22,t.accent);
      });source(s,note+' · 等距时间段；起止索引包含终点');return s;
    },
    quadrant({ title, xLabel, yLabel, points, note, page }) {
      count(points,1,5,'Matrix points');requireSource(note);
      if(points.some(p=>!finite(p.x)||!finite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1)) throw new Error('Matrix coordinates must be within 0–1');
      const s=base({title,kicker:'PRIORITY MATRIX',page});
      const x0=1.4,y0=2,w=4.7,h=2.45;
      rule(s,x0,y0+h,w,t.ink);rect(s,x0,y0,.01,h,t.ink);
      rule(s,x0,y0+h/2,w);rect(s,x0+w/2,y0,.008,h,t.line);
      text(s,yLabel,.55,1.7,3.8,.24,11,t.muted);
      text(s,xLabel,2.7,4.52,3.4,.22,11,t.muted,false,{align:'right'});
      points.forEach((p,i)=>{
        const cx=x0+.18+p.x*(w-.36),cy=y0+.18+(1-p.y)*(h-.36);
        s.addShape(pres.ShapeType.ellipse,{x:cx-.11,y:cy-.11,w:.22,h:.22,fill:{color:t.accent},line:{color:t.accent}});
        text(s,String(i+1),cx-.065,cy-.07,.13,.13,7,t.light,true,{align:'center'});
        text(s,`${i+1}  ${p.label}`,6.55,2.05+i*.48,2.9,.33,13,t.ink);
      });source(s,note);return s;
    },
    swot({ title, strengths, weaknesses, opportunities, threats, page }) {
      const groups=[['S / 优势',strengths],['W / 劣势',weaknesses],['O / 机会',opportunities],['T / 威胁',threats]];
      groups.forEach(([,v])=>count(v,1,2,'SWOT quadrant'));
      const s=base({title,kicker:'STRATEGIC POSITION',page});
      groups.forEach(([heading,items],i)=>{
        const x=.55+(i%2)*4.7,y=1.88+Math.floor(i/2)*1.45;
        text(s,heading,x,y,4.2,.36,18,t.accent,true);rule(s,x,y+.48,4.2);
        text(s,items.map(v=>'• '+v).join('\n'),x,y+.65,4.2,.66,14,t.ink);
      });return s;
    },
    team({ title, people, note='', page }) {
      count(people,2,3,'Team'); const s=base({title,kicker:'PEOPLE & OWNERSHIP',page});const w=8.9/people.length;
      people.forEach((p,i)=>{
        const x=.55+i*w;
        if(p.image) image(s,p.image,x,1.88,1.05,1.05);
        else {
          rect(s,x,1.88,1.05,1.05,t.dark);
          text(s,p.initials||String(i+1).padStart(2,'0'),x+.13,2.18,.79,.36,19,t.light,true,{align:'center'});
        }
        text(s,p.name,x,3.13,w-.35,.42,22,t.ink,true);
        text(s,p.role,x,3.7,w-.35,.33,14,t.accent,true);
        text(s,p.bio,x,4.22,w-.35,.48,12,t.muted);
      });source(s,note);return s;
    },
    pricing({ title, plans, note, page }) {
      count(plans,2,3,'Pricing');requireSource(note);
      const s=base({title,kicker:'OPTIONS & PRICING',page});const w=8.9/plans.length;
      plans.forEach((p,i)=>{
        count(p.features,2,3,'Plan features');const x=.55+i*w;
        if(p.recommended) text(s,'推荐方案',x,1.77,w-.35,.23,10,t.accent,true);
        text(s,p.name,x,2.13,w-.35,.48,21,t.ink,true);
        text(s,p.price,x,2.85,w-.35,.58,26,t.accent,true);
        text(s,p.period,x,3.51,w-.35,.24,11,t.muted);rule(s,x,3.9,w-.35);
        text(s,p.features.map(v=>'• '+v).join('\n'),x,4.07,w-.35,.59,11,t.ink);
      });source(s,note);return s;
    },
    testimonial({ title, quote, author, role, source: evidence, page }) {
      requireSource(evidence);const s=base({title,kicker:'CUSTOMER VOICE',page});
      text(s,'“',.55,1.93,1.0,.9,52,t.accent,true);
      text(s,quote,1.85,2.0,7.3,1.55,27,t.ink,true);
      text(s,author,1.85,3.93,6.8,.37,18,t.accent,true);
      text(s,role,1.85,4.39,6.8,.24,12,t.muted);source(s,evidence);return s;
    },
  };
}
