const express=require('express'),http=require('http'),crypto=require('crypto'),{Server}=require('socket.io');
const app=express(),server=http.createServer(app),io=new Server(server),rooms=new Map();
app.use(express.static('public'));app.get('/health',(_,res)=>res.json({ok:true}));
const questions=[
['Introdução','Quais são as principais grandezas dos gases?',['Pressão, volume e temperatura','Cor, massa e brilho','Luz, som e tempo','Área, altura e peso'],0,'Pense em P, V e T.','Pressão, volume e temperatura descrevem o estado de um gás.'],
['Introdução','Qual escala de temperatura é usada nas equações dos gases?',['Celsius','Kelvin','Fahrenheit','Qualquer escala'],1,'É uma escala absoluta.','Usamos kelvin.'],
['Introdução','As partículas de um gás ideal:',['Ficam paradas','Não se movimentam','Estão em movimento constante','Têm volume enorme'],2,'Imagine partículas se movimentando.','As partículas se movem constantemente.'],
['Boyle','Na transformação isotérmica, o que é constante?',['Temperatura','Pressão','Volume','Densidade'],0,'Térmica lembra temperatura.','Temperatura constante.'],
['Boyle','Se o volume diminui, mantendo a temperatura, a pressão:',['Diminui','Aumenta','Zera','Não muda'],1,'P e V são inversamente proporcionais.','A pressão aumenta.'],
['Boyle','Qual é a equação da Lei de Boyle?',['P₁/T₁=P₂/T₂','P₁V₁=P₂V₂','V₁/T₁=V₂/T₂','PV=nRT'],1,'O produto PV é constante.','P₁V₁=P₂V₂.'],
['Charles','Na transformação isobárica, o que é constante?',['Pressão','Volume','Temperatura','Densidade'],0,'Bárica lembra pressão.','A pressão é constante.'],
['Charles','Se a temperatura absoluta dobra sob pressão constante, o volume:',['Cai pela metade','Dobra','Não muda','Zera'],1,'São diretamente proporcionais.','O volume dobra.'],
['Charles','Qual é a equação da Lei de Charles?',['P₁V₁=P₂V₂','P₁/T₁=P₂/T₂','V₁/T₁=V₂/T₂','PV=nRT'],2,'Relacione volume e temperatura.','V₁/T₁=V₂/T₂.'],
['Gay-Lussac','Na transformação isovolumétrica, o que é constante?',['Pressão','Volume','Temperatura','Energia'],1,'Está no nome: volume.','O volume é constante.'],
['Gay-Lussac','Se a temperatura absoluta aumenta com volume constante, a pressão:',['Diminui','Aumenta','Zera','Não muda'],1,'São diretamente proporcionais.','A pressão aumenta.'],
['Gay-Lussac','Qual é a relação de Gay-Lussac?',['P₁/T₁=P₂/T₂','V₁/T₁=V₂/T₂','P₁V₁=P₂V₂','PV=nRT'],0,'Relacione pressão e temperatura.','P₁/T₁=P₂/T₂.'],
['Clapeyron','Qual é a equação dos gases ideais?',['PV=nRT','P+V=nRT','PV=T/n','V=n/P'],0,'Inclui P, V, n, R e T.','PV=nRT.'],
['Clapeyron','Na equação PV=nRT, n representa:',['Número de recipientes','Quantidade de matéria em mol','Número de graus','Volume'],1,'Sua unidade é mol.','n representa a quantidade de matéria.'],
['Clapeyron','Na equação PV=nRT, R é:',['Raio','Resistência','Constante dos gases','Rendimento'],2,'É uma constante física.','R é a constante dos gases.'],
['Desafio final','Um gás ocupa 2 L a 3 atm. A temperatura é constante. Se passa a 1 L, a pressão será:',['1,5 atm','3 atm','6 atm','9 atm'],2,'Use P₁V₁=P₂V₂.','P₂=6 atm.'],
['Desafio final','Um gás ocupa 4 L a 300 K. Sob pressão constante, a 600 K ocupará:',['2 L','4 L','6 L','8 L'],3,'A temperatura dobrou.','O volume também dobra: 8 L.'],
['Desafio final','Um gás está a 2 atm e 300 K. Com volume constante, vai a 450 K. A pressão será:',['1 atm','2 atm','3 atm','4 atm'],2,'P₂=P₁×T₂/T₁.','P₂=3 atm.']
];
function state(r){return {code:r.code,stage:r.stage,index:r.index,q:r.index<0?null:{phase:questions[r.index][0],text:questions[r.index][1],options:questions[r.index][2]},players:[...r.players.values()].map(p=>({id:p.id,name:p.name,score:p.score,answered:p.answer!==null,hint:p.hint})).sort((a,b)=>b.score-a.score)}}
function sync(r){io.to(r.code).emit('state',state(r))}
io.on('connection',s=>{
s.on('create',()=>{if(s.data.code)return;let code;do{code=String(crypto.randomInt(100000,1000000))}while(rooms.has(code));let r={code,host:s.id,stage:'lobby',index:-1,players:new Map()};rooms.set(code,r);s.join(code);s.data={code,role:'host'};s.emit('joined',{role:'host',state:state(r)});sync(r)});
s.on('join',({code,name}={})=>{if(s.data.code)return;code=String(code||'').trim();name=String(name||'').trim().slice(0,18);const r=rooms.get(code);if(!r||r.stage!=='lobby')return s.emit('err','Sala não encontrada ou partida iniciada.');if(!name||[...r.players.values()].some(p=>p.name.toLowerCase()===name.toLowerCase()))return s.emit('err','Escolha outro apelido.');r.players.set(s.id,{id:s.id,name,score:0,answer:null,hint:false});s.join(code);s.data={code,role:'player'};s.emit('joined',{role:'player',state:state(r)});sync(r)});
s.on('start',()=>{const r=rooms.get(s.data.code);if(!r||r.host!==s.id||r.stage!=='lobby'||!r.players.size)return;r.index=0;r.stage='question';sync(r)});
s.on('answer',v=>{const r=rooms.get(s.data.code),p=r?.players.get(s.id);if(!p||r.stage!=='question'||p.answer!==null)return;v=Number(v);if(!Number.isInteger(v)||v<0||v>3)return;p.answer=v;const correct=v===questions[r.index][3];if(correct)p.score+=100;s.emit('answered',{correct});sync(r)});
s.on('hint',()=>{const r=rooms.get(s.data.code),p=r?.players.get(s.id);if(!p||r.stage!=='question'||p.answer!==null||p.hint)return;p.hint=true;p.score=Math.max(0,p.score-50);s.emit('hintText',questions[r.index][4]);sync(r)});
s.on('reveal',()=>{const r=rooms.get(s.data.code);if(!r||r.host!==s.id||r.stage!=='question')return;r.stage='reveal';sync(r);io.to(r.code).emit('revealAnswer',{correct:questions[r.index][3],explanation:questions[r.index][5]})});
s.on('next',()=>{const r=rooms.get(s.data.code);if(!r||r.host!==s.id||r.stage!=='reveal')return;if(r.index===questions.length-1)r.stage='finished';else{r.index++;r.stage='question';r.players.forEach(p=>{p.answer=null;p.hint=false})}sync(r)});
s.on('disconnect',()=>{const r=rooms.get(s.data.code);if(!r)return;if(r.host===s.id){io.to(r.code).emit('closed');rooms.delete(r.code)}else{r.players.delete(s.id);sync(r)}})
});server.listen(process.env.PORT||3000,'0.0.0.0');
