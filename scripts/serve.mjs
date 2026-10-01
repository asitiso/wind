import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';

const root=process.cwd();
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};

const server=http.createServer(async(req,res)=>{
  try{
    const raw=(req.url||'/').split('?')[0];
    const pathname=decodeURIComponent(raw==='/'?'/index.html':raw);
    const safe=normalize(pathname).replace(/^([.][.][\\/])+/, '');
    const file=join(root,safe);
    const info=await stat(file);
    if(!info.isFile())throw new Error('not file');
    const body=await readFile(file);
    res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'});
    res.end(body);
  }catch{
    res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});
    res.end('Not found');
  }
});
server.listen(port,'127.0.0.1',()=>console.log(`Windrise dev server: http://127.0.0.1:${port}`));
